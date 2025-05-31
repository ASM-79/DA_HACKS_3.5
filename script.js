// Store the currently dragged item
let draggedItem = null;

// Current state for planning
let currentConstraints = {
  startTerm: "Fall 2024",
  maxUnitsPerTerm: 18, 
  minUnitsPerTerm: 10,
  maxTerms: 8,
  avoidTerms: [],
  avoidCourses: [],
  balanceWorkload: false,
  finishFastest: true 
};

// Function to map university/major names to IDs
function getUniversityMajorIds(universityName, majorName) {
  const universityMap = {
    "berkeley": "ucb",
    "ucb": "ucb",
    "ucla": "ucla",
    "ucsd": "ucsd",
    "sjsu": "sjsu"
  };
  
  const majorMap = {
    "eecs": "ucb_eecs",
    "cs": "ucla_cs",
    "cognitive": "ucsd_cognitive_sci",
    "cogsci": "ucsd_cognitive_sci",
    "software": "sjsu_software_eng",
    "softeng": "sjsu_software_eng"
  };
  
  return {
    universityId: universityMap[universityName.toLowerCase()] || universityName,
    majorId: majorMap[majorName.toLowerCase()] || majorName
  };
}

// Regular drag-and-drop handlers (keep existing code)
function handleDragStart(e) {
  draggedItem = e.target;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.outerHTML);
  e.target.classList.add('dragging');
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedItem = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const dropZone = e.target.closest('.course-drop-zone, #courseList');
  if (dropZone) {
    dropZone.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  const dropZone = e.target.closest('.course-drop-zone, #courseList');
  if (dropZone && !dropZone.contains(e.relatedTarget)) {
    dropZone.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
  document.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
  
  const dropZone = e.target.closest('.course-drop-zone, #courseList');
  if (!dropZone) return;
  
  if (draggedItem) {
    if (e.target.classList.contains('course-card')) {
      e.target.parentNode.insertBefore(draggedItem, e.target);
    } else {
      dropZone.appendChild(draggedItem);
    }
  } 
  else if (e.dataTransfer.getData('text/html')) {
    const data = e.dataTransfer.getData('text/html');
    const temp = document.createElement('div');
    temp.innerHTML = data;
    const newItem = temp.firstElementChild;
    
    setupCardDragEvents(newItem);
    
    if (e.target.classList.contains('course-card')) {
      e.target.parentNode.insertBefore(newItem, e.target);
    } else {
      dropZone.appendChild(newItem);
    }
    
    const sourceList = document.querySelector('.dragging-source');
    if (sourceList && sourceList !== dropZone) {
      const original = sourceList.querySelector('.dragging');
      if (original) original.remove();
    }
  }
  
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.dragging-source').forEach(el => el.classList.remove('dragging-source'));
}

function setupCardDragEvents(card) {
  card.setAttribute('draggable', 'true');
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);
  
  card.addEventListener('dragstart', function(e) {
    this.classList.add('dragging');
    this.closest('.course-drop-zone, #courseList')?.classList.add('dragging-source');
  });
  
  card.addEventListener('dragend', function() {
    this.classList.remove('dragging');
    document.querySelectorAll('.dragging-source').forEach(el => el.classList.remove('dragging-source'));
  });
}

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
      // Call the real planning algorithm
      const plan = await window.generateRealPlan(targets, currentConstraints);
      
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
  
  // Handle avoid command
  if (command === 'avoid' || command === 'skip') {
    if (message.includes('summer')) {
      // Add all summer terms to avoid list
      currentConstraints.avoidTerms = ["Summer 2024", "Summer 2025", "Summer 2026"];
      
      return {
        response: "I'll avoid scheduling classes in summer terms.",
        action: "updateConstraints"
      };
    } else {
      return {
        response: "I can help you avoid specific terms. Try 'avoid summer' to skip summer terms.",
        plan: null
      };
    }
  }
  
  // Handle limit command
  if (command === 'limit' || command === 'max' || command === 'units') {
    const numberMatch = message.match(/\d+/);
    if (numberMatch) {
      const unitLimit = parseInt(numberMatch[0]);
      
      if (unitLimit >= 8 && unitLimit <= 25) {
        currentConstraints.maxUnitsPerTerm = unitLimit;
        
        return {
          response: `Setting your unit limit per term to ${unitLimit}.`,
          action: "updateConstraints"
        };
      }
    }
    
    return {
      response: "Please specify a reasonable unit limit between 8 and 25, for example: limit 18",
      plan: null
    };
  }
  
  // Handle optimize command
  if (command === 'optimize' || command === 'balance' || command === 'rebalance') {
    currentConstraints.balanceWorkload = true;
    
    return {
      response: "Optimizing your current plan for better balance...",
      action: "updateConstraints"
    };
  }
  
  // Handle help command
  if (command === 'help' || command === '?' || command === 'commands') {
    return {
      response: 
        "Available commands:\n" +
        "- plan berkeley eecs - Create a transfer plan for one school\n" +
        "- plan berkeley eecs and ucsd cognitive - Create a combined plan for multiple schools\n" +
        "- avoid summer - Avoid scheduling classes in summer\n" +
        "- limit 18 - Set maximum units per term\n" +
        "- optimize - Balance workload across terms\n\n" +
        "Example: plan berkeley eecs and ucsd cognitive",
      plan: null
    };
  }
  
  // Default response
  return {
    response: "I don't understand that command. Type 'help' to see available commands.",
    plan: null
  };
}

