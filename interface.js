// interface.js - Bridge between frontend and backend

// Import the planner algorithm
const { generateCombinedPlan, adjustPlan } = require('./planner.js');

// Predefined chat commands and responses
const CHAT_COMMANDS = {
  "help": {
    response: "Available commands:\n- plan [university] [major]\n- optimize\n- avoid [term]\n- limit [units]",
    action: null
  },
  "plan": {
    response: "Generating your optimized transfer plan...",
    action: generatePlan
  },
  "optimize": {
    response: "Optimizing your current plan...",
    action: optimizeCurrentPlan
  },
  "avoid": {
    response: "I'll avoid scheduling classes in that term.",
    action: avoidTerm
  },
  "limit": {
    response: "Setting your unit limit per term.",
    action: setUnitLimit
  }
};

// Default constraints
let currentConstraints = {
  startTerm: "Fall 2024",
  maxUnitsPerTerm: 15,
  minUnitsPerTerm: 10,
  maxTerms: 8,
  avoidTerms: [],
  avoidCourses: [],
  balanceWorkload: false,
  finishFastest: true
};

// Current targets (university/major pairs)
let currentTargets = [
  { universityId: "ucb", majorId: "ucb_eecs" }
];

// Current plan (will be filled by the algorithm)
let currentPlan = null;

// Process a message and run the actual planning algorithm
async function processUserMessage(message) {
  message = message.toLowerCase().trim();
  
  // Extract command and arguments
  const parts = message.split(' ');
  const command = parts[0];
  
  if (command === 'plan' || command === 'paln' || command === 'pln') {
    let targets = [];
    
    // Check if this is a combined plan (contains "and")
    if (message.includes(' and ')) {
      // Parse multiple university-major pairs
      const targetPairs = message.substring(5).split(' and ');
      
      for (const pair of targetPairs) {
        const pairParts = pair.trim().split(' ');
        if (pairParts.length >= 2) {
          const universityName = pairParts[0];
          const majorName = pairParts[1];
          const { universityId, majorId } = getUniversityMajorIds(universityName, majorName);
          
          targets.push({ universityId, majorId });
        }
      }
    } 
    // Single university-major pair
    else if (parts.length >= 3) {
      const universityName = parts[1];
      const majorName = parts[2];
      const { universityId, majorId } = getUniversityMajorIds(universityName, majorName);
      
      targets.push({ universityId, majorId });
    }
    // Shorthand for a single university
    else if (parts.length === 2) {
      const universityName = parts[1];
      let majorName = "eecs"; // Default major
      
      if (universityName === "ucla") {
        majorName = "cs";
      } else if (universityName === "ucsd") {
        majorName = "cognitive";
      } else if (universityName === "sjsu") {
        majorName = "software";
      }
      
      const { universityId, majorId } = getUniversityMajorIds(universityName, majorName);
      targets.push({ universityId, majorId });
    }
    
    if (targets.length === 0) {
      return {
        response: "Please specify a university and major, for example: plan berkeley eecs",
        plan: null
      };
    }
    
    // Generate the description of what we're planning
    const targetDescriptions = targets.map(target => {
      const uniMap = {
        "ucb": "UC Berkeley",
        "ucla": "UCLA",
        "ucsd": "UC San Diego",
        "sjsu": "San Jose State"
      };
      
      const majorMap = {
        "ucb_eecs": "EECS",
        "ucla_cs": "Computer Science",
        "ucsd_cognitive_sci": "Cognitive Science",
        "sjsu_software_eng": "Software Engineering"
      };
      
      return `${uniMap[target.universityId] || target.universityId} ${majorMap[target.majorId] || target.majorId}`;
    });
    
    const responseText = targets.length === 1
      ? `Generating your optimized transfer plan for ${targetDescriptions[0]}...`
      : `Generating your combined transfer plan for ${targetDescriptions.join(' AND ')}...`;
    
    try {
      // Call the real planning algorithm using the window.plannerAPI
      const plan = await window.plannerAPI.generateCombinedPlan(targets, currentConstraints);
      
      return {
        response: responseText,
        plan: convertPlanToUI(plan)
      };
    } catch (error) {
      console.error("Error generating plan:", error);
      return {
        response: `Error generating plan: ${error.message}`,
        plan: null
      };
    }
  }
  
  // Look for a matching command
  const commandObj = CHAT_COMMANDS[command];
  
  if (!commandObj) {
    return {
      response: "I don't understand that command. Type 'help' to see available commands.",
      plan: null
    };
  }
  
  // Execute the command action if it exists
  let result = null;
  if (commandObj.action) {
    result = await commandObj.action(parts.slice(1));
  }
  
  return {
    response: commandObj.response,
    plan: result
  };
}

// Generate a plan based on user input
async function generatePlan(args) {
  try {
    // Parse university and major from args
    if (args.length >= 2) {
      const university = args[0];
      const major = args[1];
      
      // Map friendly names to IDs
      const universityMap = {
        "berkeley": "ucb",
        "ucla": "ucla",
        "ucsd": "ucsd"
      };
      
      const majorMap = {
        "eecs": "ucb_eecs",
        "cs": "ucla_cs",
        "cognitive": "ucsd_cognitive_sci"
      };
      
      // Update current targets
      currentTargets = [{
        universityId: universityMap[university] || university,
        majorId: majorMap[major] || major
      }];
    }
    
    console.log("Generating plan for targets:", JSON.stringify(currentTargets));
    
    // Generate the plan using the backend algorithm
    const plan = await generateCombinedPlan(currentTargets, currentConstraints);
    currentPlan = plan;
    return convertPlanToUI(plan);
  } catch (error) {
    console.error("Error generating plan:", error);
    throw error;
  }
}

