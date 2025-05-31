// browser_planner.js - Self-contained browser version

// Wait for all data to be loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log("Initializing browser planner...");
  
  // Initialize the planner
  function initPlanner() {
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
      generateCombinedPlan: generateCombinedPlan,
      displayPlan: displayPlan,
      addRandomUnits: addRandomUnits
    };
    
    console.log("Browser planner initialized successfully!");
  }
  
  // Initialize immediately - our approach in the HTML ensures all modules are loaded first
  initPlanner();
});