// Initialize the backend algorithms
async function initializeBackend() {
  try {
    // Create a more reliable generateRealPlan function
    window.generateRealPlan = async function(targets, constraints) {
      try {
        // For debugging
        console.log("Generating plan with targets:", targets);
        console.log("Constraints:", constraints);
        
        // Use the browser-compatible planning function
        return await window.plannerFunctions.generateCombinedPlan(targets, constraints);
      } catch (error) {
        console.error("Error in planning algorithm:", error);
        throw error;
      }
    };
    
    console.log("Backend initialized successfully");
  } catch (error) {
    console.error("Error initializing backend:", error);
    throw error;
  }
}

// Convert the algorithm's plan to UI format
function convertPlanToUI(plan) {
  if (!plan || !plan.terms) {
    console.error("Invalid plan format:", plan);
    return null;
  }
  
  const uiPlan = {};
  
  // Academic quarters mapping
  // In academic calendar, Winter/Spring/Summer of a year (e.g. 2024) are actually 
  // displayed in the UI with the next year (e.g. winter-25)
  const termMapping = {
    "Fall": {yearOffset: 0},      // Fall 2024 -> fall-24
    "Winter": {yearOffset: 1},    // Winter 2024 -> winter-25
    "Spring": {yearOffset: 1},    // Spring 2024 -> spring-25
    "Summer": {yearOffset: 1}     // Summer 2024 -> summer-25
  };
  
  // Process each term from the algorithm output
  plan.terms.forEach(term => {
    try {
      // Parse the term name (e.g., "Fall 2024")
      const termParts = term.name.split(' ');
      if (termParts.length !== 2) {
        console.warn(`Unexpected term format: ${term.name}`);
        return;
      }
      
      const season = termParts[0];
      const year = parseInt(termParts[1]);
      
      if (!termMapping[season]) {
        console.warn(`Unknown season: ${season}`);
        return;
      }
      
      // Apply the mapping offset
      const mappedYear = year + termMapping[season].yearOffset;
      
      // Convert season and year to UI term format (e.g., "fall-24")
      const seasonLower = season.toLowerCase();
      const yearSuffix = (mappedYear % 100).toString();
      
      const termId = `${seasonLower}-${yearSuffix}`;
      
      // Convert courses to UI format
      uiPlan[termId] = term.courses.map(course => ({
        code: course.code,
        name: course.name || "Unknown Course",
        units: course.units || 4,
        prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : [],
        additionalNotes: course.additionalNotes || "",
        tags: getCourseTags(course)
      }));
      
      console.log(`Mapped ${term.name} to ${termId} with ${term.courses.length} courses`);
    } catch (error) {
      console.error(`Error mapping term ${term.name}:`, error);
    }
  });
  
  return uiPlan;
}
// Get tags for a course
function getCourseTags(course) {
  const tags = ["Major"];
  
  // Add GE tag for certain course types
  if (course.code.includes("MATH") || 
      course.code.includes("EWRT") || 
      course.code.includes("ESL") || 
      course.code.includes("PHYS") || 
      course.code.includes("CHEM") || 
      course.code.includes("BIOL") ||
      course.code.includes("PHIL")) {
    tags.push("GE");
  }
  
  // Add IGETC tag for English and some science courses
  if (course.code.includes("EWRT") || 
      course.code.includes("ESL") ||
      course.code.includes("PHYS") || 
      course.code.includes("CHEM") || 
      course.code.includes("BIOL")) {
    tags.push("IGETC");
  }
  
  return tags;
}