// Expanded conversion function to handle year mapping
function convertPlanToUI(plan) {
  if (!plan || !plan.terms) {
    console.error("Invalid plan format:", plan);
    return null;
  }
  
  const uiPlan = {};
  
  // Create a term mapping for any potential year offsets
  const termMapping = {
    "Fall 2024": "fall-24",
    "Winter 2024": "winter-25", // Note the year change
    "Spring 2024": "spring-25", // Note the year change
    "Summer 2024": "summer-25", // Note the year change
    "Fall 2025": "fall-25",
    "Winter 2025": "winter-26", // Note the year change
    "Spring 2025": "spring-26", // Note the year change
    "Summer 2025": "summer-26"  // Note the year change
  };
  
  // Map each term to the UI semester columns
  plan.terms.forEach(term => {
    try {
      // Use the mapping if available
      const termId = termMapping[term.name];
      
      if (termId) {
        if (!uiPlan[termId]) {
          uiPlan[termId] = [];
        }
        
        // Add courses to this term
        term.courses.forEach(course => {
          uiPlan[termId].push({
            code: course.code,
            name: course.name || "Unknown Course",
            units: course.units || 4,
            prerequisites: course.prerequisites || [],
            additionalNotes: course.additionalNotes || "",
            tags: getCourseTags(course)
          });
        });
      } else {
        console.warn(`Unknown term mapping for: ${term.name}`);
      }
    } catch (error) {
      console.error("Error converting term to UI format:", error, term);
    }
  });
  
  return uiPlan;
}

// Get course tags based on requirements
function getCourseTagsFromRequirements(courseCode) {
  // This would ideally look up the course in requirements
  // For now, return tags based on course code patterns
  const tags = ["Major"];
  
  if (courseCode.includes("MATH")) {
    tags.push("GE");
  } else if (courseCode.includes("EWRT") || courseCode.includes("ESL")) {
    tags.push("GE");
    tags.push("IGETC");
  } else if (courseCode.includes("PHYS") || courseCode.includes("CHEM") || courseCode.includes("BIOL")) {
    tags.push("GE");
    tags.push("IGETC");
  }
  
  return tags;
}

// Optimize the current plan
async function optimizeCurrentPlan() {
  if (!currentPlan) {
    return null;
  }
  
  try {
    // Toggle balanceWorkload to true for optimization
    currentConstraints.balanceWorkload = true;
    
    // Regenerate the plan with the updated constraints
    const plan = await generateCombinedPlan(currentTargets, currentConstraints);
    currentPlan = plan;
    return convertPlanToUI(plan);
  } catch (error) {
    console.error("Error optimizing plan:", error);
    throw error;
  }
}

// Add a term to avoid
async function avoidTerm(args) {
  try {
    if (args.length > 0) {
      const term = args.join(' ');
      
      // Format the term properly (e.g., "summer" -> "Summer 2025")
      const formattedTerm = formatTerm(term);
      
      if (formattedTerm && !currentConstraints.avoidTerms.includes(formattedTerm)) {
        currentConstraints.avoidTerms.push(formattedTerm);
        console.log("Updated avoid terms:", currentConstraints.avoidTerms);
      }
    }
    
    // Regenerate plan if we already have one
    if (currentPlan) {
      return await generatePlan([]);
    }
    
    return null;
  } catch (error) {
    console.error("Error avoiding term:", error);
    throw error;
  }
}

// Format a term string
function formatTerm(term) {
  const seasons = ["fall", "winter", "spring", "summer"];
  const termLower = term.toLowerCase();
  
  // Extract season and year
  let season = null;
  let year = null;
  
  // Look for a season
  for (const s of seasons) {
    if (termLower.includes(s)) {
      season = s.charAt(0).toUpperCase() + s.slice(1);
      break;
    }
  }
  
  // Look for a year
  const yearMatch = termLower.match(/\d{2,4}/);
  if (yearMatch) {
    year = yearMatch[0].length === 2 ? "20" + yearMatch[0] : yearMatch[0];
  } else {
    // Default to next year if not specified
    const currentYear = new Date().getFullYear();
    year = String(currentYear + 1);
  }
  
  if (season && year) {
    return `${season} ${year}`;
  }
  
  return null;
}

// Set the unit limit per term
async function setUnitLimit(args) {
  try {
    if (args.length > 0 && !isNaN(args[0])) {
      const unitLimit = parseInt(args[0]);
      
      if (unitLimit >= 8 && unitLimit <= 25) {
        currentConstraints.maxUnitsPerTerm = unitLimit;
        console.log("Updated unit limit:", currentConstraints.maxUnitsPerTerm);
      }
    }
    
    // Regenerate plan if we already have one
    if (currentPlan) {
      return await generatePlan([]);
    }
    
    return null;
  } catch (error) {
    console.error("Error setting unit limit:", error);
    throw error;
  }
}

// Export the interface functions
module.exports = {
  processUserMessage,
  generatePlan,
  optimizeCurrentPlan,
  avoidTerm,
  setUnitLimit
};
