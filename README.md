# 🎓 DeAnza Course Planning System

## 📋 Project Overview

The DeAnza Course Planning System is a comprehensive solution for community college students planning to transfer to four-year universities. The system intelligently creates optimized course plans that satisfy the articulation agreements between De Anza College and target universities like UC Berkeley, UCLA, and UC San Diego.

## ✨ Key Features

- 🎯 **Multi-University Planning**: Generate a single, optimized course plan that meets requirements for multiple university-major pairs simultaneously
- 🔄 **Smart Prerequisite Handling**: Automatically respects course prerequisites and co-requisites
- 📅 **Flexible Scheduling**: Accounts for term preferences, course load balancing, and fastest path to completion
- 🔗 **Complex Articulation Support**: Handles various articulation patterns including:
  - "Complete all courses" requirements (AND relationships)
  - "Complete one from" requirements (OR relationships)
  - Required course pairs (courses that must be taken together)
  - Courses with no De Anza equivalents

## 🏗️ Architecture

The system consists of three main components:

### 1️⃣ Database Structure

The database models complex articulation relationships between De Anza College and university courses:

- 🏛️ **Universities**: Information about target transfer institutions
- 📚 **Majors**: Different programs at each university
- 📋 **Requirements**: Course requirements for each major with selection rules
- 📖 **Courses**: Course details for both De Anza and university courses
- 🔄 **Course Equivalencies**: Mapping between De Anza and university courses

### 2️⃣ Chain Building Algorithm

The `build_chains.js` module creates prerequisite chains representing the hierarchical relationships between courses:

- 📊 Builds a directed acyclic graph (DAG) of course prerequisites
- 🔄 Handles alternative course options
- ⚠️ Identifies courses with no De Anza equivalents
- 🔗 Properly models AND/OR relationships between courses
- 📈 Calculates the "level" of each course based on its depth in the prerequisite hierarchy

```javascript
async function buildPrerequisiteChains(universityId, majorId, dbInstances) {
  // 1. Get all requirements for the major
  // 2. Get all UC courses from the requirements
  // 3. Get all equivalent De Anza courses
  // 4. Build course dependency graphs
  // 5. Handle alternative relationships
  // 6. Track courses with no articulated equivalents
  // 7. Find "terminal" courses
  // 8. Build chains from terminal courses
}
```

### 3️⃣ Planning Algorithm

The core of the system in `generate_plan.js` uses a sophisticated algorithm to create optimal course plans:

1. **📊 Flattening and Prioritization**: Courses are flattened from chains and prioritized based on:
   - Prerequisite depth level
   - Course difficulty
   - Whether they're part of a sequence
   - User preference factors

2. **📅 Term Allocation**: Courses are assigned to terms respecting:
   - Prerequisites and co-requisites
   - Maximum unit constraints
   - Term avoidance preferences
   - AND/OR relationships

3. **⚡ Plan Optimization**: The plan undergoes several optimization phases:
   - Enforcing minimum units per term
   - Balancing workload across terms
   - Ensuring continuous sequences
   - Maximizing course load for faster completion

4. **🔄 Plan Adjustment**: The generated plan can be further adjusted using:
   - Moving courses between terms
   - Adding or removing courses
   - Handling special circumstances

## 🧮 Algorithm Highlights

### 📈 Course Prioritization Logic

```javascript
function calculateCoursePriority(course, constraints) {
  let priority = course.level * 10; // Base priority on prerequisite depth
  
  // Prioritize courses that are prerequisites for many others
  priority += (course.dependents?.length || 0) * 5;
  
  // Prioritize courses that are only offered in limited terms
  if (course.termsOffered && course.termsOffered.length < 3) {
    priority += 15;
  }
  
  // Deprioritize courses in the avoid list
  if (constraints.avoidCourses && constraints.avoidCourses.includes(course.code)) {
    priority -= 30;
  }
  
  return priority;
}
```

### 📊 Sophisticated Term Allocation

The algorithm intelligently allocates courses to terms, respecting complex constraints:

- **🔗 Prerequisite Chains**: Ensures courses are taken in the correct sequence
- **🔄 Co-requisite Handling**: Identifies courses that must be taken together
- **⚖️ Alternative Selection**: Chooses the best course from equivalent alternatives
- **⏰ Term Avoidance**: Respects terms the student wants to avoid (e.g., summer)
- **📚 Unit Balancing**: Distributes workload evenly across terms

### 🔄 Term Optimization

After initial allocation, the plan undergoes several optimization steps:

1. **📈 Maximizing Units**: Fills terms to approach the maximum unit cap
2. **📉 Enforcing Minimum Units**: Ensures each term has at least the minimum required units
3. **⚖️ Balancing Workload**: Redistributes courses for more even workload
4. **🔗 Continuous Sequences**: Ensures course sequences aren't interrupted

## 💻 Usage Example

```javascript
// Define user constraints
const constraints = {
  startTerm: "Fall 2023",
  maxUnitsPerTerm: 20,
  minUnitsPerTerm: 10,
  maxTerms: 8,
  avoidTerms: ["Summer 2023"],
  avoidCourses: [],
  balanceWorkload: false,
  finishFastest: true
};

// Specify target university-major pairs
const targets = [
  { universityId: "ucb", majorId: "ucb_eecs" },
  { universityId: "ucla", majorId: "ucla_cs" }
];

// Generate a combined plan that satisfies both targets
const plan = await generateCombinedPlan(targets, constraints);
```

## 🚀 Future Enhancements

- 🌐 Web-based user interface for plan visualization
- 🔄 Integration with De Anza College's class scheduling system
- 📚 Support for additional articulation patterns
- 🧠 Personal preference learning to improve recommendations
- 📊 GPA and difficulty optimization

## 👥 Contributors

- Team DA_HACKS_3.5

---
<div align="center">
  <sub>Built with ❤️ by Team DA_HACKS_3.5</sub>
</div>