// Apply a plan to the UI
function applyPlanToUI(plan) {
  if (!plan) {
    console.error("No plan data received");
    return;
  }
  
  // Clear existing courses from all semester columns
  document.querySelectorAll('.course-drop-zone').forEach(zone => {
    zone.innerHTML = '';
  });
  
  // Add courses to each semester column
  Object.entries(plan).forEach(([termId, courses]) => {
    const column = document.getElementById(termId);
    if (!column) {
      console.warn(`Term column ${termId} not found`);
      return;
    }
    
    const dropZone = column.querySelector('.course-drop-zone');
    if (!dropZone) {
      console.warn(`Drop zone in ${termId} not found`);
      return;
    }
    
    courses.forEach(course => {
      const courseCard = document.createElement('div');
      courseCard.className = 'course-card';
      courseCard.setAttribute('draggable', 'true');
      courseCard.setAttribute('data-tags', course.tags.join(' '));
      
      // Create course card HTML
      let cardHTML = `${course.code}`;
      
      // Add units if present
      if (course.units) {
        cardHTML += ` <span class="units">(${course.units})</span>`;
      }
      
      // Add tags
      cardHTML += course.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
      
      // Add tooltip with additional info
      let tooltipContent = `${course.name}`;
      if (course.prerequisites && course.prerequisites.length > 0) {
        tooltipContent += `\nPrerequisites: ${course.prerequisites.join(', ')}`;
      }
      if (course.additionalNotes) {
        tooltipContent += `\nNote: ${course.additionalNotes}`;
      }
      
      courseCard.setAttribute('title', tooltipContent);
      courseCard.innerHTML = cardHTML;
      
      // Add the course card to the drop zone
      dropZone.appendChild(courseCard);
      
      // Setup drag events for the new card
      setupCardDragEvents(courseCard);
    });
  });
}

// Handle sending a message to the AI
async function handleSendMessage() {
  const aiInput = document.getElementById('aiInput');
  const aiMessage = document.getElementById('aiMessage');
  
  const message = aiInput.value.trim();
  if (!message) return;
  
  // Add the user message to the chat
  addMessage(message, true);
  
  // Clear the input
  aiInput.value = '';
  
  // Add loading message
  const loadingMsg = document.createElement('p');
  loadingMsg.textContent = "Working on it...";
  loadingMsg.id = "loading-message";
  aiMessage.appendChild(loadingMsg);
  
  try {
    // Process the message
    const result = await processUserMessage(message);
    
    // Remove loading message
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    // Add the AI response
    addMessage(result.response);
    
    // Apply the plan to the UI if there is one
    if (result.plan) {
      applyPlanToUI(result.plan);
      addMessage("✅ Plan generated successfully! You can now drag and drop courses to make adjustments.");
    }
    
    // Handle constraint updates
    if (result.action === "updateConstraints") {
      // If we already have a plan displayed, regenerate it with new constraints
      const lastPlanCommand = localStorage.getItem('lastPlanCommand');
      if (lastPlanCommand) {
        addMessage("Updating your plan with the new constraints...");
        const updateResult = await processUserMessage(lastPlanCommand);
        if (updateResult.plan) {
          applyPlanToUI(updateResult.plan);
          addMessage("✅ Plan updated successfully!");
        }
      }
    }
  } catch (error) {
    console.error("Error processing message:", error);
    
    // Remove loading message
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    addMessage(`Error: ${error.message}. Please try again.`);
  }
}

