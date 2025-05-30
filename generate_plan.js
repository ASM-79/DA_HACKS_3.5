// const { deanzaCourses } = require('./sample_db');

/**
 * Generate an optimal course plan based on prerequisite chains
 * 
 * @param {Array} chains - Prerequisite chains for the required courses
 * @param {Object} constraints - User constraints (start term, max units, etc.)
 * @returns {Object} - Optimized course plan
 */
function generateOptimalPlan(chains, constraints) {  
  // Default constraints
  const {
    startTerm = "Fall 2023",
    maxUnitsPerTerm = 15,
    minUnitsPerTerm = 12,
    maxTerms = 1,
    avoidTerms = [],
    avoidCourses = [],
    finishFastest = false
  } = constraints || {};
  
  
  // Store courses with no articulated equivalents
  const noEquivalentCourses = chains.noEquivalentCourses || [];
  
  // 1. Flatten chains into a list of courses with levels
  const courses = flattenChains(chains);
  
  // 2. Sort courses by level (highest first - these are the deepest prerequisites)
  courses.sort((a, b) => calculateCoursePriority(b, constraints) - calculateCoursePriority(a, constraints));
  
  // 3. Generate term sequence
  const terms = generateTermSequence(startTerm, maxTerms);
  
  // 4. Initialize term allocation
  const termAllocation = terms.map(term => ({
    name: term,
    courses: [],
    units: 0,
    isAvoidTerm: avoidTerms.includes(term)  // Flag avoid terms
  }));
  
  // 5. Track allocated courses
  const allocatedCourses = new Set();
  
  // Track courses and their alternatives
  const alternativeGroups = new Map();
  
  // Identify alternative course groups
  courses.forEach(course => {
    if (course.alternatives && course.alternatives.length > 0) {
      // Create a sorted list of this course and its alternatives
      const allCodes = [course.code, ...course.alternatives].sort();
      const groupKey = allCodes.join('|');
      
      if (!alternativeGroups.has(groupKey)) {
        alternativeGroups.set(groupKey, allCodes);
      }
    }
  });
  
  // Add to course objects
  const coreqMap = {
    "PHYS 4A": ["MATH 1B"], // Can take PHYS 4A with MATH 1B concurrently
    "CHEM 1B": ["CHEM 1BL"] // Chemistry and lab concurrently
  };
  
  // Track which courses must be taken together
  const linkedCourseSets = chains.courseGroups || [];
  const coreqGroups = new Map();
  
  // Set up co-requisite groups
  linkedCourseSets.forEach(group => {
    // For sequential courses, the prerequisites already handle the ordering
    if (!group.isSequential) {
      // For non-sequential linked courses (like lecture + lab), add them as co-requisites
      group.courses.forEach(code => {
        if (!coreqGroups.has(code)) {
          coreqGroups.set(code, []);
        }
        coreqGroups.get(code).push(...group.courses.filter(c => c !== code));
      });
    }
  });
  
  // Update the coreqMap with these relationships
  coreqGroups.forEach((coreqs, courseCode) => {
    if (!coreqMap[courseCode]) {
      coreqMap[courseCode] = [];
    }
    coreqMap[courseCode].push(...coreqs);
  });
  
  // Skip any terms in the avoid list when first allocating courses
  const validTerms = termAllocation.filter(term => !term.isAvoidTerm);
  
  // 6. First pass: allocate courses by level
  for (let level = 0; level <= Math.max(...courses.map(c => c.level)); level++) {
    const coursesAtLevel = courses.filter(c => c.level === level);
    
    coursesAtLevel.forEach(course => {
      // Skip if already allocated
      if (allocatedCourses.has(course.code)) return;
      
      // Check if this is part of an alternative group
      let isPartOfAllocatedAlternative = false;
      alternativeGroups.forEach((codes) => {
        if (codes.includes(course.code) && 
            codes.some(code => allocatedCourses.has(code) && code !== course.code)) {
          isPartOfAllocatedAlternative = true;
        }
      });
      
      // Skip if we've already allocated an alternative
      if (isPartOfAllocatedAlternative) {
        console.log(`Skipping ${course.code} as an alternative is already allocated`);
        return;
      }
      
      // NEW: Check if this course should be avoided and has alternatives
      if (avoidCourses.includes(course.code) && course.alternatives?.length > 0) {
        // Only avoid if we have alternatives that aren't also in the avoid list
        const viableAlternatives = course.alternatives.filter(
          alt => !avoidCourses.includes(alt)
        );
        
        if (viableAlternatives.length > 0) {
          console.log(`Skipping ${course.code} as it's in the avoid list and has alternatives`);
          return;
        }
      }
      
      // Check if this course has alternatives and if it's the best option
      if (course.alternatives && course.alternatives.length > 0) {
        // Find all courses in this alternative group
        const altGroup = [course.code, ...course.alternatives];
        
        // Score each alternative based on constraints
        const scoredAlts = altGroup.map(code => {
          const altCourse = courses.find(c => c.code === code);
          if (!altCourse) return { code, score: -1 };
          
          let score = 0;
          
          // Prefer courses with fewer prerequisites
          score -= (altCourse.prerequisites?.length || 0) * 2;
          
          // Prefer courses offered in more terms
          score += (altCourse.termsOffered?.length || 0) * 3;
          
          // Prefer courses with lower units (if close to max)
          score += (15 - altCourse.units);
          
          // NEW: Heavily penalize courses in the avoid list
          if (avoidCourses.includes(code)) {
            score -= 50;
          }
          
          return { code, score };
        });
        
        // Sort by score (highest first)
        scoredAlts.sort((a, b) => b.score - a.score);
        
        // If this course isn't the best alternative, skip it
        if (scoredAlts[0].code !== course.code) {
          console.log(`Skipping ${course.code} as ${scoredAlts[0].code} is a better alternative`);
          return;
        }
      }
      
      // Find earliest possible term
      let earliestTerm = 0;
      
      // Check if all prerequisites are met
      (course.prerequisites || []).forEach(prereq => {
        // Check if this is a strict prereq or can be taken concurrently
        const isCoreq = coreqMap[course.code]?.includes(prereq);
        
        if (isCoreq) {
          // For coreqs, they can be in the same term
          // So we don't need to advance earliestTerm
        } else {
          // For strict prereqs, find which term contains the prerequisite
          for (let i = 0; i < termAllocation.length; i++) {
            if (termAllocation[i].courses.some(c => c.code === prereq)) {
              // This prerequisite is in term i, so the course must be in term i+1 or later
              earliestTerm = Math.max(earliestTerm, i + 1);
              break;
            }
          }
        }
      });
      
      // Find first term with room starting from earliest possible
      for (let i = earliestTerm; i < termAllocation.length; i++) {
        const term = termAllocation[i];
        
        // FIXED: Skip terms in the avoid list
        if (term.isAvoidTerm) {
          continue;
        }
        
        // Skip if course not offered this term
        if (course.termsOffered && !course.termsOffered.includes(term.name.split(' ')[0])) {
          continue;
        }
        
        // When allocating a course, check if it has linked courses
        if (course.linkedCourses && course.linkedCourses.length > 0 && !course.isPartOfSequence) {
          // For non-sequential linked courses, try to allocate all courses in the same term
          const linkedCourses = course.linkedCourses
            .map(code => courses.find(c => c.code === code))
            .filter(c => c && !allocatedCourses.has(c.code));
          
          // Calculate total units for the course and all its linked courses
          const totalUnits = course.units + linkedCourses.reduce((sum, c) => sum + c.units, 0);
          
          // Check if we can fit all linked courses in this term
          if (term.units + totalUnits <= maxUnitsPerTerm) {
            // Add all linked courses to this term
            term.courses.push({
              code: course.code,
              name: course.name,
              units: course.units,
              prerequisites: course.prerequisites || [],
              alternatives: course.alternatives || [],
              linkedCourses: course.linkedCourses,
              isPartOfSequence: course.isPartOfSequence,
              additionalNotes: course.additionalNotes || ""
            });
            term.units += course.units;
            allocatedCourses.add(course.code);
            
            // Add all linked courses
            linkedCourses.forEach(linkedCourse => {
              term.courses.push({
                code: linkedCourse.code,
                name: linkedCourse.name,
                units: linkedCourse.units,
                prerequisites: linkedCourse.prerequisites || [],
                alternatives: linkedCourse.alternatives || [],
                linkedCourses: linkedCourse.linkedCourses,
                isPartOfSequence: linkedCourse.isPartOfSequence,
                additionalNotes: linkedCourse.additionalNotes || ""
              });
              term.units += linkedCourse.units;
              allocatedCourses.add(linkedCourse.code);
            });
          }
        } else {
          if (term.units + course.units <= maxUnitsPerTerm) {
            // Add course to term
            term.courses.push({
              code: course.code,
              name: course.name,
              units: course.units,
              prerequisites: course.prerequisites || [],
              alternatives: course.alternatives || [],
              linkedCourses: course.linkedCourses,
              isPartOfSequence: course.isPartOfSequence,
              additionalNotes: course.additionalNotes || ""
            });
            term.units += course.units;
            allocatedCourses.add(course.code);
            
            // CRITICAL FIX: Mark all alternatives as allocated too
            if (course.alternatives && course.alternatives.length > 0) {
              course.alternatives.forEach(altCode => {
                console.log(`Marking alternative ${altCode} as allocated`);
                allocatedCourses.add(altCode);
              });
            }
            
            break;
          }
        }
      }
    });
  }
  
  // If finishFastest is true, try to compact the schedule
  if (finishFastest) {
    maximizeTermUnits(termAllocation, courses, allocatedCourses, maxUnitsPerTerm);
  }
  
  // Add a new block to enforce minUnitsPerTerm
  // Make sure each term has at least minUnitsPerTerm units
  enforceMinUnitsPerTerm(termAllocation, courses, allocatedCourses, minUnitsPerTerm);
  
  // After all allocations, verify no term exceeds the unit limit
  termAllocation.forEach((term, termIndex) => {
    // If this term exceeds max units, move courses to the next term
    while (term.units > maxUnitsPerTerm && term.courses.length > 0) {
      console.log(`Enforcing max units: ${term.name} has ${term.units} units (max: ${maxUnitsPerTerm})`);
      
      // Find the smallest course that isn't needed as a prerequisite for other courses in this term
      let courseToMove = null;
      let courseIndex = -1;
      
      for (let i = 0; i < term.courses.length; i++) {
        const course = term.courses[i];
        // Check if this course is a prerequisite for any other course in this term
        const isPrereqForOthers = term.courses.some(c => 
          c.prerequisites && c.prerequisites.includes(course.code)
        );
        
        if (!isPrereqForOthers && (courseToMove === null || course.units < courseToMove.units)) {
          courseToMove = course;
          courseIndex = i;
        }
      }
      
      // If we couldn't find a non-prerequisite course, take the smallest course
      if (courseToMove === null) {
        courseIndex = term.courses
          .map((c, i) => ({ units: c.units, index: i }))
          .sort((a, b) => a.units - b.units)[0].index;
        courseToMove = term.courses[courseIndex];
      }
      
      // Remove from current term
      term.courses.splice(courseIndex, 1);
      term.units -= courseToMove.units;
      
      // Add to next term if available
      if (termIndex < termAllocation.length - 1) {
        const nextTerm = termAllocation[termIndex + 1];
        nextTerm.courses.push(courseToMove);
        nextTerm.units += courseToMove.units;
      } else {
        // Create a new term if needed
        const lastTerm = termAllocation[termAllocation.length - 1];
        const [quarter, year] = lastTerm.name.split(' ');
        
        // Calculate next term name
        const quarterSequence = ['Fall', 'Winter', 'Spring', 'Summer'];
        let quarterIndex = quarterSequence.indexOf(quarter);
        let nextQuarter = quarterSequence[(quarterIndex + 1) % 4];
        let nextYear = parseInt(year);
        if (nextQuarter === 'Fall') nextYear++;
        
        const newTerm = {
          name: `${nextQuarter} ${nextYear}`,
          courses: [courseToMove],
          units: courseToMove.units,
          isAvoidTerm: false
        };
        
        termAllocation.push(newTerm);
      }
    }
  });
  
  // 8. Remove empty terms and format the final plan
  const finalPlan = {
    startTerm: termAllocation[0].name,
    endTerm: termAllocation[termAllocation.length - 1].name,
    totalUnits: termAllocation.reduce((sum, term) => sum + term.units, 0),
    terms: termAllocation.filter(term => term.courses.length > 0),
    noEquivalentCourses: noEquivalentCourses // Include courses with no equivalents
  };
  
  return finalPlan;
}

