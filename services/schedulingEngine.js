const { loadPrivateSeedData } = require('../seedProspectus');
const Course = require('../models/Course');
const mongoose = require('mongoose');

/**
 * Core Directed Acyclic Graph (DAG) Prospectus Generator for Irregular Students
 */
async function generateProspectusSchedule({
  program = 'IT',
  passedCourses = [],
  failedCourses = [],
  completedSemestersCount = 1, // Number of terms already finished by student
  customTermPlans = {}, // Optional manual overrides by student for specific terms
  exceptionFlags = {}
}) {
  // 1. Fetch Course Catalog for selected Program
  let allCourses = [];
  try {
    if (mongoose.connection.readyState === 1) {
      allCourses = await Course.find({ program }).lean();
    }
  } catch (err) {
    console.warn('⚡ Using memory seed fallback for course database:', err.message);
  }

  if (!allCourses || allCourses.length === 0) {
    const fallbackData = loadPrivateSeedData();
    allCourses = fallbackData.filter(c => c.program === program);
  }

  const courseMap = new Map(allCourses.map(c => [c.code, c]));
  const passedSet = new Set(passedCourses);
  const failedSet = new Set(failedCourses);

  // Define master full sequence of academic terms
  const termsSequence = [
    { id: 'y1s1', yearLevel: 1, semester: '1st', label: 'Year 1 • 1st Semester', maxUnits: 21, termIndex: 1 },
    { id: 'y1s2', yearLevel: 1, semester: '2nd', label: 'Year 1 • 2nd Semester', maxUnits: 21, termIndex: 2 },
    { id: 'y1sum', yearLevel: 1, semester: 'Summer', label: 'Year 1 • Summer Term', maxUnits: 9, termIndex: 3, isSummer: true },

    { id: 'y2s1', yearLevel: 2, semester: '1st', label: 'Year 2 • 1st Semester', maxUnits: 21, termIndex: 4 },
    { id: 'y2s2', yearLevel: 2, semester: '2nd', label: 'Year 2 • 2nd Semester', maxUnits: 21, termIndex: 5 },
    { id: 'y2sum', yearLevel: 2, semester: 'Summer', label: 'Year 2 • Summer Term', maxUnits: 9, termIndex: 6, isSummer: true },

    { id: 'y3s1', yearLevel: 3, semester: '1st', label: 'Year 3 • 1st Semester', maxUnits: 21, termIndex: 7 },
    { id: 'y3s2', yearLevel: 3, semester: '2nd', label: 'Year 3 • 2nd Semester', maxUnits: 21, termIndex: 8 },
    { id: 'y3sum', yearLevel: 3, semester: 'Summer', label: 'Year 3 • Summer Term', maxUnits: 9, termIndex: 9, isSummer: true },

    { id: 'y4s1', yearLevel: 4, semester: '1st', label: 'Year 4 • 1st Semester', maxUnits: 21, termIndex: 10 },
    { id: 'y4s2', yearLevel: 4, semester: '2nd', label: 'Year 4 • 2nd Semester', maxUnits: 21, termIndex: 11 },
    { id: 'y4sum', yearLevel: 4, semester: 'Summer', label: 'Year 4 • Summer Term', maxUnits: 9, termIndex: 12, isSummer: true },

    { id: 'y5s1', yearLevel: 5, semester: '1st', label: 'Year 5 • 1st Semester (Extended)', maxUnits: 21, termIndex: 13 },
    { id: 'y5s2', yearLevel: 5, semester: '2nd', label: 'Year 5 • 2nd Semester (Extended)', maxUnits: 21, termIndex: 14 },
    { id: 'y5sum', yearLevel: 5, semester: 'Summer', label: 'Year 5 • Summer Term (Extended)', maxUnits: 9, termIndex: 15, isSummer: true }
  ];

  // Helper to test if a course is a minor / GE subject
  function isMinorCourse(code) {
    if (!code) return false;
    const upper = code.toUpperCase();
    return upper.startsWith('GE-') || upper.startsWith('NSTP') || upper.startsWith('TPE') || upper.startsWith('EDM');
  }

  // Helper to check semester term offering compatibility
  function isCourseOfferedInSem(course, semType) {
    if (!course) return false;
    if (isMinorCourse(course.code)) return true; // Minors offered every semester

    const sem = String(course.semester).toLowerCase();
    const targetSem = String(semType).toLowerCase();

    if (targetSem.includes('1st') && (sem.includes('1st') || sem === '1')) return true;
    if (targetSem.includes('2nd') && (sem.includes('2nd') || sem === '2')) return true;
    if (targetSem.includes('summer') && (sem.includes('summer') || sem.includes('3rd') || sem === '3')) return true;

    return false;
  }

  // Track completed & remaining courses dynamically
  const currentCompleted = new Set([...passedSet].filter(c => !failedSet.has(c)));
  const pendingFailedRetakes = new Set(failedSet);
  const remainingCourses = new Set(allCourses.map(c => c.code));

  // Remove completed subjects from remaining
  currentCompleted.forEach(code => remainingCourses.delete(code));

  const regeneratedTerms = [];
  let hasExtendedTerms = false;
  let highestActiveTermIndex = 1;

  // Process term by term
  for (let i = 0; i < termsSequence.length; i++) {
    const termInfo = termsSequence[i];
    const isCompletedTerm = termInfo.termIndex <= completedSemestersCount;

    if (remainingCourses.size === 0 && pendingFailedRetakes.size === 0 && !isCompletedTerm) {
      break; // All curriculum subjects successfully scheduled
    }

    if (isCompletedTerm) {
      // ---------------------------------------------------------------------
      // COMPLETED TERM (Historical Record based on user audit)
      // ---------------------------------------------------------------------
      // Find standard courses for this year/sem in catalog
      const stdCourses = allCourses.filter(c => {
        if (c.yearLevel !== termInfo.yearLevel) return false;
        const sem = String(c.semester).toLowerCase();
        const tSem = String(termInfo.semester).toLowerCase();
        if (tSem.includes('1st') && (sem.includes('1st') || sem === '1')) return true;
        if (tSem.includes('2nd') && (sem.includes('2nd') || sem === '2')) return true;
        if (tSem.includes('summer') && (sem.includes('summer') || sem.includes('3rd') || sem === '3')) return true;
        return false;
      });

      // Filter based on user's passed/failed inputs or manual passed list
      const completedTermCourses = stdCourses.map(c => {
        const isFailed = failedSet.has(c.code);
        const isPassed = passedSet.has(c.code) || (!isFailed && currentCompleted.has(c.code));

        if (isPassed) {
          currentCompleted.add(c.code);
          remainingCourses.delete(c.code);
        } else if (isFailed) {
          pendingFailedRetakes.add(c.code);
        }

        return {
          ...c,
          yearLevel: termInfo.yearLevel,
          semester: termInfo.semester,
          status: isFailed ? 'failed_historical' : (isPassed ? 'passed_historical' : 'unspecified'),
          statusLabel: isFailed ? 'Failed Subject' : 'Passed',
          isMinor: isMinorCourse(c.code),
          isReplacement: false
        };
      });

      regeneratedTerms.push({
        id: termInfo.id,
        yearLevel: termInfo.yearLevel,
        semester: termInfo.semester,
        label: termInfo.label,
        isCompleted: true,
        totalUnits: completedTermCourses.reduce((sum, c) => sum + c.units, 0),
        maxUnits: termInfo.maxUnits,
        courses: completedTermCourses
      });

      highestActiveTermIndex = termInfo.termIndex;
      continue;
    }

    // -----------------------------------------------------------------------
    // FUTURE TERM (Auto-Scheduled by Engine)
    // -----------------------------------------------------------------------
    const isSummerTerm = termInfo.isSummer;
    const termMaxUnits = termInfo.maxUnits;

    let termUnits = 0;
    const termScheduled = [];
    const passedThisTerm = [];

    // STEP 1: Retake Failed Subjects
    for (const failedCode of Array.from(pendingFailedRetakes)) {
      const course = courseMap.get(failedCode);
      if (!course) continue;

      const prereqsMet = (course.prerequisites || []).every(pre => currentCompleted.has(pre));
      if (prereqsMet && (termUnits + course.units <= termMaxUnits)) {
        termUnits += course.units;
        termScheduled.push({
          ...course,
          yearLevel: termInfo.yearLevel,
          semester: termInfo.semester,
          status: 'retake_required',
          statusLabel: 'Retake Subject',
          isMinor: isMinorCourse(course.code),
          isReplacement: false
        });
        passedThisTerm.push(failedCode);
        pendingFailedRetakes.delete(failedCode);
        remainingCourses.delete(failedCode);
      }
    }

    // STEP 2: Regular & Same-Semester Cross-Year Subjects
    const termCandidates = Array.from(remainingCourses)
      .map(code => courseMap.get(code))
      .filter(c => {
        if (!c) return false;
        if (failedSet.has(c.code)) return false;
        
        const isSemOffered = isCourseOfferedInSem(c, termInfo.semester);
        if (!isSemOffered) return false;

        // Prerequisite check: MUST be satisfied by previous completed terms
        const prereqsMet = (c.prerequisites || []).every(pre => currentCompleted.has(pre));
        return prereqsMet;
      })
      .sort((a, b) => {
        // Priority: lower year level first, then core subjects before minors
        if (a.yearLevel !== b.yearLevel) return a.yearLevel - b.yearLevel;
        const aMinor = isMinorCourse(a.code);
        const bMinor = isMinorCourse(b.code);
        if (!aMinor && bMinor) return -1;
        if (aMinor && !bMinor) return 1;
        return 0;
      });

    for (const course of termCandidates) {
      if (!remainingCourses.has(course.code)) continue;

      if (termUnits + course.units <= termMaxUnits) {
        const isDelayed = course.yearLevel < termInfo.yearLevel;
        const isAdvance = course.yearLevel > termInfo.yearLevel;

        termUnits += course.units;
        termScheduled.push({
          ...course,
          yearLevel: termInfo.yearLevel,
          semester: termInfo.semester,
          status: isDelayed ? 'delayed_unlocked' : (isAdvance ? 'advance_unlocked' : 'regular_scheduled'),
          statusLabel: isDelayed ? 'Rescheduled Subject' : (isAdvance ? 'Advanced Subject' : 'Regular Schedule'),
          isMinor: isMinorCourse(course.code),
          isReplacement: false
        });
        passedThisTerm.push(course.code);
        remainingCourses.delete(course.code);
      }
    }

    // STEP 3: Slot Fillers with Minors / General Education (GEs)
    if (!isSummerTerm && termUnits < termMaxUnits && remainingCourses.size > 0) {
      const minorCandidates = Array.from(remainingCourses)
        .map(code => courseMap.get(code))
        .filter(c => {
          if (!c) return false;
          if (!isMinorCourse(c.code)) return false;
          const prereqsMet = (c.prerequisites || []).every(pre => currentCompleted.has(pre));
          return prereqsMet;
        });

      for (const course of minorCandidates) {
        if (!remainingCourses.has(course.code)) continue;

        if (termUnits + course.units <= termMaxUnits) {
          termUnits += course.units;
          termScheduled.push({
            ...course,
            yearLevel: termInfo.yearLevel,
            semester: termInfo.semester,
            status: 'minor_replaced',
            statusLabel: 'Minor (Editable)',
            isMinor: true,
            isReplacement: true
          });
          passedThisTerm.push(course.code);
          remainingCourses.delete(course.code);
        }
      }
    }

    // Mark passed this term for subsequent future terms
    passedThisTerm.forEach(code => currentCompleted.add(code));

    if (termScheduled.length > 0) {
      if (termInfo.yearLevel > 4) {
        hasExtendedTerms = true;
      }

      highestActiveTermIndex = termInfo.termIndex;

      regeneratedTerms.push({
        id: termInfo.id,
        yearLevel: termInfo.yearLevel,
        semester: termInfo.semester,
        label: termInfo.label,
        isCompleted: false,
        totalUnits: termUnits,
        maxUnits: termMaxUnits,
        courses: termScheduled
      });
    }
  }

  // Calculate graduation metrics & delay breakdown
  const regularTotalTerms = regeneratedTerms.filter(t => !t.semester.includes('Summer')).length;
  const completedUnits = Array.from(currentCompleted).reduce((sum, code) => {
    const c = courseMap.get(code);
    return sum + (c ? c.units : 0);
  }, 0);

  const totalCurriculumUnits = allCourses.reduce((sum, c) => sum + c.units, 0);
  const remainingUnits = Math.max(0, totalCurriculumUnits - completedUnits);

  const extraSemesters = hasExtendedTerms ? Math.max(0, regularTotalTerms - 8) : 0;
  const graduationYear = new Date().getFullYear() + Math.ceil((12 - completedSemestersCount) / 3);

  return {
    program,
    completedSemestersCount,
    completedUnits,
    totalCurriculumUnits,
    remainingUnits,
    hasExtendedTerms,
    extraSemesters,
    highestActiveTermIndex,
    graduationSummary: {
      estimatedYears: hasExtendedTerms ? (4 + extraSemesters * 0.5) : 4,
      targetGraduationTerm: `AY ${graduationYear - 1}-${graduationYear} ${hasExtendedTerms ? 'Extended' : '2nd Sem'}`,
      statusMessage: hasExtendedTerms
        ? `Delayed by ${extraSemesters} Semester(s) (+${extraSemesters} Extended Term)`
        : 'On Track for Graduation'
    },
    regeneratedTerms,
    dagNodes: allCourses.map(c => {
      const isFailed = failedSet.has(c.code);
      const isPassed = passedSet.has(c.code) || currentCompleted.has(c.code);
      const prereqsMet = (c.prerequisites || []).every(p => currentCompleted.has(p));

      let state = 'locked';
      if (isPassed) state = 'completed';
      else if (isFailed) state = 'failed';
      else if (prereqsMet) state = 'available';

      return {
        id: c.code,
        title: c.title,
        units: c.units,
        yearLevel: c.yearLevel,
        semester: c.semester,
        prerequisites: c.prerequisites || [],
        isMinor: isMinorCourse(c.code),
        state
      };
    })
  };
}

module.exports = { generateProspectusSchedule };