// Function to add a message to the AI chat
function addMessage(message, isUser = false) {
  const aiMessage = document.getElementById('aiMessage');
  const messageElem = document.createElement('p');
  messageElem.textContent = message;
  if (isUser) {
    messageElem.classList.add('user-message');
    
    // Store this command if it's a plan command
    if (message.toLowerCase().startsWith('plan')) {
      localStorage.setItem('lastPlanCommand', message);
    }
  }
  aiMessage.appendChild(messageElem);
  aiMessage.scrollTop = aiMessage.scrollHeight;
}

// On page load, set up the UI and initialize backend
document.addEventListener('DOMContentLoaded', async () => {
  const courseList = document.getElementById("courseList");
  const semesterColumns = document.querySelectorAll(".semester-column");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const aiSend = document.getElementById('aiSend');
  const aiInput = document.getElementById('aiInput');

  // Initialize drag events for course cards
  const courseCards = Array.from(courseList ? courseList.children : []);
  courseCards.forEach(setupCardDragEvents);

  // Set up drop targets
  if (courseList) {
    courseList.addEventListener("dragover", handleDragOver);
    courseList.addEventListener("dragleave", handleDragLeave);
    courseList.addEventListener("drop", handleDrop);
  }

  semesterColumns.forEach(column => {
    const dropZone = column.querySelector('.course-drop-zone');
    if (dropZone) {
      dropZone.addEventListener("dragover", handleDragOver);
      dropZone.addEventListener("dragleave", handleDragLeave);
      dropZone.addEventListener("drop", handleDrop);
    }
  });

  // Set up filter buttons
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tag = btn.getAttribute("data-filter");
      const cards = document.querySelectorAll('.course-card');
      
      cards.forEach(card => {
        const tags = card.getAttribute("data-tags") || '';
        if (tag === "all" || tags.includes(tag)) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
      
      localStorage.setItem('activeFilter', tag);
    });
    
    if (btn.getAttribute('data-filter') === 'all') {
      btn.classList.add('active');
    }
  });
  
  // Restore active filter
  const activeFilter = localStorage.getItem('activeFilter');
  if (activeFilter) {
    const btn = document.querySelector(`.filter-btn[data-filter="${activeFilter}"]`);
    if (btn) btn.click();
  }
  
  // Set up AI chat
  if (aiSend) {
    aiSend.addEventListener('click', handleSendMessage);
  }
  
  if (aiInput) {
    aiInput.addEventListener('keypress', event => {
      if (event.key === 'Enter') {
        handleSendMessage();
      }
    });
  }
  
  // Add initial greeting
  setTimeout(() => {
    addMessage("Hi! I'm your AI course planning assistant. I'll help you create a transfer plan.");
  }, 500);
  
  // Add sample commands
  setTimeout(() => {
    addMessage("Try these commands:\n- plan berkeley eecs\n- plan berkeley eecs and ucsd cognitive\n- avoid summer\n- limit 18\n- optimize");
    
    // Add quick action buttons
    const quickActions = document.createElement('div');
    quickActions.className = 'quick-actions';
    
    const planButton = document.createElement('button');
    planButton.textContent = "Plan Berkeley EECS";
    planButton.addEventListener('click', () => {
      if (aiInput && aiSend) {
        aiInput.value = "plan berkeley eecs";
        aiSend.click();
      }
    });
    
    const combinedPlanButton = document.createElement('button');
    combinedPlanButton.textContent = "Berkeley + UCSD Plan";
    combinedPlanButton.addEventListener('click', () => {
      if (aiInput && aiSend) {
        aiInput.value = "plan berkeley eecs and ucsd cognitive";
        aiSend.click();
      }
    });
    
    const avoidButton = document.createElement('button');
    avoidButton.textContent = "Avoid Summer";
    avoidButton.addEventListener('click', () => {
      if (aiInput && aiSend) {
        aiInput.value = "avoid summer";
        aiSend.click();
      }
    });
    
    // Add more quick action buttons
    const uclaButton = document.createElement('button');
    uclaButton.textContent = "UCLA CS Plan";
    uclaButton.addEventListener('click', () => {
      if (aiInput && aiSend) {
        aiInput.value = "plan ucla cs";
        aiSend.click();
      }
    });

    const sjsuButton = document.createElement('button');
    sjsuButton.textContent = "SJSU Software Eng";
    sjsuButton.addEventListener('click', () => {
      if (aiInput && aiSend) {
        aiInput.value = "plan sjsu software";
        aiSend.click();
      }
    });

    const limitButton = document.createElement('button');
    limitButton.textContent = "Set 15 Unit Limit";
    limitButton.addEventListener('click', () => {
      if (aiInput && aiSend) {
        aiInput.value = "limit 15";
        aiSend.click();
      }
    });

    const optimizeButton = document.createElement('button');
    optimizeButton.textContent = "Optimize Plan";
    optimizeButton.addEventListener('click', () => {
      if (aiInput && aiSend) {
        aiInput.value = "optimize";
        aiSend.click();
      }
    });
    
    quickActions.appendChild(planButton);
    quickActions.appendChild(combinedPlanButton);
    quickActions.appendChild(avoidButton);
    quickActions.appendChild(uclaButton);
    quickActions.appendChild(sjsuButton);
    quickActions.appendChild(limitButton);
    quickActions.appendChild(optimizeButton);
    
    const aiMessage = document.getElementById('aiMessage');
    if (aiMessage) {
      aiMessage.appendChild(quickActions);
    }
  }, 1000);
  
  // Initialize the backend algorithms
  try {
    await initializeBackend();
    console.log("Backend initialized successfully");
  } catch (error) {
    console.error("Error initializing backend:", error);
    addMessage("Error initializing planning algorithms. Please refresh the page.");
  }
  
  // Add the demo button
  addDemoButton();
});

