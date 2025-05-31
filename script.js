// Store the currently dragged item
let draggedItem = null;

// Handle drag start for course cards
function handleDragStart(e) {
  // Store the dragged item
  draggedItem = e.target;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.outerHTML);
  
  // Add visual feedback
  e.target.classList.add('dragging');
}

// Handle drag end
function handleDragEnd(e) {
  // Remove visual feedback
  e.target.classList.remove('dragging');
  draggedItem = null;
}

// Handle drag over
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  // Add visual feedback for drop zones
  const dropZone = e.target.closest('.course-drop-zone, #courseList');
  if (dropZone) {
    dropZone.classList.add('drag-over');
  }
}

// Handle drag leave
function handleDragLeave(e) {
  // Remove visual feedback when leaving a drop zone
  const dropZone = e.target.closest('.course-drop-zone, #courseList');
  if (dropZone && !dropZone.contains(e.relatedTarget)) {
    dropZone.classList.remove('drag-over');
  }
}

// Handle drop
function handleDrop(e) {
  e.preventDefault();
  
  // Remove visual feedback from all drop zones
  document.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
  
  // Get the drop target (either a course list or a semester column)
  const dropZone = e.target.closest('.course-drop-zone, #courseList');
  if (!dropZone) return;
  
  // If we have a dragged item (for reordering within the same container)
  if (draggedItem) {
    // If dropping on another course, insert before it
    if (e.target.classList.contains('course-card')) {
      e.target.parentNode.insertBefore(draggedItem, e.target);
    } else {
      // Otherwise, append to the drop zone
      dropZone.appendChild(draggedItem);
    }
  } 
  // If we're moving from one container to another
  else if (e.dataTransfer.getData('text/html')) {
    // Clone the dragged item
    const data = e.dataTransfer.getData('text/html');
    const temp = document.createElement('div');
    temp.innerHTML = data;
    const newItem = temp.firstElementChild;
    
    // Set up event listeners for the new item
    setupCardDragEvents(newItem);
    
    // If dropping on another course, insert before it
    if (e.target.classList.contains('course-card')) {
      e.target.parentNode.insertBefore(newItem, e.target);
    } else {
      // Otherwise, append to the drop zone
      dropZone.appendChild(newItem);
    }
    
    // If moving from sidebar to semester or vice versa, remove the original
    const sourceList = document.querySelector('.dragging-source');
    if (sourceList && sourceList !== dropZone) {
      const original = sourceList.querySelector('.dragging');
      if (original) original.remove();
    }
  }
  
  // Clean up
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.dragging-source').forEach(el => el.classList.remove('dragging-source'));
}

// Set up drag events for a card
function setupCardDragEvents(card) {
  card.setAttribute('draggable', 'true');
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);
  
  // Store the source container when dragging starts
  card.addEventListener('dragstart', function(e) {
    this.classList.add('dragging');
    this.closest('.course-drop-zone, #courseList')?.classList.add('dragging-source');
  });
  
  card.addEventListener('dragend', function() {
    this.classList.remove('dragging');
    document.querySelectorAll('.dragging-source').forEach(el => el.classList.remove('dragging-source'));
  });
}

