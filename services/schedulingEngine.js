const { loadPrivateSeedData } = require('../seedProspectus');
const Course = require('../models/Course');
const mongoose = require('mongoose');

/**
 * Core Directed Acyclic Graph (DAG) Prospectus Generator
 * Retakes of failed subjects occur in subsequent terms.
 * Displaced major slots are replaced with eligible Minors/GEs, and dependent major chains shift cleanly.
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

  // Full multi-year terms simulation sequence
  const termsSequence = [
    { yearLevel: 1, semester: '1st', label: 'Year 1 • 1st Semester', maxUnits: 21 },
    { yearLevel: 1, semester: '2nd', label: 'Year 1 • 2nd Semester', maxUnits: 21 },
    { yearLevel: 1, semester: 'Summer', label: 'Year 1 • Summer Term', maxUnits: 9 },

    { yearLevel: 2, semester: '1st', label: 'Year 2 • 1st Semester', maxUnits: 21 },
    { yearLevel: 2, semester: '2nd', label: 'Year 2 • 2nd Semester', maxUnits: 21 },
    { yearLevel: 2, semester: 'Summer', label: 'Year 2 • Summer Term', maxUnits: 9 },

    { yearLevel: 3, semester: '1st', label: 'Year 3 • 1st Semester', maxUnits: 21 },
    { yearLevel: 3, semester: '2nd', label: 'Year 3 • 2nd Semester', maxUnits: 21 },
    { yearLevel: 3, semester: 'Summer', label: 'Year 3 • Summer Term', maxUnits: 9 },

    { yearLevel: 4, semester: '1st', label: 'Year 4 • 1st Semester', maxUnits: 21 },
    { yearLevel: 4, semester: '2nd', label: 'Year 4 • 2nd Semester', maxUnits: 21 },
    { yearLevel: 4, semester: 'Summer', label: 'Year 4 • Summer Term', maxUnits: 9 },

    { yearLevel: 5, semester: '1st', label: 'Year 5 • 1st Semester (Extended)', maxUnits: 21 },
    { yearLevel: 5, semester: '2nd', label: 'Year 5 • 2nd Semester (Extended)', maxUnits: 21 },
  ];

  // Helper to check if term B is strictly AFTER term A
  function isTermAfter(yearA, semA, yearB, semB) {
    if (yearB > yearA) return true;
    if (yearB < yearA) return false;
    const order = { '1st': 1, '2nd': 2, 'Summer': 3 };
    return (order[semB] || 1) > (order[semA] || 1);
  }

  // Dynamically track completed courses as we simulate term-by-term
  const currentCompleted = new Set([...passedSet].filter(c => !failedSet.has(c)));
  const pendingFailedRetakes = new Set(failedSet);
  const remainingCourses = new Set(allCourses.map(c => c.code));
  
  // Exclude completed subjects
  currentCompleted.forEach(code => remainingCourses.delete(code));

  const regeneratedTerms = [];
  let hasExtendedTerms = false;

  for (const termInfo of termsSequence) {
    if (remainingCourses.size === 0 && pendingFailedRetakes.size === 0) {
      break; // 100% of curriculum courses scheduled!
    }

    const isSummerTerm = termInfo.semester === 'Summer';
    const termMaxUnits = termInfo.maxUnits;

    let termUnits = 0;
    const termScheduled = [];
    const passedThisTerm = [];

    // -----------------------------------------------------------------------
    // STEP 1: Retake Failed Subjects (Can only happen in terms AFTER original failed term)
    // -----------------------------------------------------------------------
    for (const failedCode of Array.from(pendingFailedRetakes)) {
      const course = courseMap.get(failedCode);
      if (!course) continue;

      const canRetakeThisTerm = isTermAfter(course.yearLevel, course.semester, termInfo.yearLevel, termInfo.semester);

      if (canRetakeThisTerm) {
        // Prerequisites MUST ALREADY BE COMPLETED in a previous term (currentCompleted)
        const prereqsMet = (course.prerequisites || []).every(pre => currentCompleted.has(pre));
        if (prereqsMet && (termUnits + course.units <= termMaxUnits)) {
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
    }

    // -----------------------------------------------------------------------
    // STEP 2: Regular Curriculum Subjects (EXCLUDING FAILED SUBJECTS)
    // -----------------------------------------------------------------------
    if (!isSummerTerm) {
      const regularTermCandidates = Array.from(remainingCourses)
        .map(code => courseMap.get(code))
        .filter(c => {
          if (!c) return false;
          // Failed courses can NEVER be scheduled as regular courses!
          if (failedSet.has(c.code)) return false;
          return !isTermAfter(c.yearLevel, c.semester, termInfo.yearLevel, termInfo.semester);
        });

      for (const course of regularTermCandidates) {
        if (!remainingCourses.has(course.code)) continue;
        
        // Prerequisites must strictly be completed in a PREVIOUS term!
        const prereqsMet = (course.prerequisites || []).every(pre => currentCompleted.has(pre));
        if (prereqsMet && (termUnits + course.units <= termMaxUnits)) {
          const isDelayed = isTermAfter(course.yearLevel, course.semester, termInfo.yearLevel, termInfo.semester) || course.yearLevel < termInfo.yearLevel;

          termUnits += course.units;
          termScheduled.push({
            ...course,
            yearLevel: termInfo.yearLevel,
            semester: termInfo.semester,
            status: isDelayed ? 'delayed_unlocked' : 'regular_scheduled',
            statusLabel: isDelayed ? 'Rescheduled Subject' : 'Regular Schedule',
            isReplacement: false
          });
          passedThisTerm.push(course.code);
          remainingCourses.delete(course.code);
        }
      }
    } else {
      // Summer Term: Only schedule explicit Summer subjects or small retakes (max 9u)
      const summerCandidates = Array.from(remainingCourses)
        .map(code => courseMap.get(code))
        .filter(c => {
          if (!c) return false;
          if (failedSet.has(c.code)) return false;
          return (c.semester === 'Summer' || c.semester === '3rd' || c.semester === '3') && c.yearLevel <= termInfo.yearLevel;
        });

      for (const course of summerCandidates) {
        if (!remainingCourses.has(course.code)) continue;
        const prereqsMet = (course.prerequisites || []).every(pre => currentCompleted.has(pre));
        if (prereqsMet && (termUnits + course.units <= termMaxUnits)) {
          termUnits += course.units;
          termScheduled.push({
            ...course,
            yearLevel: termInfo.yearLevel,
            semester: termInfo.semester,
            status: 'regular_scheduled',
            statusLabel: 'Summer Course',
            isReplacement: false
          });
          passedThisTerm.push(course.code);
          remainingCourses.delete(course.code);
        }
      }
    }

    // -----------------------------------------------------------------------
    // STEP 3: Slot Replacements (Pull Forward Minors / GEs into Freed Slots)
    // -----------------------------------------------------------------------
    if (!isSummerTerm && termUnits < termMaxUnits && remainingCourses.size > 0) {
      const replacementCandidates = Array.from(remainingCourses)
        .map(code => courseMap.get(code))
        .filter(c => {
          if (!c) return false;
          if (failedSet.has(c.code)) return false;
          if (c.semester === 'Summer' || c.semester === '3rd') return false;
          const prereqsMet = (c.prerequisites || []).every(pre => currentCompleted.has(pre));
          return prereqsMet;
        })
        .sort((a, b) => {
          const isAMinor = a.code.startsWith('GE-') || a.code.startsWith('NSTP') || a.code.startsWith('TPE') || a.code.startsWith('EDM');
          const isBMinor = b.code.startsWith('GE-') || b.code.startsWith('NSTP') || b.code.startsWith('TPE') || b.code.startsWith('EDM');
          if (isAMinor && !isBMinor) return -1;
          if (!isAMinor && isBMinor) return 1;
          return a.yearLevel - b.yearLevel;
        });

      for (const course of replacementCandidates) {
        if (!remainingCourses.has(course.code)) continue;
        if (termUnits + course.units <= termMaxUnits) {
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

    // Advance passedThisTerm to currentCompleted ONLY AT END OF TERM
    passedThisTerm.forEach(code => currentCompleted.add(code));

    if (termScheduled.length > 0) {
      if (termInfo.yearLevel > 4) {
        hasExtendedTerms = true;
      }

      regeneratedTerms.push({
        yearLevel: termInfo.yearLevel,
        semester: termInfo.semester,
        label: termInfo.label,
        totalUnits: termUnits,
        maxUnits: termMaxUnits,
        courses: termScheduled
      });
    }
  }

  // Calculate graduation timeline summary
  const totalTerms = regeneratedTerms.filter(t => t.semester !== 'Summer').length;
  const extraSemesters = hasExtendedTerms ? (totalTerms - 8) : 0;

  return {
    program,
    targetYearLevel,
    targetSemester,
    maxUnits: 21,
    totalScheduledUnits: regeneratedTerms[0]?.totalUnits || 0,
    packedSchedule: regeneratedTerms[0]?.courses || [],
    regeneratedTerms,
    hasExtendedTerms,
    extraSemesters,
    graduationSummary: {
      estimatedYears: hasExtendedTerms ? (4 + extraSemesters * 0.5) : 4,
      statusMessage: hasExtendedTerms 
        ? `Extended Graduation: 4.${extraSemesters * 5} Years (+${extraSemesters} Extra Semester needed)`
        : 'On Track for 4-Year Graduation'
    },
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