// Function to initialize a demo plan
function initializeDemoPlan() {
  const aiInput = document.getElementById('aiInput');
  const aiSend = document.getElementById('aiSend');
  
  if (aiInput && aiSend) {
    aiInput.value = "plan berkeley eecs";
    aiSend.click();
  }
}

// Add a button to initialize a demo plan
function addDemoButton() {
  const header = document.querySelector('.header');
  if (!header) return;
  
  const demoButton = document.createElement('button');
  demoButton.textContent = "Load Demo Plan";
  demoButton.className = "demo-button";
  demoButton.addEventListener('click', initializeDemoPlan);
  
  header.appendChild(demoButton);
}

// Temporary debugging code - remove after fixing the issue
window.debugShowPlan = function() {
  const targets = [
    { universityId: "ucb", majorId: "ucb_eecs" },
    { universityId: "ucsd", majorId: "ucsd_cognitive_sci" }
  ];
  
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
  
  window.generateRealPlan(targets, constraints)
    .then(plan => {
      console.log("Raw plan:", plan);
      const uiPlan = convertPlanToUI(plan);
      console.log("UI plan:", uiPlan);
      applyPlanToUI(uiPlan);
    })
    .catch(error => {
      console.error("Debug plan error:", error);
    });
};

// Add a debug button
const debugButton = document.createElement('button');
debugButton.textContent = "Debug Show Plan";
debugButton.style.position = "fixed";
debugButton.style.bottom = "10px";
debugButton.style.right = "10px";
debugButton.style.zIndex = "1000";
debugButton.addEventListener('click', window.debugShowPlan);
document.body.appendChild(debugButton);

