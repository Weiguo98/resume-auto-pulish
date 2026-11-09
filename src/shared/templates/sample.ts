import type { Resume } from "../site.ts";

export const SAMPLE: Resume = {
  basics: {
    name: "Alex Morgan",
    label: "Product Designer",
    email: "alex@example.com",
    url: "https://example.com",
    location: { city: "London", countryCode: "UK" },
    summary: "I design simple tools for complex work. Six years in fintech and health, from first sketch to shipped product.",
    profiles: [
      { network: "LinkedIn", url: "https://www.linkedin.com/" },
      { network: "Dribbble", url: "https://dribbble.com/" },
    ],
  },
  work: [
    {
      name: "Brightpay",
      position: "Senior Product Designer",
      startDate: "2022-03",
      summary: "Lead designer for the business banking app.",
      highlights: ["Redesigned onboarding, cut drop-off by 30%", "Built the design system used by 4 teams"],
    },
    {
      name: "Wellnote",
      position: "Product Designer",
      startDate: "2019-06",
      endDate: "2022-02",
      highlights: ["Designed the patient booking flow", "Ran weekly user interviews"],
    },
  ],
  projects: [
    { name: "Calm Budget", description: "A budgeting app for people who hate budgets.", keywords: ["Mobile", "Research"] },
    { name: "Open Icons", description: "A free icon set used by 2,000 designers.", keywords: ["Open source", "Illustration"] },
    { name: "Clinic Kiosk", description: "Self check-in for busy clinics.", keywords: ["Service design"] },
  ],
  education: [{ institution: "University of the Arts London", studyType: "BA", area: "Graphic Design", endDate: "2017" }],
  skills: [
    { name: "Design", keywords: ["Figma", "Prototyping", "Design systems"] },
    { name: "Research", keywords: ["Interviews", "Usability testing"] },
  ],
};
