export const siteConfig = {
  name: "BBIT E-Learning",
  shortName: "BBIT",
  fullName: "Budge Budge Institute of Technology",
  tagline: "Your Learning, Elevated",
  description:
    "Access curated learning resources from Budge Budge Institute of Technology. Browse, preview, and download study materials organized by department and semester.",
  url: "https://bbit-elearning.vercel.app", // Change this to your actual production URL
  keywords: [
    "BBIT",
    "Budge Budge Institute of Technology",
    "BBIT E-Learning",
    "BBIT study materials",
    "BBIT notes",
    "engineering notes",
    "B.Tech",
    "diploma",
    "Kolkata",
    "college",
    "pedagogical initiative",
  ],
  links: {
    twitter: "https://twitter.com",
    github: "https://github.com",
  },
  lmsUrl: "https://bbitlab.netlify.app/",
  driveAppsScriptUrl: process.env.APPS_SCRIPT_URL || "",
  driveFolderId: "12m989O-EbtuuuRoAdc5bnwld19iaSVbo",
  cacheTTL: 5 * 60 * 1000, // 5 minutes in ms
};
