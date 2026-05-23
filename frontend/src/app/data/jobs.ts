export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  deadline: string;
  posted: string;
  fitScore: number;
  fitBreakdown: {
    skills: number;
    experience: number;
    location: number;
    education: number;
  };
  saved: boolean;
  skills: string[];
  description: string;
  requirements: string[];
  requiredSkills: { skill: string; have: boolean }[];
  whyMatch: string[];
  skillGaps: string[];
  companyInitial: string;
  companyColor: string;
  link: string;
}

export const JOBS: Job[] = [
  {
    id: "1",
    title: "ML Engineer Intern",
    company: "Google",
    location: "Remote",
    type: "Internship",
    salary: "$8,000/mo",
    deadline: "Jun 15, 2026",
    posted: "2h ago",
    fitScore: 85,
    fitBreakdown: { skills: 92, experience: 78, location: 88, education: 80 },
    saved: false,
    skills: ["Python", "TensorFlow", "PyTorch"],
    companyInitial: "G",
    companyColor: "#1d4ed8",
    link: "https://example.com/jobs/google-ml-engineer-intern",
    description:
      "Join Google's ML team and work on large-scale machine learning infrastructure used by billions of users. You'll collaborate with researchers and engineers to build and deploy ML models across core Google products.",
    requirements: [
      "Pursuing BS/MS in Computer Science, ML, or related field",
      "Strong Python proficiency with ML libraries",
      "Experience with neural network architectures",
      "Solid fundamentals in linear algebra and statistics",
    ],
    requiredSkills: [
      { skill: "Python", have: true },
      { skill: "TensorFlow / PyTorch", have: true },
      { skill: "Machine Learning", have: true },
      { skill: "Data Structures & Algorithms", have: true },
      { skill: "MLOps / Production", have: false },
      { skill: "Distributed Systems", have: false },
    ],
    whyMatch: [
      "3+ years of Python experience matching their stack",
      "Past ML coursework and personal projects directly relevant",
      "Completed 2 similar internships demonstrating readiness",
      "Portfolio ML project scored high on relevance heuristic",
    ],
    skillGaps: ["MLOps / Production deployment", "Distributed training at scale"],
  },
  {
    id: "2",
    title: "Software Engineer",
    company: "Amazon",
    location: "Dhaka, Bangladesh",
    type: "Full-time",
    salary: "$95k–$130k",
    deadline: "Jun 30, 2026",
    posted: "5h ago",
    fitScore: 78,
    fitBreakdown: { skills: 80, experience: 72, location: 70, education: 76 },
    saved: true,
    skills: ["Python", "FastAPI", "AWS"],
    companyInitial: "A",
    companyColor: "#1d4ed8",
    link: "https://example.com/jobs/amazon-software-engineer",
    description:
      "Build the infrastructure that powers Amazon's global e-commerce platform. You'll design and implement scalable backend services handling millions of requests per day.",
    requirements: [
      "2+ years backend engineering experience",
      "Proficiency in Python or Java",
      "Experience with cloud platforms (AWS preferred)",
      "Strong system design fundamentals",
    ],
    requiredSkills: [
      { skill: "Python", have: true },
      { skill: "FastAPI / REST APIs", have: true },
      { skill: "AWS", have: false },
      { skill: "System Design", have: false },
      { skill: "SQL / Databases", have: true },
      { skill: "Docker / Kubernetes", have: false },
    ],
    whyMatch: [
      "Strong Python and backend API experience",
      "REST API projects align with their tech stack",
      "Database design coursework highly relevant",
    ],
    skillGaps: ["AWS cloud services", "Kubernetes orchestration", "System design at scale"],
  },
  {
    id: "3",
    title: "Backend Engineer (Python)",
    company: "Microsoft",
    location: "Remote",
    type: "Full-time",
    salary: "$110k–$145k",
    deadline: "Jul 1, 2026",
    posted: "1d ago",
    fitScore: 82,
    fitBreakdown: { skills: 88, experience: 75, location: 84, education: 78 },
    saved: false,
    skills: ["Python", "Django", "PostgreSQL"],
    companyInitial: "M",
    companyColor: "#1d4ed8",
    link: "https://example.com/jobs/microsoft-backend-engineer",
    description:
      "Help build Azure's developer platform services. You'll work on APIs and backend systems that empower thousands of developers globally.",
    requirements: [
      "3+ years Python backend experience",
      "Strong SQL and database design skills",
      "Experience with Django or FastAPI",
      "Collaborative and communication skills",
    ],
    requiredSkills: [
      { skill: "Python", have: true },
      { skill: "Django / FastAPI", have: true },
      { skill: "PostgreSQL", have: true },
      { skill: "REST API Design", have: true },
      { skill: "Azure", have: false },
      { skill: "CI/CD Pipelines", have: false },
    ],
    whyMatch: [
      "Django and PostgreSQL experience directly matches their stack",
      "REST API design projects in portfolio",
      "Python proficiency well above their baseline requirement",
    ],
    skillGaps: ["Azure platform services", "CI/CD pipeline setup"],
  },
  {
    id: "4",
    title: "AI Research Intern",
    company: "OpenAI",
    location: "Remote",
    type: "Internship",
    salary: "$9,000/mo",
    deadline: "Jun 10, 2026",
    posted: "2d ago",
    fitScore: 88,
    fitBreakdown: { skills: 94, experience: 80, location: 86, education: 82 },
    saved: true,
    skills: ["ML", "Research", "Python"],
    companyInitial: "O",
    companyColor: "#1d4ed8",
    link: "https://example.com/jobs/openai-research-intern",
    description:
      "Work alongside world-class researchers on frontier AI systems. You'll run experiments, analyze results, and contribute to published research in areas like RLHF, alignment, and capabilities.",
    requirements: [
      "Pursuing PhD or exceptional MS in ML or AI",
      "Strong publication record or equivalent research experience",
      "Deep expertise in transformer architectures",
      "Excellent Python and ML framework skills",
    ],
    requiredSkills: [
      { skill: "Python", have: true },
      { skill: "PyTorch", have: true },
      { skill: "Transformer Models", have: true },
      { skill: "Research Methodology", have: true },
      { skill: "RLHF / Alignment", have: false },
      { skill: "Published Papers", have: false },
    ],
    whyMatch: [
      "Strong transformer and PyTorch knowledge",
      "ML research methodology coursework",
      "Personal project on fine-tuning LLMs directly relevant",
      "Top match across all open intern roles in AI category",
    ],
    skillGaps: ["RLHF fine-tuning in production", "Peer-reviewed publication experience"],
  },
  {
    id: "5",
    title: "Full Stack Developer",
    company: "Stripe",
    location: "Singapore",
    type: "Full-time",
    salary: "$120k–$160k",
    deadline: "Jul 15, 2026",
    posted: "3d ago",
    fitScore: 72,
    fitBreakdown: { skills: 74, experience: 68, location: 70, education: 76 },
    saved: false,
    skills: ["React", "Node.js", "TypeScript"],
    companyInitial: "S",
    companyColor: "#1d4ed8",
    link: "https://example.com/jobs/stripe-full-stack",
    description:
      "Build the financial infrastructure that powers internet commerce. You'll work on Stripe's dashboard, APIs, and developer tools used by millions of businesses worldwide.",
    requirements: [
      "3+ years full-stack experience",
      "Strong TypeScript and React skills",
      "Backend experience with Node.js",
      "Understanding of payments and financial systems",
    ],
    requiredSkills: [
      { skill: "React / TypeScript", have: true },
      { skill: "Node.js", have: true },
      { skill: "REST / GraphQL APIs", have: true },
      { skill: "Payments / Fintech", have: false },
      { skill: "Ruby on Rails", have: false },
      { skill: "Security best practices", have: false },
    ],
    whyMatch: [
      "React and TypeScript skills match their frontend stack",
      "Node.js backend experience relevant",
      "Full-stack projects in portfolio demonstrate breadth",
    ],
    skillGaps: ["Payments and fintech domain knowledge", "Ruby on Rails", "Security / PCI compliance"],
  },
];