/**
 * Flatten prerequisite chains into a list of courses with levels
 * 
 * @param {Array} chains - Prerequisite chains
 * @returns {Array} - Flattened list of courses with levels
 */
function flattenChains(chains) {
  const courseMap = {};
  
  function processChain(chain) {
    const courseCode = chain.course.code;
    
    // If we've already processed this course, update its level if necessary
    if (courseMap[courseCode]) {
      courseMap[courseCode].level = Math.max(
        courseMap[courseCode].level, 
        chain.level
      );
    } else {
      // Add the course to the map
      courseMap[courseCode] = {
        ...chain.course,
        level: chain.level,
        prerequisites: chain.prerequisites.map(p => p.course.code),
        alternatives: chain.course.alternatives || [],
        linkedCourses: chain.course.linkedCourses || [],
        isPartOfSequence: chain.course.isPartOfSequence || false,
        isPartialEquivalent: chain.course.isPartialEquivalent || false,
        additionalNotes: chain.course.additionalNotes || ""
      };
    }
    
    // Process all prerequisites
    chain.prerequisites.forEach(processChain);
  }
  
  // Process all chains
  chains.forEach(processChain);
  
  // Store course groups for later use in allocation
  if (chains.courseGroups) {
    courseMap.courseGroups = chains.courseGroups;
  }
  
  // Convert the map to an array
  return Object.values(courseMap);
}

