import type { ResumeContent } from "@/types/resume";

export const MOCK_EXTRACTED_CONTENT: ResumeContent = {
  contact: {
    name: "Jane Doe",
    email: "jane.doe@email.com",
    phone: "+1 (555) 123-4567",
    linkedin: "linkedin.com/in/janedoe",
    location: "San Francisco, CA",
  },
  summary:
    "Full-stack software engineer with 5+ years of experience building scalable web applications. Proficient in React, Node.js, Python, and cloud infrastructure (AWS/GCP). Passionate about clean code, developer tooling, and mentoring junior engineers.",
  experience: [
    {
      company: "TechCorp Inc.",
      title: "Senior Software Engineer",
      dates: "Jan 2022 - Present",
      bullets: [
        "Led migration of monolithic application to microservices architecture, reducing deployment time by 60%",
        "Built real-time notification system using WebSockets serving 50K+ concurrent users",
        "Mentored 4 junior engineers through structured 1:1s and code review sessions",
        "Implemented CI/CD pipeline with GitHub Actions, achieving 95% test coverage",
      ],
    },
    {
      company: "StartupXYZ",
      title: "Software Engineer",
      dates: "Jun 2019 - Dec 2021",
      bullets: [
        "Developed customer-facing dashboard with React and TypeScript, improving user engagement by 35%",
        "Designed and implemented RESTful APIs serving 10M+ requests/day",
        "Optimized PostgreSQL queries, reducing average response time from 800ms to 120ms",
      ],
    },
  ],
  education: [
    {
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      field: "Computer Science",
      dates: "2015 - 2019",
      gpa: "3.8",
    },
  ],
  skills: [
    { category: "Frontend", items: ["TypeScript", "React", "GraphQL"] },
    { category: "Backend", items: ["Node.js", "Python", "PostgreSQL"] },
    { category: "Cloud & DevOps", items: ["AWS", "Docker", "Kubernetes", "CI/CD"] },
  ],
  certifications: [
    {
      name: "AWS Solutions Architect - Associate",
      issuer: "Amazon Web Services",
      date: "2023",
    },
  ],
};
