const { loadPrivateSeedData } = require('../seedProspectus');
const Course = require('../models/Course');
const mongoose = require('mongoose');

/**
 * Core 3-Step Directed Acyclic Graph (DAG) Multi-Term Prospectus Regeneration Engine
 */
async function generateProspectusSchedule({
  program = 'IT',
  passedCourses = [],
  failedCourses = [],
  targetYearLevel = 1,
  targetSemester = '2nd',
  exceptionFlags = {}
}) {
  // 1. Fetch Course Nodes for Program
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

  // Define terms sequence for full 4 to 5 year simulation
  const termsSequence = [
    { yearLevel: 1, semester: '1st', label: 'Year 1 • 1st Semester' },
    { yearLevel: 1, semester: '2nd', label: 'Year 1 • 2nd Semester' },
    { yearLevel: 1, semester: 'Summer', label: 'Year 1 • Summer Term' },
    { yearLevel: 2, semester: '1st', label: 'Year 2 • 1st Semester' },
    { yearLevel: 2, semester: '2nd', label: 'Year 2 • 2nd Semester' },
    { yearLevel: 2, semester: 'Summer', label: 'Year 2 • Summer Term' },
    { yearLevel: 3, semester: '1st', label: 'Year 3 • 1st Semester' },
    { yearLevel: 3, semester: '2nd', label: 'Year 3 • 2nd Semester' },
    { yearLevel: 3, semester: 'Summer', label: 'Year 3 • Summer Term' },
    { yearLevel: 4, semester: '1st', label: 'Year 4 • 1st Semester' },
    { yearLevel: 4, semester: '2nd', label: 'Year 4 • 2nd Semester' },
    { yearLevel: 4, semester: 'Summer', label: 'Year 4 • Summer Term' },
    { yearLevel: 5, semester: '1st', label: 'Year 5 • 1st Semester (Extended)' },
    { yearLevel: 5, semester: '2nd', label: 'Year 5 • 2nd Semester (Extended)' },
  ];

  // Track completed courses dynamically as we simulate term-by-term
  const currentCompleted = new Set([...passedSet].filter(c => !failedSet.has(c)));
  const pendingFailedRetakes = new Set(failedSet);
  const remainingCourses = new Set(allCourses.map(c => c.code));
  
  // Remove already completed courses
  currentCompleted.forEach(code => remainingCourses.delete(code));

  const regeneratedTerms = [];
  const maxUnitsPerTerm = 21;

  for (const termInfo of termsSequence) {
    if (remainingCourses.size === 0 && pendingFailedRetakes.size === 0) {
      break; // All courses completed!
    }

    let termUnits = 0;
    const termScheduled = [];
    const passedThisTerm = [];

    // -----------------------------------------------------------------------
    // PRIORITY 1: Retake Failed Courses First
    // -----------------------------------------------------------------------
    for (const failedCode of Array.from(pendingFailedRetakes)) {
      const course = courseMap.get(failedCode);
      if (!course) continue;

      // Check if prerequisites for retake are cleared
      const prereqsMet = (course.prerequisites || []).every(pre => currentCompleted.has(pre));
      if (prereqsMet && (termUnits + course.units <= maxUnitsPerTerm)) {
        termUnits += course.units;
        termScheduled.push({
          ...course,
          yearLevel: termInfo.yearLevel,
          semester: termInfo.semester,
          status: 'retake_required',
          statusLabel: 'Retake Subject',
          isReplacement: false
        });
        passedThisTerm.push(failedCode);
        pendingFailedRetakes.delete(failedCode);
        remainingCourses.delete(failedCode);
      }
    }

    // -----------------------------------------------------------------------
    // PRIORITY 2: Regular Term Courses (Prerequisites Met)
    // -----------------------------------------------------------------------
    const regularTermCandidates = Array.from(remainingCourses)
      .map(code => courseMap.get(code))
      .filter(c => c && c.yearLevel === termInfo.yearLevel && (c.semester === termInfo.semester || c.semester === '1st' || c.semester === '2nd'));

    for (const course of regularTermCandidates) {
      if (!remainingCourses.has(course.code)) continue;
      
      const prereqsMet = (course.prerequisites || []).every(pre => currentCompleted.has(pre));
      if (prereqsMet && (termUnits + course.units <= maxUnitsPerTerm)) {
        termUnits += course.units;
        termScheduled.push({
          ...course,
          yearLevel: termInfo.yearLevel,
          semester: termInfo.semester,
          status: 'regular_scheduled',
          statusLabel: 'Regular Schedule',
          isReplacement: false
        });
        passedThisTerm.push(course.code);
        remainingCourses.delete(course.code);
      }
    }

    // -----------------------------------------------------------------------
    // PRIORITY 3: Slot Replacements (Pull Forward Minors / GE / No-Prereq Subjects)
    // -----------------------------------------------------------------------
    // If unit space remains because a major was locked by a failed prerequisite,
    // fill the slot with eligible Minor/GE subjects or higher-year subjects with no prereqs!
    if (termUnits < maxUnitsPerTerm && remainingCourses.size > 0) {
      const replacementCandidates = Array.from(remainingCourses)
        .map(code => courseMap.get(code))
        .filter(c => {
          if (!c) return false;
          // Must have prerequisites met
          const prereqsMet = (c.prerequisites || []).every(pre => currentCompleted.has(pre));
          return prereqsMet;
        })
        .sort((a, b) => {
          // Prioritize Minors, GE, PE, NSTP
          const isAMinor = a.code.startsWith('GE-') || a.code.startsWith('NSTP') || a.code.startsWith('TPE') || a.code.startsWith('EDM');
          const isBMinor = b.code.startsWith('GE-') || b.code.startsWith('NSTP') || b.code.startsWith('TPE') || b.code.startsWith('EDM');
          if (isAMinor && !isBMinor) return -1;
          if (!isAMinor && isBMinor) return 1;
          return a.yearLevel - b.yearLevel;
        });

      for (const course of replacementCandidates) {
        if (!remainingCourses.has(course.code)) continue;
        if (termUnits + course.units <= maxUnitsPerTerm) {
          const isPulledForward = course.yearLevel > termInfo.yearLevel;
          const isMinor = course.code.startsWith('GE-') || course.code.startsWith('NSTP') || course.code.startsWith('TPE') || course.code.startsWith('EDM');

          termUnits += course.units;
          termScheduled.push({
            ...course,
            yearLevel: termInfo.yearLevel,
            semester: termInfo.semester,
            status: isMinor ? 'minor_replaced' : 'pulled_forward',
            statusLabel: isMinor ? 'Replaced with Minor' : 'Pulled Forward',
            isReplacement: true
          });
          passedThisTerm.push(course.code);
          remainingCourses.delete(course.code);
        }
      }
    }

    // Advance completed subjects at end of term
    passedThisTerm.forEach(code => currentCompleted.add(code));

    if (termScheduled.length > 0) {
      regeneratedTerms.push({
        yearLevel: termInfo.yearLevel,
        semester: termInfo.semester,
        label: termInfo.label,
        totalUnits: termUnits,
        courses: termScheduled
      });
    }
  }

  // Critical path warnings
  const criticalPathWarnings = Array.from(failedSet).map(code => {
    const course = courseMap.get(code);
    return {
      code,
      title: course?.title || code,
      message: `[${code}] was marked failed. Locked downstream prerequisites were automatically replaced with eligible minor/GE subjects, and major retakes were rescheduled.`
    };
  });

  return {
    program,
    targetYearLevel,
    targetSemester,
    maxUnits: maxUnitsPerTerm,
    totalScheduledUnits: regeneratedTerms[0]?.totalUnits || 0,
    packedSchedule: regeneratedTerms[0]?.courses || [],
    regeneratedTerms,
    blockedPool: [],
    criticalPathWarnings,
    dagNodes: allCourses.map(c => ({
      id: c.code,
      title: c.title,
      units: c.units,
      yearLevel: c.yearLevel,
      semester: c.semester,
      state: failedSet.has(c.code) ? 'failed' : (passedSet.has(c.code) ? 'completed' : 'unlocked')
    }))
  };
}

module.exports = { generateProspectusSchedule };