/**
 * Generate a sequence of academic terms
 * 
 * @param {String} startTerm - Term to start from (e.g., "Fall 2023")
 * @param {Number} count - Number of terms to generate
 * @returns {Array} - List of term names
 */
function generateTermSequence(startTerm, count) {
  const terms = [];
  
  // Parse start term
  const [startQuarter, startYear] = startTerm.split(' ');
  let currentQuarter = startQuarter;
  let currentYear = parseInt(startYear);
  
  // Quarter progression
  const quarterSequence = ['Fall', 'Winter', 'Spring', 'Summer'];
  
  // Find starting index in quarter sequence
  let quarterIndex = quarterSequence.indexOf(startQuarter);
  
  for (let i = 0; i < count; i++) {
    // Add current term
    terms.push(`${currentQuarter} ${currentYear}`);
    
    // Move to next quarter
    quarterIndex = (quarterIndex + 1) % quarterSequence.length;
    currentQuarter = quarterSequence[quarterIndex];
    
    // Increment year if we've gone through all quarters
    if (currentQuarter === 'Fall') {
      currentYear++;
    }
  }
  
  return terms;
}

function calculateCoursePriority(course, constraints) {
  let priority = course.level * 10; // Base priority from level
  
  // Add priority for courses with many dependents
  if (course.dependents && course.dependents.length > 0) {
    priority += course.dependents.length * 5;
  }
  
  // Prioritize courses offered less frequently
  if (course.termsOffered) {
    if (course.termsOffered.length === 1) priority += 15;
    else if (course.termsOffered.length === 2) priority += 10;
    else if (course.termsOffered.length === 3) priority += 5;
  }
  
  // User preferences (if provided)
  if (constraints.priorityCourses && 
      constraints.priorityCourses.includes(course.code)) {
    priority += 20;
  }
  
  // NEW: Lower priority for courses in the avoid list
  if (constraints.avoidCourses &&
      constraints.avoidCourses.includes(course.code)) {
    priority -= 15;
  }
  
  return priority;
}

