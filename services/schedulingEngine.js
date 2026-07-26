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
  completedSemestersCount = 1,
  historicalTermRecords = null, // [{ termIndex: 1, courses: [{ code, title, units, status: 'passed'|'failed' }] }]
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
  // PHASE 1: TRANSCRIPT NORMALIZATION & BLACKLIST CREATION
  // -------------------------------------------------------------------------
  const PassedCourses = new Set(passedCourses);
  const FailedOrPending = new Set(failedCourses);

  const regeneratedTerms = [];
  const historicalSummary = [];

  // Build term lookup
  const recordMap = new Map();
  if (Array.isArray(historicalTermRecords)) {
    historicalTermRecords.forEach(r => recordMap.set(r.termIndex, r));
  }

  for (let t = 1; t <= completedSemestersCount; t++) {
    const termInfo = termsSequence.find(ts => ts.termIndex === t) || {
      yearLevel: Math.ceil(t / 3),
      semester: '1st',
      label: `Term ${t}`,
      maxUnits: 21
    };

    const record = recordMap.get(t);
    let termCourseEntries = [];

    if (record && Array.isArray(record.courses) && record.courses.length > 0) {
      termCourseEntries = record.courses.map(entry => {
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
        return { course, isPassed, isFailed };
      });
    } else {
      // Auto-populate standard curriculum for unedited historical term
      const stdCourses = allCourses.filter(c => {
        if (c.yearLevel !== termInfo.yearLevel) return false;
        return isCourseOfferedInSem(c, termInfo.semester);
      });
      termCourseEntries = stdCourses.map(c => ({
        course: c,
        isPassed: !FailedOrPending.has(c.code),
        isFailed: FailedOrPending.has(c.code)
      }));
    }

    const termCourses = termCourseEntries.map(({ course, isPassed, isFailed }) => {
      if (isPassed) {
        PassedCourses.add(course.code);
        FailedOrPending.delete(course.code);
      } else if (isFailed) {
        if (!PassedCourses.has(course.code)) {
          FailedOrPending.add(course.code);
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

    const termData = {
      id: `hist_${t}`,
      yearLevel: termInfo.yearLevel,
      semester: termInfo.semester,
      label: termInfo.label,
      isCompleted: true,
      totalUnits: termCourses.reduce((sum, c) => sum + (c.units || 0), 0),
      maxUnits: termInfo.maxUnits,
      courses: termCourses
    };

    regeneratedTerms.push(termData);
    historicalSummary.push(termData);
  }

  // -------------------------------------------------------------------------
  // PHASE 2: CURRICULUM FILTERING & PREREQUISITE VERIFICATION (DAG)
  // Deduplication Pass: Filter out everything in PassedCourses (The Blacklist)
  // -------------------------------------------------------------------------
  const remainingCurriculum = allCourses.filter(course => !PassedCourses.has(course.code));
  const remainingCoursesSet = new Set(remainingCurriculum.map(c => c.code));

  // Retake Queue: Failed or pending courses not yet passed in PassedCourses
  const pendingFailedRetakes = new Set(Array.from(FailedOrPending).filter(code => !PassedCourses.has(code)));

  let highestActiveTermIndex = completedSemestersCount;

  // -------------------------------------------------------------------------
  // PHASE 3: KNAPSACK CREDIT PACKING & TIMELINE PROJECTION
  // -------------------------------------------------------------------------
  for (let i = 0; i < termsSequence.length; i++) {
    const termInfo = termsSequence[i];
    if (termInfo.termIndex <= completedSemestersCount) continue; // Skip completed historical terms

    if (remainingCoursesSet.size === 0 && pendingFailedRetakes.size === 0) {
      break; // 100% of curriculum cleared!
    }

    const isSummerTerm = termInfo.isSummer;
    const termMaxUnits = termInfo.maxUnits;

    let termUnits = 0;
    const termScheduled = [];
    const passedThisTerm = [];

    // Priority 1: Mandatory Retakes from FailedOrPending Set
    for (const failedCode of Array.from(pendingFailedRetakes)) {
      const course = courseMap.get(failedCode);
      if (!course) continue;

      const prereqsMet = (course.prerequisites || []).every(pre => PassedCourses.has(pre));
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
        pendingFailedRetakes.delete(failedCode); // Remove from queue once scheduled
        remainingCoursesSet.delete(failedCode);
      }
    }

    // Priority 2: Downstream Bottleneck Courses (Courses that unlock many future prerequisites)
    const candidatePool = Array.from(remainingCoursesSet)
      .map(code => courseMap.get(code))
      .filter(c => {
        if (!c) return false;
        if (pendingFailedRetakes.has(c.code)) return false;
        
        const isSemOffered = isCourseOfferedInSem(c, termInfo.semester);
        if (!isSemOffered) return false;

        const prereqsMet = (c.prerequisites || []).every(pre => PassedCourses.has(pre));
        return prereqsMet;
      })
      .sort((a, b) => {
        // Bottleneck sorting: prioritize courses that unlock the most downstream subjects!
        const aUnlockCount = (a.ifPassCanTake || []).length;
        const bUnlockCount = (b.ifPassCanTake || []).length;
        if (bUnlockCount !== aUnlockCount) return bUnlockCount - aUnlockCount;

        // Standing waiver: courses without prereqs can be pulled forward into earlier slots
        if (a.yearLevel !== b.yearLevel) return a.yearLevel - b.yearLevel;

        const aMinor = isMinorCourse(a.code);
        const bMinor = isMinorCourse(b.code);
        if (!aMinor && bMinor) return -1;
        if (aMinor && !bMinor) return 1;
        return 0;
      });

    for (const course of candidatePool) {
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

    // Priority 3: Electives and Minors (Editable / Swappable)
    if (!isSummerTerm && termUnits < termMaxUnits && remainingCoursesSet.size > 0) {
      const minorCandidates = Array.from(remainingCoursesSet)
        .map(code => courseMap.get(code))
        .filter(c => {
          if (!c) return false;
          if (!isMinorCourse(c.code)) return false;
          const prereqsMet = (c.prerequisites || []).every(pre => PassedCourses.has(pre));
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

    // Advance passedThisTerm into PassedCourses for subsequent terms
    passedThisTerm.forEach(code => PassedCourses.add(code));

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

  // Extension & Delay Calculation
  const totalRegularTermsCount = regeneratedTerms.filter(t => !t.semester.includes('Summer')).length;
  const lastScheduledTerm = regeneratedTerms[regeneratedTerms.length - 1];

  const completedUnits = Array.from(PassedCourses).reduce((sum, code) => {
    const c = courseMap.get(code);
    return sum + (c ? c.units : 0);
  }, 0);

  const totalCurriculumUnits = allCourses.reduce((sum, c) => sum + c.units, 0);
  const remainingUnits = Math.max(0, totalCurriculumUnits - completedUnits);

  const isDelayed = totalRegularTermsCount > 8 || (lastScheduledTerm && lastScheduledTerm.yearLevel > 4);
  const extraSemesters = isDelayed ? Math.max(1, totalRegularTermsCount - 8) : 0;

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
    historicalSummary,
    regeneratedTerms,
    dagNodes: allCourses.map(c => {
      const isFailed = pendingFailedRetakes.has(c.code);
      const isPassed = PassedCourses.has(c.code);
      const prereqsMet = (c.prerequisites || []).every(p => PassedCourses.has(p));

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
