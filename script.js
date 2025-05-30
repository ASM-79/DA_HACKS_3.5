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
    column.addEventListener("dragover", handleDragOver);
    column.addEventListener("dragleave", handleDragLeave);
    column.addEventListener("drop", handleDrop);
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
});
