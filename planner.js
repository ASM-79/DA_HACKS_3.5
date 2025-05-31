// planner.js - Main file to execute the planning process

// Import necessary modules and data
const sampleDB = require('./sample_db');
const dbData = require('./db');
const { buildPrerequisiteChains, buildCourseChain } = require('./build_chains');
const { generateOptimalPlan, flattenChains, generateTermSequence } = require('./generate_plan');

// Add random units to courses that don't have them
function addRandomUnits(courses) {
  const possibleUnits = [4, 4.5, 5];
  
  return courses.map(course => {
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

// Process data to ensure all courses have units
// Get data from DB.js
const universities = dbData.universities;
const majors = dbData.majors;
const requirements = dbData.requirements;
const ucCourses = addRandomUnits(dbData.ucCourses);
const deanzaCourses = addRandomUnits(dbData.deanzaCourses);
const courseEquivalencies = dbData.courseEquivalencies;

// Mock database functions for demonstration (to replace with actual DB functions)
class MockDB {
  constructor(data) {
    this.data = data;
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

// Set up mock databases for db.js data
const Requirements = new MockDB(requirements);
const UCCourses = new MockDB(ucCourses);
const CourseEquivalencies = new MockDB(courseEquivalencies);
const DeAnzaCourses = new MockDB(deanzaCourses);

// Set up mock databases for sample_db.js data
const SampleRequirements = new MockDB(sampleDB.requirements);
const SampleUCCourses = new MockDB(sampleDB.ucCourses);
const SampleCourseEquivalencies = new MockDB(sampleDB.courseEquivalencies);
const SampleDeAnzaCourses = new MockDB(sampleDB.deanzaCourses);

// Function to get the appropriate DB instances based on university and major
function getDBInstances(universityId, majorId) {
  if (universityId === "ucb" && majorId === "ucb_eecs") {
    return {
      Requirements: SampleRequirements,
      UCCourses: SampleUCCourses,
      CourseEquivalencies: SampleCourseEquivalencies,
      DeAnzaCourses: SampleDeAnzaCourses
    };
  } else {
    return {
      Requirements,
      UCCourses,
      CourseEquivalencies,
      DeAnzaCourses
    };
  }
}

// Function to generate a plan for multiple university-major pairs
async function generateCombinedPlan(targets, userConstraints) {
  try {
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
      const chains = await buildPrerequisiteChains(pair.universityId, pair.majorId, dbInstances);
      
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
    const plan = generateOptimalPlan(allChains, constraints);
    
    // Add info about all targets to the plan
    plan.targets = targets.map(pair => {
      let university, major;
      
      if (pair.universityId === "ucb" && pair.majorId === "ucb_eecs") {
        university = sampleDB.universities.find(u => u._id === pair.universityId);
        major = sampleDB.majors.find(m => m._id === pair.majorId);
      } else {
        university = universities.find(u => u._id === pair.universityId);
        major = majors.find(m => m._id === pair.majorId);
      }
      
      return {
        universityId: pair.universityId,
        majorId: pair.majorId,
        universityName: university ? university.name : "Unknown University",
        majorName: major ? major.name : "Unknown Major"
      };
    });
    
    return plan;
  } catch (error) {
    console.error("Error generating combined plan:", error);
    throw error;
  }
}

// Helper function to print a chain with indentation
function printChain(chain, depth) {
  const indent = "  ".repeat(depth);
  console.log(`${indent}${chain.course.code} (${chain.course.name}) - Level ${chain.level}`);
  
  chain.prerequisites.forEach(prereq => {
    printChain(prereq, depth + 1);
  });
}

// Function to adjust a plan
async function adjustPlan(plan, adjustments) {
  // Import the adjustment functions
  const { moveCourse, addCourse, removeCourse } = require('./generate_plan');
  
  // Apply each adjustment
  adjustments.forEach(adjustment => {
    if (adjustment.type === 'move') {
      plan = moveCourse(plan, adjustment.courseCode, adjustment.fromTerm, adjustment.toTerm);
    } 
    else if (adjustment.type === 'add') {
      plan = addCourse(plan, adjustment.course, adjustment.termName);
    }
    else if (adjustment.type === 'remove') {
      plan = removeCourse(plan, adjustment.courseCode, adjustment.termName);
    }
  });
  
  return plan;
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

// Example usage
async function main() {
  // User constraints with EXPLICIT values
  const constraints = {
    startTerm: "Fall 2024",
    maxUnitsPerTerm: 20, 
    minUnitsPerTerm: 10,
    maxTerms: 8,
    avoidTerms: ["Summer 2024"],
    avoidCourses: [],
    balanceWorkload: false,
    finishFastest: true 
  };
  
  // Create a list of target university-major pairs
  const targets = [
    { universityId: "ucb", majorId: "ucb_eecs" },
    { universityId: "ucsd", majorId: "ucsd_cognitive_sci" }
  ];
  
  // Generate a combined plan using the appropriate DB for each target
  console.log("\n=== Integrated Transfer Plan ===");
  const plan = await generateCombinedPlan(targets, constraints);
  displayPlan(plan);
}

// Run the example
main().catch(console.error);

// At the end of the file
module.exports = {
  generateCombinedPlan,
  adjustPlan
};
