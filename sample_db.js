// At the top of sample_db.js, add this check
if (typeof window.sampleDBLoaded === 'undefined') {
  window.sampleDBLoaded = true;
  
  // Collection: universities
  const universities = [
    {
      _id: "ucb",
      name: "UC Berkeley",
      url: "https://www.berkeley.edu"
    }
  ];

  // Collection: majors
  const majors = [
    {
      _id: "ucb_eecs",
      universityId: "ucb",
      name: "Electrical Engineering and Computer Science",
    }
  ];

  // Collection: requirements
  const requirements = [
    {
      _id: "ucb_eecs_math",
      majorId: "ucb_eecs",
      category: "Mathematics",
      required: true,
      courses: ["ucb_math1a", "ucb_math1b", "ucb_math53", "ucb_math54"],
      selectionRule: "all",
      selectionDescription: "Complete all Mathematics courses"
    },
    {
      _id: "ucb_eecs_physics",
      majorId: "ucb_eecs",
      category: "Physics",
      required: true,
      courses: ["ucb_physics7a", "ucb_physics7b"],
      selectionRule: "all",
      selectionDescription: "Complete both Physics courses"
    },
    {
      _id: "ucb_eecs_english",
      majorId: "ucb_eecs",
      category: "English",
      required: true,
      courses: ["ucb_englishr1a", "ucb_englishr1b"],
      selectionRule: "all",
      selectionDescription: "Complete both English courses"
    },
    {
      _id: "ucb_eecs_science_elective",
      majorId: "ucb_eecs",
      category: "Science Electives",
      required: true,
      courses: [
        "ucb_astron7a", 
        "ucb_astron7b",
        "ucb_bio1a", 
        "ucb_bio1b",
        "ucb_chem1a", 
        "ucb_chem3a",
        "ucb_chem3b",
        "ucb_mcellbi32",
        "ucb_physics7c"
      ],
      selectionRule: "one",
      selectionDescription: "Complete 1 option from the Science Electives",
      courseGroups: [
        // Individual courses that can be selected alone
        {groupId: "option1", courses: ["ucb_astron7a"], description: "ASTRON 7A"},
        {groupId: "option2", courses: ["ucb_astron7b"], description: "ASTRON 7B"},
        {groupId: "option3", courses: ["ucb_bio1b"], description: "BIOL 1B"},
        {groupId: "option4", courses: ["ucb_physics7c"], description: "PHYSICS 7C"},
        
        // Course pairs and sequences (AND relationships)
        {groupId: "option5", courses: ["ucb_bio1a", "ucb_bio1al"], description: "BIOL 1A + BIOL 1AL", andRelationship: true},
        {groupId: "option6", courses: ["ucb_chem1a", "ucb_chem1al", "ucb_chem1b"], description: "CHEM 1A + CHEM 1AL + CHEM 1B", andRelationship: true},
        {groupId: "option7", courses: ["ucb_chem3a", "ucb_chem3al"], description: "CHEM 3A + CHEM 3AL", andRelationship: true},
        {groupId: "option8", courses: ["ucb_chem3b", "ucb_chem3bl"], description: "CHEM 3B + CHEM 3BL", andRelationship: true},
        {groupId: "option9", courses: ["ucb_mcellbi32", "ucb_mcellbi32l"], description: "MCELLBI 32 + MCELLBI 32L", andRelationship: true}
      ]
    },
    {
      _id: "ucb_eecs_compsci_recommended",
      majorId: "ucb_eecs",
      category: "Computer Science and EECS (Strongly Recommended)",
      required: false,
      courses: ["ucb_cs61a", "ucb_cs61b", "ucb_cs61c", "ucb_cs70", "ucb_ee16a", "ucb_ee16b"],
      selectionRule: "all",
      selectionDescription: "Strongly recommended to complete all Computer Science and EECS courses"
    }
  ];

  // Collection: uc_courses
  const ucCourses = [
    {
      _id: "ucb_astron7a",
      universityId: "ucb",
      code: "ASTRON 7A",
      name: "Astronomy",
      units: 4
    },
    {
      _id: "ucb_astron7b",
      universityId: "ucb",
      code: "ASTRON 7B",
      name: "Astronomy",
      units: 4
    },
    {
      _id: "ucb_math1a",
      universityId: "ucb",
      code: "MATH 1A",
      name: "Calculus",
      units: 4
    },
    {
      _id: "ucb_math1b",
      universityId: "ucb", 
      code: "MATH 1B",
      name: "Calculus",
      units: 4
    },
    {
      _id: "ucb_math53",
      universityId: "ucb",
      code: "MATH 53",
      name: "Multivariable Calculus",
      units: 4
    },
    {
      _id: "ucb_math54",
      universityId: "ucb",
      code: "MATH 54",
      name: "Linear Algebra and Differential Equations",
      units: 4
    },
    {
      _id: "ucb_physics7a",
      universityId: "ucb",
      code: "PHYSICS 7A",
      name: "Physics for Scientists and Engineers",
      units: 4
    },
    {
      _id: "ucb_physics7b",
      universityId: "ucb",
      code: "PHYSICS 7B",
      name: "Physics for Scientists and Engineers",
      units: 4
    },
    {
      _id: "ucb_cs61a",
      universityId: "ucb",
      code: "COMPSCI 61A",
      name: "The Structure and Interpretation of Computer Programs",
      units: 4
    },
    {
      _id: "ucb_cs61b",
      universityId: "ucb",
      code: "COMPSCI 61B",
      name: "Data Structures",
      units: 4
    },
    {
      _id: "ucb_cs61c",
      universityId: "ucb",
      code: "COMPSCI 61C",
      name: "Machine Structures",
      units: 4
    },
    {
      _id: "ucb_ee16a",
      universityId: "ucb",
      code: "EE 16A",
      name: "Designing Information Devices and Systems I",
      units: 4
    },
    {
      _id: "ucb_ee16b",
      universityId: "ucb",
      code: "EE 16B",
      name: "Designing Information Devices and Systems II",
      units: 4
    },
    {
      _id: "ucb_englishr1a",
      universityId: "ucb",
      code: "ENGL 1A",
      name: "English Composition",
      units: 4
    },
    {
      _id: "ucb_englishr1b",
      universityId: "ucb",
      code: "ENGL 1B",
      name: "English Composition",
      units: 4
    },
    {
      _id: "ucb_bio1a",
      universityId: "ucb",
      code: "BIOL 1A",
      name: "General Biology",
      units: 3
    },
    {
      _id: "ucb_bio1al",
      universityId: "ucb",
      code: "BIOL 1AL",
      name: "General Biology Laboratory",
      units: 2
    },
    {
      _id: "ucb_bio1b",
      universityId: "ucb",
      code: "BIOL 1B",
      name: "General Biology",
      units: 4
    },
    {
      _id: "ucb_chem1a",
      universityId: "ucb",
      code: "CHEM 1A",
      name: "General Chemistry",
      units: 3
    },
    {
      _id: "ucb_chem1al",
      universityId: "ucb",
      code: "CHEM 1AL",
      name: "General Chemistry Laboratory",
      units: 1
    },
    {
      _id: "ucb_chem1b",
      universityId: "ucb",
      code: "CHEM 1B",
      name: "General Chemistry",
      units: 4
    },
    {
      _id: "ucb_chem3a",
      universityId: "ucb",
      code: "CHEM 3A",
      name: "Organic Chemistry",
      units: 3
    },
    {
      _id: "ucb_chem3al",
      universityId: "ucb",
      code: "CHEM 3AL",
      name: "Organic Chemistry Laboratory",
      units: 2
    },
    {
      _id: "ucb_chem3b",
      universityId: "ucb",
      code: "CHEM 3B",
      name: "Organic Chemistry",
      units: 3
    },
    {
      _id: "ucb_chem3bl",
      universityId: "ucb",
      code: "CHEM 3BL",
      name: "Organic Chemistry Laboratory",
      units: 2
    },
    {
      _id: "ucb_mcellbi32",
      universityId: "ucb",
      code: "MCELLBI 32",
      name: "Introduction to Human Physiology",
      units: 3
    },
    {
      _id: "ucb_mcellbi32l",
      universityId: "ucb",
      code: "MCELLBI 32L",
      name: "Introduction to Human Physiology Laboratory",
      units: 2
    },
    {
      _id: "ucb_physics7c",
      universityId: "ucb",
      code: "PHYSICS 7C",
      name: "Physics for Scientists and Engineers",
      units: 4
    },
    {
      _id: "ucb_cs70",
      universityId: "ucb",
      code: "COMPSCI 70",
      name: "Discrete Mathematics and Probability Theory",
      units: 4
    }
  ];

  // Collection: deanza_courses
  const deanzaCourses = [
    {
      _id: "da_ewrt1a",
      code: "EWRT 1A",
      name: "English Composition",
      units: 5
    },
    {
      _id: "da_ewrt1b",
      code: "EWRT 1B",
      name: "English Composition",
      units: 5,
      prerequisites: ["EWRT 1A"] 
    },
    {
      _id: "da_ewrt2",
      code: "EWRT 2",
      name: "English Composition",
      units: 5,
      prerequisites: ["EWRT 1A"]
    },
    {
      _id: "da_math1a",
      code: "MATH 1A",
      name: "Calculus",
      units: 5,
      prerequisites: []
    },
    {
      _id: "da_math1b",
      code: "MATH 1B",
      name: "Calculus",
      units: 5,
      prerequisites: ["MATH 1A"],
    },
    {
      _id: "da_math1c",
      code: "MATH 1C",
      name: "Multivariable Calculus",
      units: 5,
      prerequisites: ["MATH 1B"],
      termsOffered: ["Fall", "Winter", "Spring", "Summer"]
    },
    {
      _id: "da_math1d",
      code: "MATH 1D",
      name: "Differential Equations",
      units: 5,
      prerequisites: ["MATH 1C"],
      termsOffered: ["Fall", "Winter", "Spring"]
    },
    {
      _id: "da_math2a",
      code: "MATH 2A",
      name: "Linear Algebra",
      units: 5,
      prerequisites: ["MATH 1D"],
      termsOffered: ["Fall", "Winter", "Spring"]
    },
    {
      _id: "da_phys4a",
      code: "PHYS 4A",
      name: "Physics for Scientists and Engineers: Mechanics",
      units: 6,
      prerequisites: ["MATH 1A"],
      termsOffered: ["Fall", "Winter", "Spring"]
    },
    {
      _id: "da_phys4b",
      code: "PHYS 4B",
      name: "Physics for Scientists and Engineers: Electricity and Magnetism",
      units: 6,
      prerequisites: ["PHYS 4A", "MATH 1B"],
      termsOffered: ["Fall", "Winter", "Spring"]
    },
    {
      _id: "da_cis22a",
      code: "CIS 22A",
      name: "Beginning Programming Methodologies in C++",
      units: 4.5,
      prerequisites: [],
      termsOffered: ["Fall", "Winter", "Spring"]
    },
    {
      _id: "da_cis22b",
      code: "CIS 22B",
      name: "Intermediate Programming Methodologies in C++",
      units: 4.5,
      prerequisites: ["CIS 22A"],
      termsOffered: ["Fall", "Winter", "Spring"]
    },
    {
      _id: "da_cis22c",
      code: "CIS 22C",
      name: "Data Abstraction and Structures",
      units: 4.5,
      prerequisites: ["CIS 22B"],
      termsOffered: ["Fall", "Winter", "Spring"],
      additionalNotes: "Must complete an additional university course after transfer to satisfy this requirement"
    },
    {
      _id: "da_cis22ch",
      code: "CIS 22CH",
      name: "Data Abstraction and Structures - HONORS",
      units: 4.5,
      prerequisites: ["CIS 22B"],
      termsOffered: ["Fall", "Winter", "Spring"],
      additionalNotes: "Must complete an additional university course after transfer to satisfy this requirement"
    },
    {
      _id: "da_cis26b",
      code: "CIS 26B",
      name: "Advanced C Programming",
      units: 4.5,
      prerequisites: ["CIS 26A"], // Assuming this is the prerequisite
      termsOffered: ["Fall", "Spring"],
      additionalNotes: "Must complete an additional university course after transfer to satisfy this requirement"
    },
    {
      _id: "da_cis31",
      code: "CIS 31",
      name: "Assembly Language Programming",
      units: 4.5,
      prerequisites: ["CIS 22B"],
      termsOffered: ["Fall", "Spring"]
    },
    {
      _id: "da_math2b",
      code: "MATH 2B",
      name: "Linear Algebra",
      units: 5,
      prerequisites: ["MATH 1D"],
    }
  ];

  // Collection: course_equivalencies
  const courseEquivalencies = [
    // Mathematics
    {
      _id: "eq_math1a",
      ucCourseId: "ucb_math1a",
      daCourseIds: ["da_math1a", "da_math1b"],
      andRelationship: true,
      isSequentialPair: true
    },
    {
      _id: "eq_math1b",
      ucCourseId: "ucb_math1b",
      daCourseIds: ["da_math1b", "da_math1c"],
      andRelationship: true,
      isSequentialPair: true
    },
    {
      _id: "eq_math53",
      ucCourseId: "ucb_math53",
      daCourseIds: ["da_math1c", "da_math1d"],
      andRelationship: true,
      isSequentialPair: true
    },
    {
      _id: "eq_math54",
      ucCourseId: "ucb_math54",
      daCourseIds: ["da_math2a", "da_math2b"],
      andRelationship: true,
      isSequentialPair: true
    },
    
    // Physics
    {
      _id: "eq_physics7a",
      ucCourseId: "ucb_physics7a",
      daCourseIds: ["da_phys4a"]
    },
    {
      _id: "eq_physics7b",
      ucCourseId: "ucb_physics7b",
      daCourseIds: ["da_phys4b", "da_phys4c"],
      andRelationship: true,
      isSequentialPair: true
    },
    {
      _id: "eq_physics7c",
      ucCourseId: "ucb_physics7c",
      daCourseIds: ["da_phys4c", "da_phys4d"],
      alternativeSets: [["da_phys4c"], ["da_phys4d"]]
    },
    
    // English
    {
      _id: "eq_englishr1a",
      ucCourseId: "ucb_englishr1a",
      daCourseIds: ["da_ewrt1a", "da_esl5"],
      alternativeSets: [["da_ewrt1a"], ["da_esl5"]]
    },
    {
      _id: "eq_englishr1b",
      ucCourseId: "ucb_englishr1b",
      daCourseIds: ["da_ewrt1b", "da_ewrt2"],
      alternativeSets: [["da_ewrt1b"], ["da_ewrt2"]]
    },
    
    // Science Electives
    {
      _id: "eq_astron7a",
      ucCourseId: "ucb_astron7a",
      daCourseIds: [],
      hasNoEquivalent: true,
      noEquivalentMessage: "No articulated equivalent at De Anza"
    },
    {
      _id: "eq_astron7b",
      ucCourseId: "ucb_astron7b",
      daCourseIds: [],
      hasNoEquivalent: true,
      noEquivalentMessage: "No articulated equivalent at De Anza"
    },
    {
      _id: "eq_bio1a_bio1al",
      ucCourseId: "ucb_bio1a", // Using this as the group key
      daCourseIds: ["da_biol6a", "da_biol6b"],
      andRelationship: true,
      groupDescription: "BIOL 1A + BIOL 1AL",
      relatedUcCourses: ["ucb_bio1al"]
    },
    {
      _id: "eq_bio1b",
      ucCourseId: "ucb_bio1b",
      daCourseIds: ["da_biol6a", "da_biol6c"],
      andRelationship: true
    },
    {
      _id: "eq_chem1a_chem1al_chem1b",
      ucCourseId: "ucb_chem1a", // Using this as the group key
      daCourseIds: ["da_chem1a", "da_chem1b", "da_chem1c"],
      andRelationship: true,
      groupDescription: "CHEM 1A + CHEM 1AL + CHEM 1B",
      relatedUcCourses: ["ucb_chem1al", "ucb_chem1b"]
    },
    {
      _id: "eq_chem3a_chem3al",
      ucCourseId: "ucb_chem3a", // Using this as the group key
      daCourseIds: ["da_chem12a", "da_chem12b"],
      andRelationship: true,
      groupDescription: "CHEM 3A + CHEM 3AL",
      relatedUcCourses: ["ucb_chem3al"]
    },
    {
      _id: "eq_chem3b_chem3bl",
      ucCourseId: "ucb_chem3b", // Using this as the group key
      daCourseIds: ["da_chem12b", "da_chem12c"],
      andRelationship: true,
      groupDescription: "CHEM 3B + CHEM 3BL",
      relatedUcCourses: ["ucb_chem3bl"]
    },
    {
      _id: "eq_mcellbi32_mcellbi32l",
      ucCourseId: "ucb_mcellbi32", // Using this as the group key
      daCourseIds: ["da_biol40a", "da_biol40b", "da_biol40c"],
      andRelationship: true,
      groupDescription: "MCELLBI 32 + MCELLBI 32L",
      relatedUcCourses: ["ucb_mcellbi32l"]
    },
    
    // Computer Science and EECS
    {
      _id: "eq_cs61a",
      ucCourseId: "ucb_cs61a",
      daCourseIds: [],
      hasNoEquivalent: true,
      noEquivalentMessage: "No articulated equivalent at De Anza"
    },
    {
      _id: "eq_cs61b",
      ucCourseId: "ucb_cs61b",
      daCourseIds: ["da_cis22c", "da_cis26b"],
      isPartialEquivalent: true,
      alternativeSets: [["da_cis22c"], ["da_cis26b"]],
      additionalNotes: "Must complete an additional university course after transfer to satisfy this requirement"
    },
    {
      _id: "eq_cs61c",
      ucCourseId: "ucb_cs61c",
      daCourseIds: [],
      hasNoEquivalent: true,
      noEquivalentMessage: "No articulated equivalent at De Anza"
    },
    {
      _id: "eq_cs70",
      ucCourseId: "ucb_cs70",
      daCourseIds: [],
      hasNoEquivalent: true,
      noEquivalentMessage: "This course must be taken at the university after transfer"
    },
    {
      _id: "eq_ee16a",
      ucCourseId: "ucb_ee16a",
      daCourseIds: ["da_engr37", "da_math2a", "da_math2b"],
      andRelationship: true,
      isPartialEquivalent: true,
      additionalNotes: "Must complete an additional university course after transfer to satisfy this requirement. Regular and honors courses may be combined to complete this series."
    },
    {
      _id: "eq_ee16b",
      ucCourseId: "ucb_ee16b",
      daCourseIds: [],
      hasNoEquivalent: true,
      noEquivalentMessage: "No articulated equivalent at De Anza"
    }
  ];

  // Export using CommonJS style
  module.exports = { 
    universities, 
    majors, 
    requirements, 
    ucCourses, 
    deanzaCourses, 
    courseEquivalencies 
  };
} else {
  // If already loaded, just provide an empty export
  module.exports = window.sampleDB || {};
}