// Add a special flag for GE courses
// deanzaCourses.forEach(course => {
//   if (course.category === "General Education") {
//     courseMap[course.code].isGE = true;
//     courseMap[course.code].geArea = course.geArea; // e.g., "1A", "3B", etc.
//   }
// });

// When generating the plan
function balanceWithGE(plan, constraints) {
  // For each term that has room for more units
  plan.forEach((term, termIndex) => {
    if (term.units < constraints.minUnitsPerTerm) {
      // Find GE courses that could fit
      const geCourses = courses.filter(c => 
        c.isGE && 
        !allocatedCourses.has(c.code) &&
        c.units <= (constraints.maxUnitsPerTerm - term.units)
      );
      
      // Pick a GE course that fits best
      if (geCourses.length > 0) {
        // Sort by area to ensure variety
        geCourses.sort((a, b) => {
          // Prioritize areas we haven't fulfilled yet
          const fulfilledAreas = new Set(
            plan.flatMap(t => t.courses)
              .filter(c => c.isGE)
              .map(c => c.geArea)
          );
          
          if (fulfilledAreas.has(a.geArea) && !fulfilledAreas.has(b.geArea)) {
            return 1;
          }
          if (!fulfilledAreas.has(a.geArea) && fulfilledAreas.has(b.geArea)) {
            return -1;
          }
          return 0;
        });
        
        // Add the best GE course to this term
        term.courses.push(geCourses[0]);
        term.units += geCourses[0].units;
        allocatedCourses.add(geCourses[0].code);
      }
    }
  });
}

