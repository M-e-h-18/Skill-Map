// src/data/mockSkillsDB.js

const mockSkillsDB = {
  // Programming Languages
  'JavaScript': { type: 'skill', description: 'Dynamic programming language for web development', connections: ['TypeScript', 'React', 'Node.js', 'Vue.js', 'Angular'], category: 'Programming' },
  'Python': { type: 'skill', description: 'Versatile programming language for data science and web development', connections: ['Django', 'Flask', 'Pandas', 'TensorFlow', 'NumPy'], category: 'Programming' },
  'Java': { type: 'skill', description: 'Object-oriented programming language for enterprise applications', connections: ['Spring', 'Maven', 'Gradle', 'Android'], category: 'Programming' },
  'C++': { type: 'skill', description: 'High-performance programming language for system programming', connections: ['Qt', 'Boost', 'CMake'], category: 'Programming' },
  'C#': { type: 'skill', description: 'Microsoft programming language for .NET development', connections: ['.NET', 'ASP.NET', 'Entity Framework'], category: 'Programming' },
  'TypeScript': { type: 'skill', description: 'Typed superset of JavaScript', connections: ['Angular', 'React', 'Node.js'], category: 'Programming' },
  'Go': { type: 'skill', description: 'Google programming language for cloud and backend development', connections: ['Docker', 'Kubernetes', 'gRPC'], category: 'Programming' },
  'Rust': { type: 'skill', description: 'Systems programming language focused on safety and performance', connections: ['WebAssembly', 'Tokio'], category: 'Programming' },
  'PHP': { type: 'skill', description: 'Server-side scripting language for web development', connections: ['Laravel', 'Symfony', 'WordPress'], category: 'Programming' },
  'Ruby': { type: 'skill', description: 'Dynamic programming language focused on simplicity', connections: ['Ruby on Rails', 'Sinatra'], category: 'Programming' },

  // Frontend Technologies
  'React': { type: 'skill', description: 'JavaScript library for building user interfaces', connections: ['Redux', 'Next.js', 'TypeScript', 'React Native'], category: 'Frontend' },
  'Vue.js': { type: 'skill', description: 'Progressive JavaScript framework', connections: ['Nuxt.js', 'Vuex', 'Vue Router'], category: 'Frontend' },
  'Angular': { type: 'skill', description: 'TypeScript-based web application framework', connections: ['RxJS', 'NgRx', 'Angular Material'], category: 'Frontend' },
  'HTML': { type: 'skill', description: 'Markup language for creating web pages', connections: ['CSS', 'JavaScript', 'SASS'], category: 'Frontend' },
  'CSS': { type: 'skill', description: 'Style sheet language for web design', connections: ['SASS', 'LESS', 'Tailwind CSS', 'Bootstrap'], category: 'Frontend' },
  'SASS': { type: 'skill', description: 'CSS preprocessor with enhanced features', connections: ['CSS', 'Bootstrap'], category: 'Frontend' },
  'Tailwind CSS': { type: 'skill', description: 'Utility-first CSS framework', connections: ['CSS', 'React', 'Vue.js'], category: 'Frontend' },
  'Bootstrap': { type: 'skill', description: 'CSS framework for responsive web design', connections: ['CSS', 'JavaScript'], category: 'Frontend' },

  // Backend Technologies
  'Node.js': { type: 'skill', description: 'JavaScript runtime for server-side development', connections: ['Express.js', 'MongoDB', 'GraphQL'], category: 'Backend' },
  'Express.js': { type: 'skill', description: 'Web framework for Node.js', connections: ['Node.js', 'MongoDB', 'JWT'], category: 'Backend' },
  'Django': { type: 'skill', description: 'High-level Python web framework', connections: ['Python', 'PostgreSQL', 'REST API'], category: 'Backend' },
  'Flask': { type: 'skill', description: 'Lightweight Python web framework', connections: ['Python', 'SQLAlchemy', 'JWT'], category: 'Backend' },
  'Spring': { type: 'skill', description: 'Java framework for enterprise applications', connections: ['Java', 'Maven', 'Hibernate'], category: 'Backend' },
  'Laravel': { type: 'skill', description: 'PHP framework for web applications', connections: ['PHP', 'MySQL', 'Composer'], category: 'Backend' },
  'Ruby on Rails': { type: 'skill', description: 'Web framework for Ruby', connections: ['Ruby', 'PostgreSQL', 'Active Record'], category: 'Backend' },


  // Tools & Others
  'Git': { type: 'skill', description: 'Version control system', connections: ['GitHub', 'GitLab', 'Bitbucket'], category: 'Tools' },
  'Linux': { type: 'skill', description: 'Open-source operating system', connections: ['Bash', 'Docker', 'AWS'], category: 'Tools' },
  'GraphQL': { type: 'skill', description: 'Query language and runtime for APIs', connections: ['React', 'Node.js', 'Apollo'], category: 'API' },
  'REST API': { type: 'skill', description: 'Architectural style for web services', connections: ['HTTP', 'JSON', 'Express.js'], category: 'API' },
  'WebRTC': { type: 'skill', description: 'Real-time communication for web browsers', connections: ['JavaScript', 'Socket.io'], category: 'Web' },
  'Blockchain': { type: 'skill', description: 'Distributed ledger technology', connections: ['Solidity', 'Ethereum', 'Web3'], category: 'Blockchain' },

  // Career Roles
  'Data Scientist': { 
    type: 'role', 
    description: 'Analyzes complex data to extract business insights and build predictive models',
    requiredSkills: ['Python', 'SQL', 'Machine Learning'],
    optionalSkills: ['Pandas', 'TensorFlow', 'Tableau', 'R'],
    pathways: [['Python', 'Pandas', 'Machine Learning'], ['SQL', 'Python', 'Scikit-learn']]
  },
  'Web Developer': { 
    type: 'role', 
    description: 'Builds and maintains web applications and websites',
    requiredSkills: ['HTML', 'CSS', 'JavaScript'],
    optionalSkills: ['React', 'Node.js', 'MongoDB'],
    pathways: [['HTML', 'CSS', 'JavaScript', 'React'], ['JavaScript', 'Node.js', 'Express.js']]
  },
  'Full Stack Developer': { 
    type: 'role', 
    description: 'Develops both frontend and backend applications',
    requiredSkills: ['JavaScript', 'HTML', 'CSS', 'SQL'],
    optionalSkills: ['React', 'Node.js', 'MongoDB', 'Python'],
    pathways: [['JavaScript', 'React', 'Node.js'], ['HTML', 'CSS', 'JavaScript', 'Python']]
  },
  
  'Frontend Developer': { 
    type: 'role', 
    description: 'Specializes in user interface and user experience development',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
    optionalSkills: ['TypeScript', 'SASS', 'Vue.js'],
    pathways: [['HTML', 'CSS', 'JavaScript', 'React'], ['JavaScript', 'TypeScript', 'Angular']]
  },
  
  'Data Analyst': { 
    type: 'role', 
    description: 'Interprets data to help businesses make informed decisions',
    requiredSkills: ['SQL', 'Python'],
    optionalSkills: ['Tableau', 'Power BI', 'Excel'],
    pathways: [['SQL', 'Python', 'Pandas'], ['Excel', 'SQL', 'Tableau']]
  }
};

export default mockSkillsDB;
