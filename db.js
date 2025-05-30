const transferData = {
  universities: {
    ucb: {
      majors: {
        eecs: {
          required: {
            math1a: ["da_math1a", "da_math1b"],
            math1b: ["da_math1c", "da_math1d"],
            math53: ["da_math1c"],
            math54: ["da_math2a", "da_math2b"]
          },
          optional: {
            phy1a: ["da_phys4a"]
          }
        },
        datasci: {
          required: {
            math1a: ["da_math1a", "da_math1b"],
            stat20: ["da_math10", "da_math10h"],
            cs61a: ["da_cis35a"]
          },
          optional: {
            data8: ["da_cis41a"]
          }
        }
      }
    },

    ucla: {
      majors: {
        cs: {
          required: {
            math31a: ["da_math1a", "da_math1b"],
            math31b: ["da_math1c"],
            cs31: ["da_cis22a"]
          },
          optional: {
            ling1: ["da_ling1"]
          }
        }
      }
    },

    ucsd: {
      majors: {
        cognitive_sci: {
          required: {
            psyc1: ["da_psyc1"],
            math10a: ["da_math1a", "da_math1b"],
            phil10: ["da_phil10"]
          },
          optional: {
            cs8: ["da_cis18a"]
          }
        }
      }
    },

    sjsu: {
      majors: {
        software_eng: {
          required: {
            math30: ["da_math1a"],
            math31: ["da_math1b"],
            cs46a: ["da_cis36a"]
          },
          optional: {
            engl1a: ["da_engl1a"]
          }
        }
      }
    }
  },

  universityCourses: {
    math1a: "Math 1A - Calculus",
    math1b: "Math 1B - Calculus II",
    math53: "Math 53 - Multivariable Calculus",
    math54: "Math 54 - Linear Algebra & Diff. Equations",
    phy1a: "Physics 1A - Mechanics",
    stat20: "Stat 20 - Intro to Probability & Stats",
    cs61a: "CS 61A - Structure & Interpretation",
    data8: "Data 8 - Foundations of Data Science",
    math31a: "Math 31A - Differential Calculus",
    math31b: "Math 31B - Integral Calculus",
    cs31: "CS 31 - Intro to Computer Science I",
    ling1: "Linguistics 1 - Intro to Language",
    psyc1: "Psych 1 - Intro to Psychology",
    math10a: "Math 10A - Calculus I (UCSD)",
    phil10: "Philosophy 10 - Logic",
    cs8: "CS 8 - Intro to Programming (UCSD)",
    math30: "Math 30 - Calculus I (SJSU)",
    math31: "Math 31 - Calculus II (SJSU)",
    cs46a: "CS 46A - Java Programming (SJSU)",
    engl1a: "ENGL 1A - First Year Writing"
  },

  deAnzaCourses: {
    da_math1a: "MATH 1A",
    da_math1b: "MATH 1B",
    da_math1c: "MATH 1C",
    da_math1d: "MATH 1D",
    da_math2a: "MATH 2A",
    da_math2b: "MATH 2B",
    da_phys4a: "PHYS 4A",
    da_math10: "MATH 10",
    da_math10h: "MATH 10H",
    da_cis35a: "CIS 35A - Java",
    da_cis41a: "CIS 41A - Data Analysis",
    da_cis22a: "CIS 22A - C++ Programming",
    da_ling1: "LING 1 - Intro to Language",
    da_psyc1: "PSYC 1 - Intro to Psychology",
    da_phil10: "PHIL 10 - Logic",
    da_cis18a: "CIS 18A - Python",
    da_cis36a: "CIS 36A - Java Programming",
    da_engl1a: "ENGL 1A - College Writing"
  },

  // 🔁 Equivalence table for clarity
  equivalencies: [
    // UCB
    { university: "ucb", course: "math1a", deAnza: ["da_math1a", "da_math1b"] },
    { university: "ucb", course: "math1b", deAnza: ["da_math1c", "da_math1d"] },
    { university: "ucb", course: "math53",  deAnza: ["da_math1c"] },
    { university: "ucb", course: "math54",  deAnza: ["da_math2a", "da_math2b"] },
    { university: "ucb", course: "phy1a",   deAnza: ["da_phys4a"] },
    { university: "ucb", course: "stat20",  deAnza: ["da_math10", "da_math10h"] },
    { university: "ucb", course: "cs61a",   deAnza: ["da_cis35a"] },
    { university: "ucb", course: "data8",   deAnza: ["da_cis41a"] },

    // UCLA
    { university: "ucla", course: "math31a", deAnza: ["da_math1a", "da_math1b"] },
    { university: "ucla", course: "math31b", deAnza: ["da_math1c"] },
    { university: "ucla", course: "cs31",    deAnza: ["da_cis22a"] },
    { university: "ucla", course: "ling1",   deAnza: ["da_ling1"] },

    // UCSD
    { university: "ucsd", course: "psyc1",   deAnza: ["da_psyc1"] },
    { university: "ucsd", course: "math10a", deAnza: ["da_math1a", "da_math1b"] },
    { university: "ucsd", course: "phil10",  deAnza: ["da_phil10"] },
    { university: "ucsd", course: "cs8",     deAnza: ["da_cis18a"] },

    // SJSU
    { university: "sjsu", course: "math30",  deAnza: ["da_math1a"] },
    { university: "sjsu", course: "math31",  deAnza: ["da_math1b"] },
    { university: "sjsu", course: "cs46a",   deAnza: ["da_cis36a"] },
    { university: "sjsu", course: "engl1a",  deAnza: ["da_engl1a"] }
  ]
};