// Demo course data - plans for different majors
const demoPlans = {
  "berkeley_eecs": {
    "fall-24": [
      { code: "MATH 1A", name: "Calculus I", units: 5, tags: ["Major", "GE"] },
      { code: "PHYS 4A", name: "Physics for Scientists and Engineers I", units: 5, tags: ["Major", "GE"] },
      { code: "EWRT 1A", name: "Composition and Reading", units: 4.5, tags: ["GE", "IGETC"] }
    ],
    "winter-25": [
      { code: "MATH 1B", name: "Calculus II", units: 5, tags: ["Major", "GE"] },
      { code: "PHYS 4B", name: "Physics for Scientists and Engineers II", units: 5, tags: ["Major", "GE"] },
      { code: "EWRT 1B", name: "Critical Reading, Writing and Thinking", units: 4.5, tags: ["GE", "IGETC"] }
    ],
    "spring-25": [
      { code: "MATH 1C", name: "Calculus III", units: 5, tags: ["Major", "GE"] },
      { code: "PHYS 4C", name: "Physics for Scientists and Engineers III", units: 5, tags: ["Major", "GE"] },
      { code: "CIS 22A", name: "Python Programming", units: 4.5, tags: ["Major"] }
    ],
    "fall-25": [
      { code: "MATH 1D", name: "Calculus IV", units: 5, tags: ["Major", "GE"] },
      { code: "PHYS 4D", name: "Physics for Scientists and Engineers IV", units: 5, tags: ["Major", "GE"] },
      { code: "CIS 22B", name: "Intermediate Programming Methodologies in C++", units: 4.5, tags: ["Major"] }
    ],
    "winter-26": [
      { code: "MATH 2A", name: "Differential Equations", units: 5, tags: ["Major", "GE"] },
      { code: "CIS 22C", name: "Data Abstraction and Structures", units: 4.5, tags: ["Major"] },
      { code: "ENGR 37", name: "Introduction to Circuit Analysis", units: 5, tags: ["Major"] }
    ],
    "spring-26": [
      { code: "MATH 2B", name: "Linear Algebra", units: 5, tags: ["Major", "GE"] },
      { code: "CIS 35A", name: "Java Programming", units: 4.5, tags: ["Major"] }
    ]
  },
  "ucla_cs": {
    "fall-24": [
      { code: "MATH 1A", name: "Calculus I", units: 5, tags: ["Major", "GE"] },
      { code: "PHYS 4A", name: "Physics for Scientists and Engineers I", units: 5, tags: ["Major", "GE"] },
      { code: "EWRT 1A", name: "Composition and Reading", units: 4.5, tags: ["GE", "IGETC"] }
    ],
    "winter-25": [
      { code: "MATH 1B", name: "Calculus II", units: 5, tags: ["Major", "GE"] },
      { code: "PHYS 4B", name: "Physics for Scientists and Engineers II", units: 5, tags: ["Major", "GE"] },
      { code: "CIS 22A", name: "Python Programming", units: 4.5, tags: ["Major"] }
    ],
    "spring-25": [
      { code: "MATH 1C", name: "Calculus III", units: 5, tags: ["Major", "GE"] },
      { code: "CIS 22B", name: "Intermediate Programming Methodologies in C++", units: 4.5, tags: ["Major"] },
      { code: "EWRT 1B", name: "Critical Reading, Writing and Thinking", units: 4.5, tags: ["GE", "IGETC"] }
    ],
    "fall-25": [
      { code: "MATH 1D", name: "Calculus IV", units: 5, tags: ["Major", "GE"] },
      { code: "CIS 22C", name: "Data Abstraction and Structures", units: 4.5, tags: ["Major"] }
    ]
  },
  "ucsd_cognitive": {
    "fall-24": [
      { code: "PSYC 1", name: "General Psychology", units: 4, tags: ["Major", "GE"] },
      { code: "MATH 1A", name: "Calculus I", units: 5, tags: ["Major", "GE"] },
      { code: "EWRT 1A", name: "Composition and Reading", units: 4.5, tags: ["GE", "IGETC"] }
    ],
    "winter-25": [
      { code: "PSYC 2", name: "Research Methods", units: 4, tags: ["Major"] },
      { code: "MATH 1B", name: "Calculus II", units: 5, tags: ["Major", "GE"] },
      { code: "EWRT 1B", name: "Critical Reading, Writing and Thinking", units: 4.5, tags: ["GE", "IGETC"] }
    ],
    "spring-25": [
      { code: "PSYC 3", name: "Intro to Cognitive Psychology", units: 4, tags: ["Major"] },
      { code: "CIS 22A", name: "Python Programming", units: 4.5, tags: ["Major"] },
      { code: "BIOL 6A", name: "Cell and Molecular Biology", units: 5, tags: ["Major", "GE"] }
    ],
    "fall-25": [
      { code: "PSYC 5", name: "Intro to Social Psychology", units: 4, tags: ["Major"] },
      { code: "BIOL 6B", name: "Cell and Molecular Biology Lab", units: 5, tags: ["Major", "GE"] },
      { code: "PHIL 7", name: "Intro to Philosophy of Mind", units: 4, tags: ["Major", "GE"] }
    ]
  }
};

// Current state
let currentPlan = null;
let currentTarget = { university: "berkeley", major: "eecs" };
let currentConstraints = {
  avoidSummer: false,
  maxUnits: 15
};

