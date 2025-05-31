// all_modules.js - Contains all module code bundled for the browser

// ----- SAMPLE DB MODULE -----
(function(window) {
  // Define universities
  const universities = [
    { _id: "ucb", name: "UC Berkeley" }
    // Add the rest of your universities
  ];

  // Define majors
  const majors = [
    { _id: "ucb_eecs", universityId: "ucb", name: "Electrical Engineering and Computer Science" }
    // Add the rest of your majors
  ];

  // Define requirements
  const requirements = [
    // Add all your requirements
  ];

  // Define UC courses
  const ucCourses = [
    // Add all your UC courses
  ];

  // Define De Anza courses
  const deanzaCourses = [
    // Add all your De Anza courses
  ];

  // Define course equivalencies
  const courseEquivalencies = [
    // Add all your course equivalencies
  ];

  // Make everything available globally
  window.sampleDB = {
    universities,
    majors,
    requirements,
    ucCourses,
    deanzaCourses,
    courseEquivalencies
  };
})(window);

// ----- DB MODULE -----
(function(window) {
  // Define your db objects here
  // Use the exact same structure as sample_db.js
  const universities = [
    // Your universities
  ];

  const majors = [
    // Your majors
  ];

  const requirements = [
    // Your requirements
  ];

  const ucCourses = [
    // Your UC courses
  ];

  const deanzaCourses = [
    // Your De Anza courses
  ];

  const courseEquivalencies = [
    // Your course equivalencies
  ];

  // Make everything available globally
  window.dbData = {
    universities,
    majors,
    requirements,
    ucCourses,
    deanzaCourses,
    courseEquivalencies
  };
})(window);

// ----- BUILD CHAINS MODULE -----
(function(window) {
  /**
   * Builds prerequisite chains for all required courses
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

  // Make functions available globally
  window.buildChains = {
    buildPrerequisiteChains,
    buildCourseChain
  };
})(window);

// ----- GENERATE PLAN MODULE -----
(function(window) {
  // Copy your generate_plan.js code here, removing any exports/imports
  // and exposing the functions via window.generatePlan = {...}
  
  // Make functions available globally
  window.generatePlan = {
    generateOptimalPlan: function() { /* your implementation */ },
    flattenChains: function() { /* your implementation */ },
    generateTermSequence: function() { /* your implementation */ }
  };
})(window);

