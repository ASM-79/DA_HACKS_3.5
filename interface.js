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

// Process a user message from the chat interface
async function processUserMessage(message) {
  try {
    // Split the message into command and arguments
    const parts = message.trim().toLowerCase().split(' ');
    const command = parts[0];
    const args = parts.slice(1);
    
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
      result = await commandObj.action(args);
    }
    
    return {
      response: commandObj.response,
      plan: result
    };
  } catch (error) {
    console.error("Error in processUserMessage:", error);
    return {
      response: "Sorry, there was an error processing your request: " + error.message,
      plan: null
    };
  }
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

// Convert the algorithm's plan format to a UI-friendly format
function convertPlanToUI(plan) {
  if (!plan || !plan.terms) {
    console.error("Invalid plan format:", plan);
    return {};
  }
  
  const uiPlan = {};
  
  // Map each term to the UI semester columns
  plan.terms.forEach(term => {
    try {
      // Convert term name to UI ID (e.g., "Fall 2024" -> "fall-24")
      const termParts = term.name.split(' ');
      const season = termParts[0].toLowerCase();
      const year = termParts[1].slice(2); // "2024" -> "24"
      const termId = `${season}-${year}`;
      
      uiPlan[termId] = term.courses.map(course => ({
        code: course.code,
        name: course.name || "Unknown Course",
        units: course.units || 4,
        prerequisites: course.prerequisites || [],
        tags: getCourseTagsFromRequirements(course.code)
      }));
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
