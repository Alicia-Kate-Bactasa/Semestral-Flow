const { loadPrivateSeedData } = require('../seedProspectus');
const Course = require('../models/Course');
const mongoose = require('mongoose');

/**
 * Core Directed Acyclic Graph (DAG) Prospectus Generator for Irregular Students
 * Strict Rules:
 * 1. Global CompletedSet (Blacklist): Every course passed in history is permanently excluded from future scheduling.
 * 2. Deduplication Pass: Remaining curriculum = masterCurriculum.filter(course => !completedSet.has(course.code)).
 * 3. Failed Course Priority Re-insertion: Failed retakes scheduled into very next available term where prereqs are met.
 */
async function generateProspectusSchedule({
  program = 'IT',
  passedCourses = [],
  failedCourses = [],
  completedSemestersCount = 1,
  historicalTermRecords = null, // [{ termIndex: 1, courses: [{ code, status: 'passed'|'failed' }] }]
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

  // Master sequence of academic terms
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
    { id: 'y5sum', yearLevel: 5, semester: 'Summer', label: 'Year 5 • Summer Term (Extended)', maxUnits: 9, termIndex: 15, isSummer: true },

    { id: 'y6s1', yearLevel: 6, semester: '1st', label: 'Year 6 • 1st Semester (Extended)', maxUnits: 21, termIndex: 16 },
    { id: 'y6s2', yearLevel: 6, semester: '2nd', label: 'Year 6 • 2nd Semester (Extended)', maxUnits: 21, termIndex: 17 }
  ];

  function isMinorCourse(code) {
    if (!code) return false;
    const upper = code.toUpperCase();
    return upper.startsWith('GE-') || upper.startsWith('NSTP') || upper.startsWith('TPE') || upper.startsWith('EDM');
  }

  function isCourseOfferedInSem(course, semType) {
    if (!course) return false;
    if (isMinorCourse(course.code)) return true;

    const sem = String(course.semester).toLowerCase();
    const targetSem = String(semType).toLowerCase();

    if (targetSem.includes('1st') && (sem.includes('1st') || sem === '1')) return true;
    if (targetSem.includes('2nd') && (sem.includes('2nd') || sem === '2')) return true;
    if (targetSem.includes('summer') && (sem.includes('summer') || sem.includes('3rd') || sem === '3')) return true;

    return false;
  }

  // -------------------------------------------------------------------------
  // RULE 1: BUILD GLOBAL CompletedSet (THE BLACKLIST) & FailedSet
  // -------------------------------------------------------------------------
  const completedSet = new Set(passedCourses);
  const failedSet = new Set(failedCourses);

  const regeneratedTerms = [];

  if (Array.isArray(historicalTermRecords)) {
    historicalTermRecords.forEach(record => {
      if (record.termIndex <= completedSemestersCount && Array.isArray(record.courses)) {
        const termInfo = termsSequence.find(t => t.termIndex === record.termIndex) || {
          yearLevel: Math.ceil(record.termIndex / 3),
          semester: '1st',
          label: `Term ${record.termIndex}`,
          maxUnits: 21
        };

        const termCourses = record.courses.map(entry => {
          const course = courseMap.get(entry.code) || {
            code: entry.code,
            title: entry.title || entry.code,
            units: entry.units || 3,
            yearLevel: termInfo.yearLevel,
            semester: termInfo.semester,
            prerequisites: []
          };

          const isPassed = entry.status === 'passed';
          const isFailed = entry.status === 'failed';

          if (isPassed) {
            completedSet.add(course.code);
            failedSet.delete(course.code); // Un-fail if passed in any term!
          } else if (isFailed) {
            if (!completedSet.has(course.code)) {
              failedSet.add(course.code);
            }
          }

          return {
            ...course,
            yearLevel: termInfo.yearLevel,
            semester: termInfo.semester,
            status: isFailed ? 'failed_historical' : (isPassed ? 'passed_historical' : 'unspecified'),
            statusLabel: isFailed ? 'Failed Subject' : 'Passed',
            isMinor: isMinorCourse(course.code),
            isReplacement: false
          };
        });

        regeneratedTerms.push({
          id: `hist_${record.termIndex}`,
          yearLevel: termInfo.yearLevel,
          semester: termInfo.semester,
          label: termInfo.label,
          isCompleted: true,
          totalUnits: termCourses.reduce((sum, c) => sum + (c.units || 0), 0),
          maxUnits: termInfo.maxUnits,
          courses: termCourses
        });
      }
    });
  }

  // -------------------------------------------------------------------------
  // RULE 2: DEDUPLICATION PASS ON THE CURRICULUM MASTER TREE
  // Filter out ANY course that exists in completedSet (The Blacklist)
  // -------------------------------------------------------------------------
  const remainingCurriculumList = allCourses.filter(course => !completedSet.has(course.code));
  const remainingCoursesSet = new Set(remainingCurriculumList.map(c => c.code));

  // Pending failed retakes pool (must not be in completedSet)
  const pendingFailedRetakes = new Set(Array.from(failedSet).filter(code => !completedSet.has(code)));

  let highestActiveTermIndex = completedSemestersCount;

  // -------------------------------------------------------------------------
  // RULE 3: SCHEDULE REMAINING FUTURE TERMS WITH FAILED RETAKE PRIORITY
  // -------------------------------------------------------------------------
  for (let i = 0; i < termsSequence.length; i++) {
    const termInfo = termsSequence[i];
    if (termInfo.termIndex <= completedSemestersCount) continue; // Skip completed historical terms

    if (remainingCoursesSet.size === 0 && pendingFailedRetakes.size === 0) {
      break; // 100% of curriculum completed!
    }

    const isSummerTerm = termInfo.isSummer;
    const termMaxUnits = termInfo.maxUnits;

    let termUnits = 0;
    const termScheduled = [];
    const passedThisTerm = [];

    // STEP 1: Highest Priority -> Re-insert Pending Failed Retakes
    for (const failedCode of Array.from(pendingFailedRetakes)) {
      const course = courseMap.get(failedCode);
      if (!course) continue;

      const prereqsMet = (course.prerequisites || []).every(pre => completedSet.has(pre));
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
        pendingFailedRetakes.delete(failedCode); // Remove from pending once scheduled!
        remainingCoursesSet.delete(failedCode);
      }
    }

    // STEP 2: Regular Curriculum Candidates
    const termCandidates = Array.from(remainingCoursesSet)
      .map(code => courseMap.get(code))
      .filter(c => {
        if (!c) return false;
        if (pendingFailedRetakes.has(c.code)) return false;
        
        const isSemOffered = isCourseOfferedInSem(c, termInfo.semester);
        if (!isSemOffered) return false;

        const prereqsMet = (c.prerequisites || []).every(pre => completedSet.has(pre));
        return prereqsMet;
      })
      .sort((a, b) => {
        if (a.yearLevel !== b.yearLevel) return a.yearLevel - b.yearLevel;
        const aMinor = isMinorCourse(a.code);
        const bMinor = isMinorCourse(b.code);
        if (!aMinor && bMinor) return -1;
        if (aMinor && !bMinor) return 1;
        return 0;
      });

    for (const course of termCandidates) {
      if (!remainingCoursesSet.has(course.code)) continue;

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
        remainingCoursesSet.delete(course.code);
      }
    }

    // STEP 3: Minor Slot Replacements
    if (!isSummerTerm && termUnits < termMaxUnits && remainingCoursesSet.size > 0) {
      const minorCandidates = Array.from(remainingCoursesSet)
        .map(code => courseMap.get(code))
        .filter(c => {
          if (!c) return false;
          if (!isMinorCourse(c.code)) return false;
          const prereqsMet = (c.prerequisites || []).every(pre => completedSet.has(pre));
          return prereqsMet;
        });

      for (const course of minorCandidates) {
        if (!remainingCoursesSet.has(course.code)) continue;

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
          remainingCoursesSet.delete(course.code);
        }
      }
    }

    // Advance passedThisTerm into completedSet for subsequent terms
    passedThisTerm.forEach(code => completedSet.add(code));

    if (termScheduled.length > 0) {
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
  const totalRegularTermsScheduled = regeneratedTerms.filter(t => !t.semester.includes('Summer')).length;
  const lastScheduledTerm = regeneratedTerms[regeneratedTerms.length - 1];

  const completedUnits = Array.from(completedSet).reduce((sum, code) => {
    const c = courseMap.get(code);
    return sum + (c ? c.units : 0);
  }, 0);

  const totalCurriculumUnits = allCourses.reduce((sum, c) => sum + c.units, 0);
  const remainingUnits = Math.max(0, totalCurriculumUnits - completedUnits);

  const isDelayed = totalRegularTermsScheduled > 8 || (lastScheduledTerm && lastScheduledTerm.yearLevel > 4);
  const extraSemesters = isDelayed ? Math.max(1, totalRegularTermsScheduled - 8) : 0;

  const gradSemLabel = lastScheduledTerm ? lastScheduledTerm.label : 'Year 4 • 2nd Semester';

  return {
    program,
    completedSemestersCount,
    completedUnits,
    totalCurriculumUnits,
    remainingUnits,
    hasExtendedTerms: isDelayed,
    extraSemesters,
    highestActiveTermIndex,
    graduationSummary: {
      estimatedYears: isDelayed ? (4 + extraSemesters * 0.5) : 4,
      targetGraduationTerm: `${gradSemLabel} (${isDelayed ? `Delayed by ${extraSemesters} Sem${extraSemesters > 1 ? 's' : ''}` : 'On Track'})`,
      statusMessage: isDelayed
        ? `Delayed by ${extraSemesters} Semester(s) (+${extraSemesters * 0.5} Year Extension)`
        : 'On Track for 4-Year Graduation'
    },
    regeneratedTerms,
    dagNodes: allCourses.map(c => {
      const isFailed = pendingFailedRetakes.has(c.code);
      const isPassed = completedSet.has(c.code);
      const prereqsMet = (c.prerequisites || []).every(p => completedSet.has(p));

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