// ----- BROWSER PLANNER MODULE -----
(function(window) {
  // Mock database functions for demonstration
  class MockDB {
    constructor(data) {
      this.data = data || [];
    }
    
    async find(query) {
      // Simple query implementation
      if (query._id && query._id.$in) {
        return this.data.filter(item => query._id.$in.includes(item._id));
      }
      
      if (query.majorId) {
        return this.data.filter(item => item.majorId === query.majorId);
      }
      
      if (query.universityId) {
        return this.data.filter(item => item.universityId === query.universityId);
      }
      
      if (query.ucCourseId && query.ucCourseId.$in) {
        return this.data.filter(item => query.ucCourseId.$in.includes(item.ucCourseId));
      }
      
      return this.data;
    }
  }

  // Add random units to courses that don't have them
  function addRandomUnits(courses) {
    const possibleUnits = [4, 4.5, 5];
    
    return (courses || []).map(course => {
      // If course already has units, keep them
      if (course.units) {
        return course;
      }
      
      // Otherwise assign random units from our set
      const randomIndex = Math.floor(Math.random() * possibleUnits.length);
      return {
        ...course,
        units: possibleUnits[randomIndex]
      };
    });
  }

  // Function to get the appropriate DB instances based on university and major
  function getDBInstances(universityId, majorId) {
    try {
      if (universityId === "ucb" && majorId === "ucb_eecs") {
        return {
          Requirements: new MockDB(window.sampleDB.requirements),
          UCCourses: new MockDB(window.sampleDB.ucCourses),
          CourseEquivalencies: new MockDB(window.sampleDB.courseEquivalencies),
          DeAnzaCourses: new MockDB(window.sampleDB.deanzaCourses)
        };
      } else {
        // Process data to ensure all courses have units
        return {
          Requirements: new MockDB(window.dbData.requirements),
          UCCourses: new MockDB(addRandomUnits(window.dbData.ucCourses)),
          CourseEquivalencies: new MockDB(window.dbData.courseEquivalencies),
          DeAnzaCourses: new MockDB(addRandomUnits(window.dbData.deanzaCourses))
        };
      }
    } catch (error) {
      console.error("Error in getDBInstances:", error);
      // Return empty MockDBs as fallback
      return {
        Requirements: new MockDB([]),
        UCCourses: new MockDB([]),
        CourseEquivalencies: new MockDB([]),
        DeAnzaCourses: new MockDB([])
      };
    }
  }

  // Function to generate a plan for multiple university-major pairs
  async function generateCombinedPlan(targets, userConstraints) {
    try {
      console.log("Browser planner generating plan for:", targets);
      
      // Process user constraints
      let constraints = { ...userConstraints };
      
      // If finishFastest is true, use higher unit cap
      if (constraints.finishFastest) {
        constraints.maxUnitsPerTerm = Math.max(constraints.maxUnitsPerTerm || 15, 20);
      }
      
      // Build chains for each university-major pair
      const allChains = [];
      const allNoEquivalentCourses = [];
      
      for (const pair of targets) {
        // Get the appropriate DB instances for this university-major pair
        const dbInstances = getDBInstances(pair.universityId, pair.majorId);
        
        // Build prerequisite chains using the appropriate DB
        const chains = await window.buildChains.buildPrerequisiteChains(pair.universityId, pair.majorId, dbInstances);
        
        // Add each chain to the combined list
        chains.forEach(chain => {
          // Check if this course is already in allChains
          const existingChain = allChains.find(c => c.course.code === chain.course.code);
          if (!existingChain) {
            allChains.push(chain);
          } else {
            // Merge the prerequisites if needed
            chain.prerequisites.forEach(prereq => {
              const existingPrereq = existingChain.prerequisites.find(p => p.course.code === prereq.course.code);
              if (!existingPrereq) {
                existingChain.prerequisites.push(prereq);
              }
            });
            
            // Update the level if needed
            if (chain.level > existingChain.level) {
              existingChain.level = chain.level;
            }
          }
        });
        
        // Add no equivalent courses
        if (chains.noEquivalentCourses) {
          chains.noEquivalentCourses.forEach(course => {
            if (!allNoEquivalentCourses.some(c => c._id === course._id)) {
              allNoEquivalentCourses.push(course);
            }
          });
        }
      }
      
      // Add the no equivalent courses to the combined chains
      allChains.noEquivalentCourses = allNoEquivalentCourses;
      
      // Generate optimal plan with the combined chains
      const plan = window.generatePlan.generateOptimalPlan(allChains, constraints);
      
      // Add info about all targets to the plan
      plan.targets = targets.map(pair => {
        let university, major;
        
        if (pair.universityId === "ucb" && pair.majorId === "ucb_eecs") {
          university = window.sampleDB.universities.find(u => u._id === pair.universityId);
          major = window.sampleDB.majors.find(m => m._id === pair.majorId);
        } else {
          university = window.dbData.universities.find(u => u._id === pair.universityId);
          major = window.dbData.majors.find(m => m._id === pair.majorId);
        }
        
        return {
          universityId: pair.universityId,
          majorId: pair.majorId,
          universityName: university ? university.name : "Unknown University",
          majorName: major ? major.name : "Unknown Major"
        };
      });
      
      // Display the plan for debugging
      displayPlan(plan);
      
      return plan;
    } catch (error) {
      console.error("Error generating combined plan:", error);
      throw error;
    }
  }

  // Helper to display the plan
  function displayPlan(plan) {
    console.log("\n==========================================");
    console.log("TRANSFER PLAN");
    console.log("==========================================");
    
    // Show target universities and majors
    if (plan.targets && plan.targets.length > 0) {
      console.log("Target Schools and Majors:");
      plan.targets.forEach(target => {
        console.log(`- ${target.universityName}: ${target.majorName}`);
      });
    } else if (plan.universityName && plan.majorName) {
      console.log(`Target: ${plan.universityName} - ${plan.majorName}`);
    }
    
    console.log(`\nStart Term: ${plan.startTerm}`);
    console.log(`End Term: ${plan.endTerm}`);
    console.log(`Total Units: ${plan.totalUnits}`);
    
    plan.terms.forEach(term => {
      console.log(`\n${term.name} (${term.units} units):`);
      term.courses.forEach(course => {
        console.log(`- ${course.code}: ${course.name} (${course.units} units)`);
        
        if (course.prerequisites && course.prerequisites.length > 0) {
          console.log(`  Prerequisites: ${course.prerequisites.join(', ')}`);
        }
        
        if (course.alternatives && course.alternatives.length > 0) {
          console.log(`  Alternatives: ${course.alternatives.join(', ')}`);
        }
        
        if (course.additionalNotes) {
          console.log(`  Note: ${course.additionalNotes}`);
        }
      });
    });
    
    // Display information about courses with no articulated equivalents
    if (plan.noEquivalentCourses && plan.noEquivalentCourses.length > 0) {
      console.log("\nCourses Without De Anza Equivalents (Must Be Taken After Transfer):");
      plan.noEquivalentCourses.forEach(course => {
        console.log(`- ${course.code}: ${course.name} (${course.units} units)`);
        if (course.noEquivalentMessage) {
          console.log(`  ${course.noEquivalentMessage}`);
        }
      });
    }
  }

  // Make functions available globally
  window.plannerFunctions = {
    generateCombinedPlan,
    displayPlan,
    addRandomUnits
  };
  
  console.log("Browser planner initialized successfully!");
})(window);
