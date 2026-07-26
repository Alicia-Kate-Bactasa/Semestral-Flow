const { loadPrivateSeedData } = require('../seedProspectus');
const Course = require('../models/Course');
const mongoose = require('mongoose');

/**
 * Core 3-Step Directed Acyclic Graph (DAG) Scheduling Pipeline
 */
async function generateProspectusSchedule({
  program = 'IT',
  passedCourses = [],
  failedCourses = [],
  targetYearLevel = 2,
  targetSemester = '1st',
  exceptionFlags = {}
}) {
  const {
    courseOverride = false,
    overload = false,
    simultaneous = false,
    petitionNeeded = false
  } = exceptionFlags;

  // 1. Fetch Course Nodes for Program (Instant fallback if DB disconnected)
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

  // Maximum unit load
  const maxUnits = overload ? 27 : 21;

  // =========================================================================
  // STEP 1: FORWARD TRAVERSAL / BLOCKED VECTOR CALCULATION (DFS/BFS DAG)
  // =========================================================================
  // Find all courses transitively locked out because a prerequisite was failed
  const blockedVectorMap = new Map(); // courseCode -> { directBlocker, fullChain: [] }

  // Build Adjacency List for Downstream Dependency: Parent Course -> Child Courses
  const downstreamAdj = new Map();
  allCourses.forEach(c => {
    (c.prerequisites || []).forEach(pre => {
      if (!downstreamAdj.has(pre)) downstreamAdj.set(pre, []);
      downstreamAdj.get(pre).push(c.code);
    });
    // Also include explicit ifFailCannotTake rules
    (c.ifFailCannotTake || []).forEach(failChild => {
      if (!downstreamAdj.has(c.code)) downstreamAdj.set(c.code, []);
      if (!downstreamAdj.get(c.code).includes(failChild)) {
        downstreamAdj.get(c.code).push(failChild);
      }
    });
  });

  // Recursive BFS/DFS to propagate blocked status down the graph
  function traverseBlockedVector(failedCode, rootCauseCode, visited = new Set()) {
    const children = downstreamAdj.get(failedCode) || [];
    for (const childCode of children) {
      if (visited.has(childCode)) continue;
      visited.add(childCode);

      if (!blockedVectorMap.has(childCode)) {
        blockedVectorMap.set(childCode, {
          courseCode: childCode,
          directBlocker: failedCode,
          rootCause: rootCauseCode,
          blockedBy: [failedCode, rootCauseCode]
        });
      }
      // Recursive step down the DAG
      traverseBlockedVector(childCode, rootCauseCode, visited);
    }
  }

  // Execute Forward Traversal for all failed courses
  failedSet.forEach(failedCode => {
    traverseBlockedVector(failedCode, failedCode);
  });

  // =========================================================================
  // STEP 2: ELIGIBLE POOL EXTRACTION
  // =========================================================================
  const eligiblePool = [];
  const blockedPool = [];
  const backlogPool = []; // Failed courses from earlier terms that must be retaken

  const currentStandingYear = targetYearLevel;

  allCourses.forEach(course => {
    const isPassed = passedSet.has(course.code) && !failedSet.has(course.code);
    if (isPassed) return; // Exclude completed subjects

    const isFailed = failedSet.has(course.code);
    const isTargetTerm = (course.yearLevel === targetYearLevel && course.semester === targetSemester);
    const isEarlierTerm = (course.yearLevel < targetYearLevel) || 
                         (course.yearLevel === targetYearLevel && isTermBefore(course.semester, targetSemester));

    // Check Standing Requirements
    let standingCheckPassed = true;
    if (course.standingRequirement && course.standingRequirement !== 'None') {
      const requiredYear = parseInt(course.standingRequirement, 10);
      if (!isNaN(requiredYear) && currentStandingYear < requiredYear) {
        standingCheckPassed = false;
      }
    }

    // Check Prerequisite Blocking
    const missingPrereqs = (course.prerequisites || []).filter(pre => {
      if (failedSet.has(pre)) return true;
      if (!passedSet.has(pre)) {
        return true;
      }
      return false;
    });

    const isBlockedByDAG = missingPrereqs.length > 0 || blockedVectorMap.has(course.code);

    let status = 'eligible';
    let exceptionActive = false;

    if (isFailed) {
      status = 'retake_required';
      backlogPool.push(course);
    } else if (!standingCheckPassed) {
      status = 'standing_blocked';
    } else if (isBlockedByDAG) {
      if (courseOverride) {
        status = 'override_waived';
        exceptionActive = true;
      } else if (simultaneous) {
        status = 'simultaneous_coenroll';
        exceptionActive = true;
      } else if (petitionNeeded) {
        status = 'petition_requested';
        exceptionActive = true;
      } else {
        status = 'prereq_blocked';
      }
    }

    const itemPayload = {
      ...course,
      status,
      missingPrereqs,
      blockedBy: blockedVectorMap.get(course.code)?.blockedBy || missingPrereqs,
      downstreamCount: (downstreamAdj.get(course.code) || []).length,
      exceptionActive
    };

    if (status === 'prereq_blocked' || status === 'standing_blocked') {
      blockedPool.push(itemPayload);
    } else if (isTargetTerm || isFailed || (isEarlierTerm && !isPassed)) {
      eligiblePool.push(itemPayload);
    }
  });

  // Helper to determine term ordering
  function isTermBefore(semA, semB) {
    const order = { '1st': 1, '2nd': 2, 'Summer': 3 };
    return (order[semA] || 1) < (order[semB] || 1);
  }

  // =========================================================================
  // STEP 3: KNAPSACK OPTIMIZATION (TERM PACKING & CRITICAL PATH PRIORITY)
  // =========================================================================
  eligiblePool.forEach(item => {
    let priority = 50;
    if (item.status === 'retake_required') {
      priority += 50; // Critical path retake
    }
    if (item.downstreamCount > 0) {
      priority += (item.downstreamCount * 10);
    }
    if (item.code.startsWith('GE-') || item.code.startsWith('NSTP') || item.code.startsWith('TPE')) {
      priority -= 20; // De-prioritize general education if unit space is tight
    }
    item.priorityScore = priority;
  });

  // Sort eligible candidates by priority score descending
  eligiblePool.sort((a, b) => b.priorityScore - a.priorityScore);

  const packedSchedule = [];
  const unitCappedPool = [];
  let currentUnits = 0;

  for (const candidate of eligiblePool) {
    if (currentUnits + candidate.units <= maxUnits) {
      currentUnits += candidate.units;
      packedSchedule.push({
        ...candidate,
        scheduled: true
      });
    } else {
      unitCappedPool.push({
        ...candidate,
        status: 'unit_capped',
        scheduled: false,
        reason: `Exceeds term capacity of ${maxUnits} units.`
      });
    }
  }

  // Critical Path Warnings
  const criticalPathWarnings = blockedPool.map(b => ({
    code: b.code,
    title: b.title,
    blockedBy: b.blockedBy,
    message: `[${b.code}] ${b.title} is locked because prerequisite (${b.blockedBy.join(', ')}) was not completed. Delays ${b.downstreamCount} downstream subjects.`
  }));

  // Visual DAG Graph Structure for frontend Canvas / Graph renderers
  const dagNodes = allCourses.map(c => {
    let state = 'unlocked';
    if (passedSet.has(c.code)) state = 'completed';
    else if (failedSet.has(c.code)) state = 'failed';
    else if (blockedVectorMap.has(c.code)) state = 'blocked';
    else if (packedSchedule.some(ps => ps.code === c.code)) state = 'enrolled';

    return {
      id: c.code,
      label: `${c.code}`,
      title: c.title,
      units: c.units,
      yearLevel: c.yearLevel,
      semester: c.semester,
      prerequisites: c.prerequisites || [],
      downstream: downstreamAdj.get(c.code) || [],
      state
    };
  });

  return {
    program,
    targetYearLevel,
    targetSemester,
    maxUnits,
    totalScheduledUnits: currentUnits,
    isOverloaded: currentUnits > 21,
    exceptionFlags,
    packedSchedule,
    unitCappedPool,
    blockedPool,
    criticalPathWarnings,
    dagNodes,
    blockedVector: Array.from(blockedVectorMap.values())
  };
}

module.exports = { generateProspectusSchedule };