// Collection: universities
const universities = [
  {
    _id: "ucb",
    name: "UC Berkeley",
    url: "https://www.berkeley.edu"
  },
  {
    _id: "ucla",
    name: "UCLA",
    url: "https://www.ucla.edu"
  },
  {
    _id: "ucsd",
    name: "UC San Diego",
    url: "https://www.ucsd.edu"
  },
  {
    _id: "sjsu",
    name: "San Jose State University",
    url: "https://www.sjsu.edu"
  }
];

// Collection: majors
const majors = [
  {
    _id: "ucb_eecs",
    universityId: "ucb",
    name: "Electrical Engineering and Computer Science",
  },
  {
    _id: "ucb_datasci",
    universityId: "ucb",
    name: "Data Science",
  },
  {
    _id: "ucla_cs",
    universityId: "ucla",
    name: "Computer Science",
  },
  {
    _id: "ucsd_cognitive_sci",
    universityId: "ucsd",
    name: "Cognitive Science",
  },
  {
    _id: "sjsu_software_eng",
    universityId: "sjsu",
    name: "Software Engineering",
  }
];

// Collection: uc_courses
const ucCourses = [
  // UCB courses
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
    name: "Calculus II",
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
    name: "Linear Algebra & Differential Equations",
    units: 4
  },
  {
    _id: "ucb_phy1a",
    universityId: "ucb",
    code: "PHYSICS 1A",
    name: "Mechanics",
    units: 4
  },
  {
    _id: "ucb_stat20",
    universityId: "ucb",
    code: "STAT 20",
    name: "Intro to Probability & Statistics",
    units: 4
  },
  {
    _id: "ucb_cs61a",
    universityId: "ucb",
    code: "CS 61A",
    name: "Structure & Interpretation of Computer Programs",
    units: 4
  },
  {
    _id: "ucb_data8",
    universityId: "ucb",
    code: "DATA 8",
    name: "Foundations of Data Science",
    units: 4
  },
  
  // UCLA courses
  {
    _id: "ucla_math31a",
    universityId: "ucla",
    code: "MATH 31A",
    name: "Differential Calculus",
    units: 4
  },
  {
    _id: "ucla_math31b",
    universityId: "ucla",
    code: "MATH 31B",
    name: "Integral Calculus",
    units: 4
  },
  {
    _id: "ucla_cs31",
    universityId: "ucla",
    code: "CS 31",
    name: "Introduction to Computer Science I",
    units: 4
  },
  {
    _id: "ucla_ling1",
    universityId: "ucla",
    code: "LING 1",
    name: "Introduction to Language",
    units: 4
  },
  
  // UCSD courses
  {
    _id: "ucsd_psyc1",
    universityId: "ucsd",
    code: "PSYC 1",
    name: "Introduction to Psychology",
    units: 4
  },
  {
    _id: "ucsd_math10a",
    universityId: "ucsd",
    code: "MATH 10A",
    name: "Calculus I",
    units: 4
  },
  {
    _id: "ucsd_phil10",
    universityId: "ucsd",
    code: "PHIL 10",
    name: "Logic",
    units: 4
  },
  {
    _id: "ucsd_cs8",
    universityId: "ucsd",
    code: "CS 8",
    name: "Introduction to Programming",
    units: 4
  },
  
  // SJSU courses
  {
    _id: "sjsu_math30",
    universityId: "sjsu",
    code: "MATH 30",
    name: "Calculus I",
    units: 3
  },
  {
    _id: "sjsu_math31",
    universityId: "sjsu",
    code: "MATH 31",
    name: "Calculus II",
    units: 3
  },
  {
    _id: "sjsu_cs46a",
    universityId: "sjsu",
    code: "CS 46A",
    name: "Java Programming",
    units: 3
  },
  {
    _id: "sjsu_engl1a",
    universityId: "sjsu",
    code: "ENGL 1A",
    name: "First Year Writing",
    units: 3
  }
];