const mustBeContinuous = [
  ["CHEM 1A", "CHEM 1B", "CHEM 1C"],
  ["PHYS 4A", "PHYS 4B", "PHYS 4C"]
];

// After initial allocation
function ensureContinuousSequences(plan) {
  mustBeContinuous.forEach(sequence => {
    // Find terms for each course in sequence
    const termIndices = {};
    sequence.forEach(code => {
      for (let i = 0; i < plan.length; i++) {
        if (plan[i].courses.some(c => c.code === code)) {
          termIndices[code] = i;
          break;
        }
      }
    });
    
    // Check if sequence is continuous
    for (let i = 1; i < sequence.length; i++) {
      const prev = sequence[i-1];
      const curr = sequence[i];
      
      if (termIndices[prev] !== undefined && 
          termIndices[curr] !== undefined &&
          termIndices[curr] - termIndices[prev] !== 1) {
        
        // Need to fix - move current course to follow previous
        const targetTermIndex = termIndices[prev] + 1;
        if (targetTermIndex < plan.length) {
          // Extract course
          const sourceTermIndex = termIndices[curr];
          const sourceTerm = plan[sourceTermIndex];
          const courseIndex = sourceTerm.courses.findIndex(c => c.code === curr);
          const course = sourceTerm.courses[courseIndex];
          
          // Remove from source term
          sourceTerm.courses.splice(courseIndex, 1);
          sourceTerm.units -= course.units;
          
          // Add to target term
          plan[targetTermIndex].courses.push(course);
          plan[targetTermIndex].units += course.units;
          termIndices[curr] = targetTermIndex;
        }
      }
    }
  });
}

function generateCalendarView(plan) {
  // Create detailed calendar data for UI
  return plan.terms.map(term => {
    const [quarter, year] = term.name.split(' ');
    
    // Get term dates
    const termDates = getTermDates(quarter, year);
    
    return {
      name: term.name,
      startDate: termDates.start,
      endDate: termDates.end,
      finalExams: termDates.finals,
      courses: term.courses.map(course => ({
        ...course,
        schedule: generateCourseSchedule(course, quarter),
        color: getCourseColor(course.category)
      }))
    };
  });
}

function generateCourseSchedule(course, quarter) {
  // This would typically come from a course catalog database
  // But for demonstration, we'll generate plausible schedules
  const days = ['Monday', 'Wednesday', 'Friday'];
  const startTimes = ['8:30', '10:30', '12:30', '14:30', '16:30'];
  
  // Pseudo-random but consistent for the same course
  const dayIndex = course.code.charCodeAt(0) % days.length;
  const timeIndex = course.code.charCodeAt(course.code.length-1) % startTimes.length;
  
  return {
    days: [days[dayIndex], days[(dayIndex+2) % days.length]],
    startTime: startTimes[timeIndex],
    endTime: addMinutes(startTimes[timeIndex], course.units * 20),
    location: `Building ${(course.code.charCodeAt(1) % 5) + 1}, Room ${100 + (course.code.charCodeAt(2) % 50)}`
  };
}

// Function to implement finishFastest constraint by maximizing units in each term
function maximizeTermUnits(termAllocation, allCourses, allocatedCourses, maxUnitsPerTerm) {
  // For each term, try to fill it up to close to the max units
  termAllocation.forEach((term, termIndex) => {
    // Skip terms that are already within 1-2 units of max
    if (term.units >= maxUnitsPerTerm - 2) {
      return; // Already optimized
    }
    
    // Calculate how many more units we can add
    const remainingUnits = maxUnitsPerTerm - term.units;
    
    if (remainingUnits < 3) {
      return; // Not enough room to add meaningful courses
    }
    
    // Find courses that:
    // 1. Haven't been allocated yet
    // 2. Have all prerequisites satisfied by earlier terms
    // 3. Are offered in this term
    // 4. Would fit within the remaining units
    
    const eligibleCourses = allCourses.filter(course => {
      // Skip if already allocated
      if (allocatedCourses.has(course.code)) return false;
      
      // Skip if course is too large for remaining space
      if (course.units > remainingUnits) return false;
      
      // Check if this term supports this course
      const termName = term.name.split(' ')[0]; // Extract quarter (Fall, Winter, etc.)
      if (course.termsOffered && !course.termsOffered.includes(termName)) {
        return false;
      }
      
      // Check if all prerequisites are met by earlier terms
      const prereqsMet = (course.prerequisites || []).every(prereq => {
        // Check if prereq is in earlier terms
        for (let i = 0; i < termIndex; i++) {
          if (termAllocation[i].courses.some(c => c.code === prereq)) {
            return true;
          }
        }
        return false;
      });
      
      return prereqsMet;
    });
    
    // Sort eligible courses by units (descending) to maximize units per term
    eligibleCourses.sort((a, b) => b.units - a.units);
    
    // Try to add courses until we're close to the max units
    for (const course of eligibleCourses) {
      // Double check that we're not going over the max
      if (term.units + course.units <= maxUnitsPerTerm) {
        // Add course to term
        term.courses.push({
          code: course.code,
          name: course.name,
          units: course.units,
          prerequisites: course.prerequisites || [],
          alternatives: course.alternatives || [],
          additionalNotes: course.additionalNotes || ""
        });
        term.units += course.units;
        allocatedCourses.add(course.code);
        
        // Mark all alternatives as allocated too
        if (course.alternatives && course.alternatives.length > 0) {
          course.alternatives.forEach(altCode => {
            console.log(`Marking alternative ${altCode} as allocated`);
            allocatedCourses.add(altCode);
          });
        }
        
        // If we're now within 1-2 units of max, stop adding courses
        if (maxUnitsPerTerm - term.units <= 2) {
          break;
        }
      }
    }
  });
}