document.addEventListener('DOMContentLoaded', () => {
  const courseList = document.getElementById("courseList");
  const semesterColumns = document.querySelectorAll(".semester-column");
  const filterButtons = document.querySelectorAll(".filter-btn");

  // Initialize drag events for all initial course cards
  const courseCards = Array.from(courseList ? courseList.children : []);
  courseCards.forEach(setupCardDragEvents);

  // Make the sidebar a drop target
  if (courseList) {
    courseList.addEventListener("dragover", handleDragOver);
    courseList.addEventListener("dragleave", handleDragLeave);
    courseList.addEventListener("drop", handleDrop);
  }

  // === Semester Column Drop Targets ===
  semesterColumns.forEach(column => {
    const dropZone = column.querySelector('.course-drop-zone');
    if (dropZone) {
      dropZone.addEventListener("dragover", handleDragOver);
      dropZone.addEventListener("dragleave", handleDragLeave);
      dropZone.addEventListener("drop", handleDrop);
    }
  });

  // Update course cards for filtering
  function updateCourseCards() {
    const cards = document.querySelectorAll('.course-card');
    cards.forEach(setupCardDragEvents);
  }

  // === Filter Buttons ===
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      filterButtons.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
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
      
      // Store the active filter
      localStorage.setItem('activeFilter', tag);
    });
    
    // Initialize active state from localStorage
    if (btn.getAttribute('data-filter') === 'all') {
      btn.classList.add('active');
    }
  });
  
  // Apply stored filter on page load
  const activeFilter = localStorage.getItem('activeFilter');
  if (activeFilter) {
    const btn = document.querySelector(`.filter-btn[data-filter="${activeFilter}"]`);
    if (btn) {
      btn.click(); // Trigger the click to apply the filter
    }
  }

  // AI Advisor Interaction
  const aiInput = document.getElementById('aiInput');
  const aiSend = document.getElementById('aiSend');
  const aiMessage = document.getElementById('aiMessage');
  
  // Function to add a message to the AI chat
  function addMessage(message, isUser = false) {
    const messageElem = document.createElement('p');
    messageElem.textContent = message;
    if (isUser) {
      messageElem.classList.add('user-message');
    }
    aiMessage.appendChild(messageElem);
    aiMessage.scrollTop = aiMessage.scrollHeight;
  }
  
  // Function to apply a plan to the UI
  function applyPlanToUI(planKey) {
    // Get the plan data
    const plan = demoPlans[planKey];
    if (!plan) {
      console.error(`Plan not found for key: ${planKey}`);
      addMessage("Error: Could not generate a plan. Please try again.");
      return;
    }
    
    currentPlan = planKey;
    
    // Clear existing courses from all semester columns
    document.querySelectorAll('.course-drop-zone').forEach(zone => {
      zone.innerHTML = '';
    });
    
    // Add courses to each semester column
    Object.entries(plan).forEach(([termId, courses]) => {
      // Skip summer terms if avoiding summer
      if (currentConstraints.avoidSummer && termId.includes('summer')) {
        return;
      }
      
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
      
      // Limit courses to respect max units
      let termUnits = 0;
      const coursesToAdd = [];
      
      for (const course of courses) {
        if (termUnits + course.units <= currentConstraints.maxUnits) {
          coursesToAdd.push(course);
          termUnits += course.units;
        } else {
          // Find the next non-summer term to place this course
          const allTermIds = Object.keys(plan);
          let nextTermIndex = allTermIds.indexOf(termId) + 1;
          
          while (nextTermIndex < allTermIds.length) {
            const nextTermId = allTermIds[nextTermIndex];
            
            // Skip summer terms if avoiding summer
            if (currentConstraints.avoidSummer && nextTermId.includes('summer')) {
              nextTermIndex++;
              continue;
            }
            
            // Add to this term
            const nextColumn = document.getElementById(nextTermId);
            if (nextColumn) {
              const nextDropZone = nextColumn.querySelector('.course-drop-zone');
              if (nextDropZone) {
                // Create a card for this term
                createCourseCard(course, nextDropZone);
                break;
              }
            }
            
            nextTermIndex++;
          }
        }
      }
      
      // Add the approved courses to this term
      coursesToAdd.forEach(course => {
        createCourseCard(course, dropZone);
      });
    });
    
    // Update the success message
    addMessage("✅ Plan generated successfully! You can now drag and drop courses to make adjustments.");
  }
  
  // Helper to create a course card
  function createCourseCard(course, dropZone) {
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
    
    courseCard.innerHTML = cardHTML;
    
    // Add the course card to the drop zone
    dropZone.appendChild(courseCard);
    
    // Setup drag events for the new card
    setupCardDragEvents(courseCard);
  }
  
  // Process user message and generate a response
  function processUserMessage(message) {
    message = message.toLowerCase().trim();
    
    // Check for plan command: "plan [university] [major]"
    if (message.startsWith('plan')) {
      const parts = message.split(' ');
      if (parts.length >= 3) {
        const university = parts[1];
        const major = parts[2];
        
        // Map to known plans
        let planKey = null;
        
        if (university === 'berkeley' && (major === 'eecs' || major === 'cs')) {
          planKey = 'berkeley_eecs';
          currentTarget.university = 'berkeley';
          currentTarget.major = 'eecs';
        } else if (university === 'ucla' && major === 'cs') {
          planKey = 'ucla_cs';
          currentTarget.university = 'ucla';
          currentTarget.major = 'cs';
        } else if ((university === 'ucsd' && major === 'cognitive') || 
                  (university === 'ucsd' && major === 'cogsci')) {
          planKey = 'ucsd_cognitive';
          currentTarget.university = 'ucsd';
          currentTarget.major = 'cognitive';
        }
        
        if (planKey) {
          addMessage(`Generating your optimized transfer plan for ${university.toUpperCase()} ${major.toUpperCase()}...`);
          
          // Use setTimeout to simulate processing time
          setTimeout(() => {
            applyPlanToUI(planKey);
          }, 1000);
          
          return;
        } else {
          return addMessage(`Sorry, I don't have a plan for ${university} ${major} yet. Try "plan berkeley eecs", "plan ucla cs", or "plan ucsd cognitive".`);
        }
      } else {
        return addMessage("Please specify a university and major, for example: plan berkeley eecs");
      }
    }
    
    // Check for avoid command: "avoid [term]"
    if (message.startsWith('avoid')) {
      if (message.includes('summer')) {
        currentConstraints.avoidSummer = true;
        addMessage("I'll avoid scheduling classes in summer terms.");
        
        // Regenerate the plan if we have one
        if (currentPlan) {
          setTimeout(() => {
            applyPlanToUI(currentPlan);
          }, 500);
        }
        
        return;
      } else {
        return addMessage("I can help you avoid specific terms. Try 'avoid summer' to skip summer terms.");
      }
    }
    
    // Check for limit command: "limit [units]"
    if (message.startsWith('limit')) {
      const parts = message.split(' ');
      if (parts.length >= 2 && !isNaN(parts[1])) {
        const unitLimit = parseInt(parts[1]);
        
        if (unitLimit >= 8 && unitLimit <= 25) {
          currentConstraints.maxUnits = unitLimit;
          addMessage(`Setting your unit limit per term to ${unitLimit}.`);
          
          // Regenerate the plan if we have one
          if (currentPlan) {
            setTimeout(() => {
              applyPlanToUI(currentPlan);
            }, 500);
          }
          
          return;
        }
      }
      
      return addMessage("Please specify a reasonable unit limit between 8 and 25, for example: limit 18");
    }
    
    // Check for optimize command
    if (message === 'optimize') {
      if (!currentPlan) {
        return addMessage("Please create a plan first using 'plan [university] [major]'");
      }
      
      addMessage("Optimizing your current plan for better balance...");
      
      // Just reapply the current plan - in a real implementation this would do more
      setTimeout(() => {
        applyPlanToUI(currentPlan);
      }, 800);
      
      return;
    }
    
    // Check for help command
    if (message === 'help') {
      return addMessage(
        "Available commands:\n" +
        "- plan [university] [major] - Create a transfer plan\n" +
        "- avoid summer - Avoid scheduling classes in summer\n" +
        "- limit [units] - Set maximum units per term\n" +
        "- optimize - Balance workload across terms\n\n" +
        "Example: plan berkeley eecs"
      );
    }
    
    // Default response for unknown commands
    return addMessage("I don't understand that command. Type 'help' to see available commands.");
  }
  
  // Handle sending a message to the AI
  function handleSendMessage() {
    const message = aiInput.value.trim();
    if (!message) return;
    
    // Add the user message to the chat
    addMessage(message, true);
    
    // Clear the input
    aiInput.value = '';
    
    // Process the message (client-side only)
    processUserMessage(message);
  }
  
  // Event listeners for the AI chat
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
  
  // Initial greeting from the AI
  setTimeout(() => {
    addMessage("Hi! I'm your AI course planning assistant. I'll help you create a transfer plan.");
  }, 500);
  
  // Add sample commands to demonstrate functionality
  setTimeout(() => {
    addMessage("Try these commands:\n- plan berkeley eecs\n- avoid summer\n- limit 18\n- optimize");
  }, 1000);
  
  // Add the demo button
  addDemoButton();
});

// Function to initialize a demo plan
function initializeDemoPlan() {
  // Simulate typing and sending "plan berkeley eecs"
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