// Collection: deanza_courses
const deanzaCourses = [
  {
    _id: "da_math1a",
    code: "MATH 1A",
    name: "Calculus",
    units: 5,
    prerequisites: [],
    termsOffered: ["Fall", "Winter", "Spring", "Summer"]
  },
  {
    _id: "da_math1b",
    code: "MATH 1B",
    name: "Calculus",
    units: 5,
    prerequisites: ["MATH 1A"],
    termsOffered: ["Fall", "Winter", "Spring", "Summer"]
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
    prerequisites: ["MATH 1C"],
    termsOffered: ["Fall", "Winter", "Spring"]
  },
  {
    _id: "da_math2b",
    code: "MATH 2B",
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
    _id: "da_math10",
    code: "MATH 10",
    name: "Statistics",
    units: 5,
    prerequisites: [],
    termsOffered: ["Fall", "Winter", "Spring", "Summer"]
  },
  {
    _id: "da_math10h",
    code: "MATH 10H",
    name: "Statistics Honors",
    units: 5,
    prerequisites: [],
    termsOffered: ["Fall", "Winter", "Spring"]
  },
  {
    _id: "da_cis35a",
    code: "CIS 35A",
    name: "Java Programming",
    units: 4.5,
    prerequisites: [],
    termsOffered: ["Fall", "Winter", "Spring"]
  },
  {
    _id: "da_cis41a",
    code: "CIS 41A",
    name: "Python Programming",
    units: 4.5,
    prerequisites: [],
    termsOffered: ["Fall", "Winter", "Spring"]
  },
  {
    _id: "da_cis22a",
    code: "CIS 22A",
    name: "C++ Programming",
    units: 4.5,
    prerequisites: [],
    termsOffered: ["Fall", "Winter", "Spring"]
  },
  {
    _id: "da_ling1",
    code: "LING 1",
    name: "Introduction to Linguistics",
    units: 4,
    prerequisites: [],
    termsOffered: ["Fall", "Spring"]
  },
  {
    _id: "da_psyc1",
    code: "PSYC 1",
    name: "General Psychology",
    units: 4,
    prerequisites: [],
    termsOffered: ["Fall", "Winter", "Spring", "Summer"]
  },
  {
    _id: "da_phil10",
    code: "PHIL 10",
    name: "Introduction to Philosophy",
    units: 4,
    prerequisites: [],
    termsOffered: ["Fall", "Winter", "Spring"]
  },
  {
    _id: "da_cis18a",
    code: "CIS 18A",
    name: "Introduction to Unix/Linux",
    units: 4.5,
    prerequisites: [],
    termsOffered: ["Fall", "Spring"]
  },
  {
    _id: "da_cis36a",
    code: "CIS 36A",
    name: "Java Programming",
    units: 4.5,
    prerequisites: [],
    termsOffered: ["Fall", "Winter", "Spring"]
  },
  {
    _id: "da_engl1a",
    code: "ENGL 1A",
    name: "Composition and Reading",
    units: 5,
    prerequisites: [],
    termsOffered: ["Fall", "Winter", "Spring", "Summer"]
  }
];