// Modified enforceMinUnitsPerTerm function
function enforceMinUnitsPerTerm(termAllocation, allCourses, allocatedCourses, minUnitsPerTerm) {
  // Skip the last term - it's okay if the final term has fewer units
  for (let termIndex = 0; termIndex < termAllocation.length - 1; termIndex++) {
    const term = termAllocation[termIndex];
    
    // Skip avoid terms - don't try to fill them with minimum units
    if (term.isAvoidTerm) {
      console.log(`Skipping minimum units enforcement for avoided term: ${term.name}`);
      // Remove any courses that might have been allocated to this term
      if (term.courses.length > 0) {
        console.log(`Removing ${term.courses.length} courses from avoided term ${term.name}`);
        
        // Move these courses to the next non-avoided term
        let nextTermIndex = termIndex + 1;
        while (nextTermIndex < termAllocation.length && termAllocation[nextTermIndex].isAvoidTerm) {
          nextTermIndex++;
        }
        
        if (nextTermIndex < termAllocation.length) {
          const nextTerm = termAllocation[nextTermIndex];
          term.courses.forEach(course => {
            nextTerm.courses.push(course);
            nextTerm.units += course.units;
            console.log(`Moved ${course.code} from avoided term ${term.name} to ${nextTerm.name}`);
          });
        }
        
        // Clear the avoided term
        term.courses = [];
        term.units = 0;
      }
      continue;
    }
    
    // Skip if already meeting minimum
    if (term.units >= minUnitsPerTerm) {
      continue;
    }
    
    console.log(`Term ${term.name} has only ${term.units} units (min: ${minUnitsPerTerm}). Looking for additional courses...`);
    
    // Calculate how many more units we need
    const neededUnits = minUnitsPerTerm - term.units;
    
    // Find courses that:
    // 1. Haven't been allocated yet
    // 2. Have all prerequisites satisfied by earlier terms
    // 3. Are offered in this term
    // 4. Would help reach the minimum units
    const eligibleCourses = allCourses.filter(course => {
      // Skip if already allocated
      if (allocatedCourses.has(course.code)) return false;
      
      // Check if this term supports this course
      const termName = term.name.split(' ')[0]; // Extract quarter (Fall, Winter, etc.)
      if (course.termsOffered && !course.termsOffered.includes(termName)) {
        return false;
      }
      
      // Check if all prerequisites are met by earlier terms
      const prereqsMet = (course.prerequisites || []).every(prereq => {
        // Check if prereq is in earlier terms
        for (let i = 0; i < termIndex; i++) {
          if (!termAllocation[i].isAvoidTerm && termAllocation[i].courses.some(c => c.code === prereq)) {
            return true;
          }
        }
        return false;
      });
      
      return prereqsMet;
    });
    
    // Sort eligible courses by units (prefer smaller courses that can fit)
    eligibleCourses.sort((a, b) => a.units - b.units);
    
    // Try to add courses until we meet the minimum units
    for (const course of eligibleCourses) {
      // Add course to term
      term.courses.push({
        code: course.code,
        name: course.name,
        units: course.units,
        prerequisites: course.prerequisites || [],
        alternatives: course.alternatives || [],
        additionalNotes: course.additionalNotes || ""
      });
      term.units += course.units;
      allocatedCourses.add(course.code);
      
      // Mark all alternatives as allocated too
      if (course.alternatives && course.alternatives.length > 0) {
        course.alternatives.forEach(altCode => {
          console.log(`Marking alternative ${altCode} as allocated`);
          allocatedCourses.add(altCode);
        });
      }
      
      // If we've met the minimum, stop adding courses
      if (term.units >= minUnitsPerTerm) {
        break;
      }
    }
    
    // If we still haven't met the minimum, try pulling forward courses from later terms
    if (term.units < minUnitsPerTerm) {
      for (let laterTermIndex = termIndex + 1; laterTermIndex < termAllocation.length; laterTermIndex++) {
        const laterTerm = termAllocation[laterTermIndex];
        
        // Skip avoided terms when looking for courses to move
        if (laterTerm.isAvoidTerm) continue;
        
        // Find movable courses (no prerequisites in the same term)
        const movableCourses = laterTerm.courses.filter(course => {
          return !laterTerm.courses.some(c => 
            c.prerequisites && c.prerequisites.includes(course.code)
          );
        });
        
        // Sort by smallest first for minimal disruption
        movableCourses.sort((a, b) => a.units - b.units);
        
        for (const course of movableCourses) {
          // Check if prerequisites are met in earlier terms
          const prereqsMet = (course.prerequisites || []).every(prereq => {
            for (let i = 0; i < termIndex; i++) {
              if (!termAllocation[i].isAvoidTerm && termAllocation[i].courses.some(c => c.code === prereq)) {
                return true;
              }
            }
            return false;
          });
          
          if (!prereqsMet) continue;
          
          // Check if offered in this term
          const termName = term.name.split(' ')[0];
          if (course.termsOffered && !course.termsOffered.includes(termName)) {
            continue;
          }
          
          // Move the course
          console.log(`Moving ${course.code} from ${laterTerm.name} to ${term.name} to meet minimum units`);
          
          const courseIndex = laterTerm.courses.findIndex(c => c.code === course.code);
          laterTerm.courses.splice(courseIndex, 1);
          laterTerm.units -= course.units;
          
          term.courses.push(course);
          term.units += course.units;
          
          if (term.units >= minUnitsPerTerm) {
            break;
          }
        }
        
        if (term.units >= minUnitsPerTerm) {
          break;
        }
      }
    }
    
    // Log if we couldn't meet the minimum
    if (term.units < minUnitsPerTerm) {
      console.log(`Warning: Could not meet minimum units for ${term.name} (${term.units}/${minUnitsPerTerm})`);
    }
  }
}

