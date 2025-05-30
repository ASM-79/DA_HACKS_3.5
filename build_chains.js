/**
 * Builds prerequisite chains for all required courses
 * 
 * @param {String} universityId - University ID (e.g., "ucb")
 * @param {String} majorId - Major ID (e.g., "ucb_eecs")
 * @param {Object} dbInstances - Database instances for accessing data
 * @returns {Array} - Prerequisite chains for the required courses
 */
async function buildPrerequisiteChains(universityId, majorId, dbInstances) {
  const { Requirements, UCCourses, CourseEquivalencies, DeAnzaCourses } = dbInstances;
  
  // 1. Get all requirements for the major
  const majorRequirements = await Requirements.find({ majorId });
  
  // 2. Get all UC courses from the requirements
  const ucCourseIds = majorRequirements.flatMap(req => req.courses);
  const ucCourses = await UCCourses.find({ _id: { $in: ucCourseIds } });
  
  // 3. Get all equivalent De Anza courses
  const equivalencies = await CourseEquivalencies.find({ ucCourseId: { $in: ucCourseIds } });
  
  // 4. Get all required De Anza courses
  const daCourseIds = equivalencies.flatMap(eq => eq.daCourseIds);
  const daCourses = await DeAnzaCourses.find({ _id: { $in: daCourseIds } });
  
  // 5. Build a map of course codes to their details
  const courseMap = {};
  daCourses.forEach(course => {
    courseMap[course.code] = {
      ...course,
      dependents: [], // Will be filled in later
      alternatives: [] // Will store alternative courses
    };
  });
  
  // 5b. Add alternative relationships
  equivalencies.forEach(eq => {
    if (eq.alternativeSets && eq.alternativeSets.length > 0) {
      // For each alternative set
      eq.alternativeSets.forEach(altSet => {
        // Skip if only one course in the set (not really an alternative)
        if (altSet.length <= 1) return;
        
        // Get all course codes in this alternative set
        const altCourseCodes = altSet.map(id => {
          const course = daCourses.find(c => c._id === id);
          return course ? course.code : null;
        }).filter(code => code !== null);
        
        // Add alternatives to each course
        altCourseCodes.forEach(code => {
          if (courseMap[code]) {
            courseMap[code].alternatives = altCourseCodes.filter(c => c !== code);
          }
        });
      });
    }
  });
  
  // 5c. Track courses with no articulated equivalents
  const noEquivalentCourses = equivalencies
    .filter(eq => eq.hasNoEquivalent)
    .map(eq => {
      const ucCourse = ucCourses.find(c => c._id === eq.ucCourseId);
      return {
        _id: eq.ucCourseId,
        code: ucCourse ? ucCourse.code : "Unknown",
        name: ucCourse ? ucCourse.name : "Unknown Course",
        units: ucCourse ? ucCourse.units : 0,
        hasNoEquivalent: true,
        noEquivalentMessage: eq.noEquivalentMessage || "This course has no articulated equivalent at De Anza."
      };
    });
  
  // 6. Add dependent relationships (reverse prerequisites)
  daCourses.forEach(course => {
    (course.prerequisites || []).forEach(prereq => {
      if (courseMap[prereq]) {
        courseMap[prereq].dependents.push(course.code);
      }
    });
  });
  
  // 7. Find "terminal" courses (those that fulfill UC requirements but have no dependents)
  const terminalCourses = daCourses.filter(course => {
    // If this course is in the map and has no dependents that are also in the map
    return courseMap[course.code] && 
      (courseMap[course.code].dependents.length === 0 || 
       !courseMap[course.code].dependents.some(dep => courseMap[dep]));
  });
  
  // 8. Build chains starting from each terminal course
  const chains = [];
  terminalCourses.forEach(terminal => {
    const chain = buildCourseChain(terminal.code, courseMap);
    if (chain) {
      chains.push(chain);
    }
  });
  
  // 9. Append information about courses with no equivalents
  if (noEquivalentCourses.length > 0) {
    chains.noEquivalentCourses = noEquivalentCourses;
  }
  
  return chains;
}

/**
 * Recursively builds a chain for a course and its prerequisites
 * 
 * @param {String} courseCode - The course code to build a chain for
 * @param {Object} courseMap - Map of course codes to course details
 * @param {Set} visited - Set of visited course codes (to prevent cycles)
 * @returns {Object} - Chain object representing the course and its prerequisites
 */
function buildCourseChain(courseCode, courseMap, visited = new Set()) {
  // Prevent cycles in the graph
  if (visited.has(courseCode)) return null;
  visited.add(courseCode);
  
  const course = courseMap[courseCode];
  if (!course) return null;
  
  // Recursively build chains for prerequisites
  const prerequisiteChains = [];
  (course.prerequisites || []).forEach(prereq => {
    if (courseMap[prereq]) {
      const prereqChain = buildCourseChain(prereq, courseMap, new Set(visited));
      if (prereqChain) {
        prerequisiteChains.push(prereqChain);
      }
    }
  });
  
  // Create the chain object
  return {
    course: {
      code: course.code,
      name: course.name,
      units: course.units,
      alternatives: course.alternatives || [],
      additionalNotes: course.additionalNotes || ""
    },
    prerequisites: prerequisiteChains,
    level: prerequisiteChains.length > 0 
      ? 1 + Math.max(...prerequisiteChains.map(c => c.level))
      : 0
  };
}

module.exports = {
  buildPrerequisiteChains,
  buildCourseChain
};