// Collection: requirements
const requirements = [
  // UCB EECS Requirements
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
    required: false,
    courses: ["ucb_phy1a"],
    selectionRule: "all",
    selectionDescription: "Complete Physics courses"
  },
  
  // UCB Data Science Requirements
  {
    _id: "ucb_datasci_math",
    majorId: "ucb_datasci",
    category: "Mathematics",
    required: true,
    courses: ["ucb_math1a", "ucb_stat20"],
    selectionRule: "all",
    selectionDescription: "Complete all Mathematics courses"
  },
  {
    _id: "ucb_datasci_cs",
    majorId: "ucb_datasci",
    category: "Computer Science",
    required: true,
    courses: ["ucb_cs61a"],
    selectionRule: "all",
    selectionDescription: "Complete required CS courses"
  },
  {
    _id: "ucb_datasci_opt",
    majorId: "ucb_datasci",
    category: "Optional Courses",
    required: false,
    courses: ["ucb_data8"],
    selectionRule: "some",
    selectionCount: 1,
    selectionDescription: "Complete some optional courses"
  },
  
  // UCLA CS Requirements
  {
    _id: "ucla_cs_math",
    majorId: "ucla_cs",
    category: "Mathematics",
    required: true,
    courses: ["ucla_math31a", "ucla_math31b"],
    selectionRule: "all",
    selectionDescription: "Complete all Mathematics courses"
  },
  {
    _id: "ucla_cs_cs",
    majorId: "ucla_cs",
    category: "Computer Science",
    required: true,
    courses: ["ucla_cs31"],
    selectionRule: "all",
    selectionDescription: "Complete required CS courses"
  },
  {
    _id: "ucla_cs_opt",
    majorId: "ucla_cs",
    category: "Optional Courses",
    required: false,
    courses: ["ucla_ling1"],
    selectionRule: "some",
    selectionCount: 1,
    selectionDescription: "Complete some optional courses"
  },
  
  // UCSD Cognitive Science Requirements
  {
    _id: "ucsd_cogsci_required",
    majorId: "ucsd_cognitive_sci",
    category: "Required Courses",
    required: true,
    courses: ["ucsd_psyc1", "ucsd_math10a", "ucsd_phil10"],
    selectionRule: "all",
    selectionDescription: "Complete all required courses"
  },
  {
    _id: "ucsd_cogsci_opt",
    majorId: "ucsd_cognitive_sci",
    category: "Optional Courses",
    required: false,
    courses: ["ucsd_cs8"],
    selectionRule: "some",
    selectionCount: 1,
    selectionDescription: "Complete some optional courses"
  },
  
  // SJSU Software Engineering Requirements
  {
    _id: "sjsu_se_math",
    majorId: "sjsu_software_eng",
    category: "Mathematics",
    required: true,
    courses: ["sjsu_math30", "sjsu_math31"],
    selectionRule: "all",
    selectionDescription: "Complete all Mathematics courses"
  },
  {
    _id: "sjsu_se_cs",
    majorId: "sjsu_software_eng",
    category: "Computer Science",
    required: true,
    courses: ["sjsu_cs46a"],
    selectionRule: "all",
    selectionDescription: "Complete required CS courses"
  },
  {
    _id: "sjsu_se_opt",
    majorId: "sjsu_software_eng",
    category: "Optional Courses",
    required: false,
    courses: ["sjsu_engl1a"],
    selectionRule: "some",
    selectionCount: 1,
    selectionDescription: "Complete some optional courses"
  }
];