/**
 * Manually move a course from one term to another
 * 
 * @param {Object} plan - The course plan
 * @param {String} courseCode - Code of the course to move
 * @param {String} fromTerm - Source term (e.g. "Fall 2023")
 * @param {String} toTerm - Destination term (e.g. "Winter 2024")
 * @returns {Object} - Updated plan with course moved
 */
function moveCourse(plan, courseCode, fromTerm, toTerm) {
  // Find the terms
  const fromTermObj = plan.terms.find(t => t.name === fromTerm);
  const toTermObj = plan.terms.find(t => t.name === toTerm);
  
  if (!fromTermObj || !toTermObj) {
    console.log(`Error: Couldn't find terms ${fromTerm} or ${toTerm}`);
    return plan;
  }
  
  // Find the course in the source term
  const courseIndex = fromTermObj.courses.findIndex(c => c.code === courseCode);
  if (courseIndex === -1) {
    console.log(`Error: Course ${courseCode} not found in ${fromTerm}`);
    return plan;
  }
  
  const course = fromTermObj.courses[courseIndex];
  
  // Check prerequisite relationships
  const fromTermIndex = plan.terms.indexOf(fromTermObj);
  const toTermIndex = plan.terms.indexOf(toTermObj);
  
  // 1. Check if moving to an earlier term creates prerequisite violations
  if (toTermIndex < fromTermIndex) {
    // Get all prerequisites for this course
    const prereqs = course.prerequisites || [];
    
    if (prereqs.length > 0) {
      // Find which terms contain the prerequisites
      const prereqTerms = new Map();
      
      prereqs.forEach(prereq => {
        // Find which term has this prerequisite
        for (let i = 0; i < plan.terms.length; i++) {
          if (plan.terms[i].courses.some(c => c.code === prereq)) {
            prereqTerms.set(prereq, i);
            break;
          }
        }
      });
      
      // Check if any prerequisite is in the destination term or later
      const hasViolation = prereqs.some(prereq => {
        const prereqTermIndex = prereqTerms.get(prereq);
        // If prereq is in same term as destination or later, it's a violation
        return prereqTermIndex !== undefined && prereqTermIndex >= toTermIndex;
      });
      
      if (hasViolation) {
        console.log(`Error: Cannot move ${courseCode} to ${toTerm} - would create prerequisite violation`);
        return plan;
      }
    }
  }
  
  // 2. Check if this course is a prerequisite for other courses in the source term
  const isPrereqForOthers = fromTermObj.courses.some(c => 
    c !== course && c.prerequisites && c.prerequisites.includes(course.code)
  );
  
  if (isPrereqForOthers) {
    console.log(`Error: Cannot move ${courseCode} - it's a prerequisite for other courses in ${fromTerm}`);
    return plan;
  }
  
  // Remove course from source term
  fromTermObj.courses.splice(courseIndex, 1);
  fromTermObj.units -= course.units;
  
  // Add to destination term
  toTermObj.courses.push(course);
  toTermObj.units += course.units;
  
  // Sort courses in both terms by prerequisites
  sortCoursesByPrereqs(fromTermObj.courses);
  sortCoursesByPrereqs(toTermObj.courses);
  
  // Update total units
  plan.totalUnits = plan.terms.reduce((sum, term) => sum + term.units, 0);
  
  return plan;
}

