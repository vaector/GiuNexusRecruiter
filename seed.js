require("dotenv").config({ path: "./backend/.env" });
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./backend/src/features/user/User");
const JobPost = require("./backend/src/features/jobPost/jobPost");

async function seed() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGO_URI missing in backend/.env");

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  // ─── Clear all existing data ──────────────────────
  await Promise.all([
    User.deleteMany({}),
    JobPost.deleteMany({}),
    mongoose.connection.collection("applications").deleteMany({}),
  ]);
  console.log("Cleared existing data");

  // ─── Create users ─────────────────────────────────
  // Use insertMany + pre-hashed passwords to bypass the async pre-save hook
  const hash = await bcrypt.hash("Test1234!", 10);
  const now = new Date();

  const [admin, recruiter, student] = await User.insertMany([
    {
      name: "Admin",
      email: "admin@giunexus.com",
      password: hash,
      role: "admin",
      status: "approved",
      mfaEnabled: true,
      mfaMethod: "email_otp",
      createdAt: now,
    },
    {
      name: "Mohamed Ali",
      email: "recruiter@test.com",
      password: hash,
      role: "recruiter",
      status: "approved",
      bio: "Engineering lead at TechCo with 10 years hiring experience.",
      createdAt: now,
    },
    {
      name: "Youssef Hassan",
      email: "student@test.com",
      password: hash,
      role: "jobSeeker",
      status: "approved",
      bio: "Computer Science student at GIU, passionate about backend development and AI systems.",
      skills: ["Node.js", "MongoDB", "React", "Express.js", "Python", "Docker"],
      createdAt: now,
    },
  ]);

  console.log("Users created:");
  console.log("  Admin    → admin@giunexus.com      / Test1234!");
  console.log("  Recruiter→ recruiter@test.com      / Test1234!");
  console.log("  Student  → student@test.com        / Test1234!");

  // ─── Create jobs ──────────────────────────────────
  const deadline = (daysFromNow) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d;
  };

  // insertMany bypasses the pre-save hook (Mongoose 9 dropped next() support).
  // The hook set isRemote and salary.normalizedUSD — we do that manually here.
  const EGP_TO_USD = 0.02;
  const jobs = await JobPost.insertMany([
    {
      title: "Senior Backend Engineer",
      company: "Stellar Labs",
      description:
        "We're building next-generation distributed infrastructure. Join a senior team that ships to production weekly. You'll own the core orchestration engine — a Node.js service scheduling tens of thousands of GPU hours daily.",
      requirements: [
        "5+ years Node.js and TypeScript",
        "MongoDB schema design and aggregation pipelines",
        "Kubernetes and container orchestration",
        "Distributed systems and message queues",
      ],
      location: { city: "Cairo", country: "Egypt" },
      type: "full-time",
      salary: { min: 80000, max: 120000, currency: "EGP", period: "monthly", isPublic: true, normalizedUSD: Math.round(80000 * EGP_TO_USD * 100) / 100 },
      category: "Backend",
      aiCategoryConfidence: 0.94,
      totalSlots: 3,
      status: "open",
      createdBy: recruiter._id,
      applicationDeadline: deadline(45),
      workplaceType: "hybrid",
      isRemote: true,
      perks: ["Health insurance", "Learning budget", "Quarterly bonuses", "Flexible hours"],
      hiringStages: ["pending", "screening", "interview", "offer", "contract_sent", "accepted"],
      requiresCoverLetter: false,
      viewCount: 847,
      createdAt: now,
    },
    {
      title: "Frontend React Developer",
      company: "PixelForge",
      description:
        "Build beautiful, accessible web experiences for our SaaS platform. You'll collaborate closely with designers and ship components used by 50,000+ users.",
      requirements: [
        "3+ years React and modern JavaScript",
        "CSS-in-JS and responsive design",
        "Experience with REST APIs and state management",
        "Eye for UX detail and accessibility",
      ],
      location: { city: "Alexandria", country: "Egypt" },
      type: "full-time",
      salary: { min: 50000, max: 75000, currency: "EGP", period: "monthly", isPublic: true, normalizedUSD: Math.round(50000 * EGP_TO_USD * 100) / 100 },
      category: "Frontend",
      aiCategoryConfidence: 0.91,
      totalSlots: 2,
      status: "open",
      createdBy: recruiter._id,
      applicationDeadline: deadline(30),
      workplaceType: "remote",
      isRemote: true,
      perks: ["Fully remote", "Home office stipend", "Annual retreat"],
      hiringStages: ["pending", "screening", "interview", "offer", "accepted"],
      requiresCoverLetter: true,
      viewCount: 1203,
      createdAt: now,
    },
    {
      title: "ML Engineer Intern",
      company: "NeuralSpark",
      description:
        "Work on production NLP pipelines that process 10M+ documents daily. You will fine-tune language models, build evaluation frameworks, and deploy models using FastAPI.",
      requirements: [
        "Python and PyTorch or TensorFlow",
        "Familiarity with Hugging Face transformers",
        "Basic MLOps and experiment tracking",
        "Final-year or recent graduate",
      ],
      location: { city: "Cairo", country: "Egypt" },
      type: "internship",
      salary: { min: 8000, max: 12000, currency: "EGP", period: "monthly", isPublic: true, normalizedUSD: Math.round(8000 * EGP_TO_USD * 100) / 100 },
      category: "AI/ML",
      aiCategoryConfidence: 0.97,
      totalSlots: 5,
      status: "open",
      createdBy: recruiter._id,
      applicationDeadline: deadline(20),
      workplaceType: "hybrid",
      isRemote: true,
      perks: ["Mentorship program", "Research publication opportunities"],
      hiringStages: ["pending", "screening", "interview", "offer", "accepted"],
      requiresCoverLetter: false,
      viewCount: 2341,
      createdAt: now,
    },
    {
      title: "DevOps & Cloud Engineer",
      company: "CloudNine Systems",
      description:
        "Own our AWS infrastructure, CI/CD pipelines, and SRE practices. You'll reduce deployment time from hours to minutes and maintain 99.9% uptime SLAs.",
      requirements: [
        "AWS or GCP certification preferred",
        "Terraform and infrastructure-as-code",
        "GitHub Actions or Jenkins pipelines",
        "Linux, Docker, Kubernetes",
      ],
      location: { city: "Giza", country: "Egypt" },
      type: "full-time",
      salary: { min: 70000, max: 100000, currency: "EGP", period: "monthly", isPublic: true, normalizedUSD: Math.round(70000 * EGP_TO_USD * 100) / 100 },
      category: "DevOps",
      aiCategoryConfidence: 0.88,
      totalSlots: 1,
      status: "open",
      createdBy: recruiter._id,
      applicationDeadline: deadline(60),
      workplaceType: "on_site",
      isRemote: false,
      perks: ["AWS training budget", "Team lunches", "Gym membership"],
      hiringStages: ["pending", "screening", "interview", "offer", "accepted"],
      requiresCoverLetter: false,
      viewCount: 512,
      createdAt: now,
    },
    {
      title: "Data Engineering Lead",
      company: "DataStream Co.",
      description:
        "Design and scale our real-time data pipelines processing 500GB+ daily from IoT sensors. Lead a team of 3 engineers and partner with data science on ML feature pipelines.",
      requirements: [
        "Apache Spark and Kafka",
        "Python and SQL at expert level",
        "Data warehouse design (Snowflake, BigQuery)",
        "5+ years data engineering experience",
      ],
      location: { city: "Cairo", country: "Egypt" },
      type: "full-time",
      salary: { min: 90000, max: 130000, currency: "EGP", period: "monthly", isPublic: true, normalizedUSD: Math.round(90000 * EGP_TO_USD * 100) / 100 },
      category: "Data Engineering",
      aiCategoryConfidence: 0.93,
      totalSlots: 1,
      status: "open",
      createdBy: recruiter._id,
      applicationDeadline: deadline(7),
      workplaceType: "hybrid",
      isRemote: true,
      perks: ["Stock options", "Conference budget", "Flexible PTO"],
      hiringStages: ["pending", "screening", "interview", "offer", "accepted"],
      requiresCoverLetter: true,
      viewCount: 389,
      createdAt: now,
    },
  ]);

  console.log("\nJobs created:");
  jobs.forEach((j) =>
    console.log(`  [${j.category.padEnd(16)}] ${j.title} @ ${j.company} → _id: ${j._id}`)
  );

  console.log("\n═══════════════════════════════════════");
  console.log("BROWSER CONSOLE SNIPPET — paste this at http://localhost:5173");
  console.log("to log in as the test job seeker WITHOUT a login page:\n");
  console.log(`fetch('http://localhost:5000/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'student@test.com',password:'Test1234!'})}).then(r=>r.json()).then(d=>{if(d.token){localStorage.setItem('token',d.token);localStorage.setItem('user',JSON.stringify(d.user));console.log('✅ Logged in as:',d.user.name,'| role:',d.user.role);window.location.reload();}else{console.log('❌ Failed:',d);}});`);
  console.log("\n═══════════════════════════════════════");
  console.log("TEST URLS (copy one job _id from above and use it below):");
  console.log(`  http://localhost:5173/jobs/${jobs[0]._id}   ← Backend job (hybrid, 45 days left)`);
  console.log(`  http://localhost:5173/jobs/${jobs[1]._id}   ← Frontend job (remote, cover letter required)`);
  console.log(`  http://localhost:5173/jobs/${jobs[2]._id}   ← AI/ML internship (20 days left)`);
  console.log(`  http://localhost:5173/jobs/${jobs[3]._id}   ← DevOps job (on_site, 1 slot)`);
  console.log(`  http://localhost:5173/jobs/${jobs[4]._id}   ← Data Engineering (deadline in 7 days — red!)`);

  await mongoose.disconnect();
  console.log("\nSeeding complete ✅");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