// Collection: course_equivalencies
const courseEquivalencies = [
  // UCB Math
  {
    _id: "eq_ucb_math1a",
    ucCourseId: "ucb_math1a",
    daCourseIds: ["da_math1a", "da_math1b"],
    andRelationship: true,
    isSequentialPair: true
  },
  {
    _id: "eq_ucb_math1b",
    ucCourseId: "ucb_math1b",
    daCourseIds: ["da_math1c", "da_math1d"],
    andRelationship: true,
    isSequentialPair: true
  },
  {
    _id: "eq_ucb_math53",
    ucCourseId: "ucb_math53",
    daCourseIds: ["da_math1c"],
  },
  {
    _id: "eq_ucb_math54",
    ucCourseId: "ucb_math54",
    daCourseIds: ["da_math2a", "da_math2b"],
    andRelationship: true,
    isSequentialPair: true
  },
  
  // UCB Physics & Stats
  {
    _id: "eq_ucb_phy1a",
    ucCourseId: "ucb_phy1a",
    daCourseIds: ["da_phys4a"]
  },
  {
    _id: "eq_ucb_stat20",
    ucCourseId: "ucb_stat20",
    daCourseIds: ["da_math10", "da_math10h"],
    alternativeSets: [["da_math10"], ["da_math10h"]]
  },
  
  // UCB CS
  {
    _id: "eq_ucb_cs61a",
    ucCourseId: "ucb_cs61a",
    daCourseIds: ["da_cis35a"]
  },
  {
    _id: "eq_ucb_data8",
    ucCourseId: "ucb_data8",
    daCourseIds: ["da_cis41a"]
  },
  
  // UCLA Equivalencies
  {
    _id: "eq_ucla_math31a",
    ucCourseId: "ucla_math31a",
    daCourseIds: ["da_math1a", "da_math1b"],
    andRelationship: true,
    isSequentialPair: true
  },
  {
    _id: "eq_ucla_math31b",
    ucCourseId: "ucla_math31b",
    daCourseIds: ["da_math1c"]
  },
  {
    _id: "eq_ucla_cs31",
    ucCourseId: "ucla_cs31",
    daCourseIds: ["da_cis22a"]
  },
  {
    _id: "eq_ucla_ling1",
    ucCourseId: "ucla_ling1",
    daCourseIds: ["da_ling1"]
  },
  
  // UCSD Equivalencies
  {
    _id: "eq_ucsd_psyc1",
    ucCourseId: "ucsd_psyc1",
    daCourseIds: ["da_psyc1"]
  },
  {
    _id: "eq_ucsd_math10a",
    ucCourseId: "ucsd_math10a",
    daCourseIds: ["da_math1a", "da_math1b"],
    andRelationship: true,
    isSequentialPair: true
  },
  {
    _id: "eq_ucsd_phil10",
    ucCourseId: "ucsd_phil10",
    daCourseIds: ["da_phil10"]
  },
  {
    _id: "eq_ucsd_cs8",
    ucCourseId: "ucsd_cs8",
    daCourseIds: ["da_cis18a"]
  },
  
  // SJSU Equivalencies
  {
    _id: "eq_sjsu_math30",
    ucCourseId: "sjsu_math30",
    daCourseIds: ["da_math1a"]
  },
  {
    _id: "eq_sjsu_math31",
    ucCourseId: "sjsu_math31",
    daCourseIds: ["da_math1b"]
  },
  {
    _id: "eq_sjsu_cs46a",
    ucCourseId: "sjsu_cs46a",
    daCourseIds: ["da_cis36a"]
  },
  {
    _id: "eq_sjsu_engl1a",
    ucCourseId: "sjsu_engl1a",
    daCourseIds: ["da_engl1a"]
  }
];

// Helper functions to access the data
function getAvailableUniversities() {
  return universities.map(uni => ({
    id: uni._id,
    name: uni.name
  }));
}

function getAvailableMajors(universityId) {
  return majors
    .filter(major => major.universityId === universityId)
    .map(major => ({
      id: major._id,
      name: major.name
    }));
}

function getUniversityRequirements(universityId, majorId) {
  return requirements.filter(req => req.majorId === majorId);
}

module.exports = { 
  transferData,
  universities, 
  majors, 
  requirements, 
  ucCourses, 
  deanzaCourses, 
  courseEquivalencies,
  getAvailableUniversities,
  getAvailableMajors,
  getUniversityRequirements
};