/**
 * Add a new course to a specific term
 * 
 * @param {Object} plan - The course plan
 * @param {Object} course - Course to add (code, name, units, etc.)
 * @param {String} termName - Term to add the course to
 * @returns {Object} - Updated plan with new course
 */
function addCourse(plan, course, termName) {
  const term = plan.terms.find(t => t.name === termName);
  if (!term) {
    console.log(`Error: Term ${termName} not found`);
    return plan;
  }
  
  // Add course to term
  term.courses.push(course);
  term.units += course.units;
  
  // Sort courses by prerequisites
  sortCoursesByPrereqs(term.courses);
  
  // Update total units
  plan.totalUnits = plan.terms.reduce((sum, term) => sum + term.units, 0);
  
  return plan;
}

/**
 * Remove a course from a term
 * 
 * @param {Object} plan - The course plan
 * @param {String} courseCode - Code of the course to remove
 * @param {String} termName - Term to remove the course from
 * @returns {Object} - Updated plan with course removed
 */
function removeCourse(plan, courseCode, termName) {
  const term = plan.terms.find(t => t.name === termName);
  if (!term) {
    console.log(`Error: Term ${termName} not found`);
    return plan;
  }
  
  // Find the course
  const courseIndex = term.courses.findIndex(c => c.code === courseCode);
  if (courseIndex === -1) {
    console.log(`Error: Course ${courseCode} not found in ${termName}`);
    return plan;
  }
  
  // Remove course
  const course = term.courses[courseIndex];
  term.courses.splice(courseIndex, 1);
  term.units -= course.units;
  
  // Update total units
  plan.totalUnits = plan.terms.reduce((sum, term) => sum + term.units, 0);
  
  return plan;
}

/**
 * Helper function to sort courses by prerequisites
 */
function sortCoursesByPrereqs(courses) {
  // Create a dependency graph
  const dependencyGraph = {};
  courses.forEach(course => {
    dependencyGraph[course.code] = [];
  });
  
  // Fill in dependencies
  courses.forEach(course => {
    (course.prerequisites || []).forEach(prereq => {
      if (dependencyGraph[prereq]) {
        dependencyGraph[prereq].push(course.code);
      }
    });
  });
  
  // Topological sort
  const visited = new Set();
  const sorted = [];
  
  function visit(courseCode) {
    if (visited.has(courseCode)) return;
    visited.add(courseCode);
    
    (dependencyGraph[courseCode] || []).forEach(dep => {
      visit(dep);
    });
    
    sorted.push(courseCode);
  }
  
  Object.keys(dependencyGraph).forEach(visit);
  
  // Sort the courses based on the topological order
  courses.sort((a, b) => {
    return sorted.indexOf(a.code) - sorted.indexOf(b.code);
  });
}

module.exports = {
  generateOptimalPlan,
  flattenChains,
  generateTermSequence,
  moveCourse,
  addCourse,
  removeCourse
};
