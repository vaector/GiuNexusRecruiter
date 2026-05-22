/**
 * seedJobs.js — Wipe and reseed JobPost collection with varied test data
 *
 * Run from repo root:    node seedJobs.js
 *
 * What it does:
 *  - Connects to the same MongoDB the backend uses (reads MONGO_URI from backend/.env)
 *  - Finds an existing recruiter user to attribute the jobs to
 *  - DELETES ALL existing JobPost documents
 *  - Inserts 20 varied jobs across all 6 categories, 3 types, both statuses
 *
 * NOTE: Categories are set manually here because we're bypassing the API
 * (which would normally run AI zero-shot classification). The labels match
 * what the AI would assign based on the descriptions.
 */
require("dotenv").config({ path: "./backend/.env" });
// Must use backend's own mongoose so the models share the same connection instance
const mongoose = require("./backend/node_modules/mongoose");
const JobPost = require("./backend/src/features/jobPost/jobPost");
const User = require("./backend/src/features/user/User");

const SEED_JOBS = [
  // ───── Frontend (4) ─────
  { title: "Frontend Developer", company: "Pixel Studios", description: "Build responsive React user interfaces with modern hooks, context, and CSS-in-JS. Work closely with designers to ship polished web experiences.", requirements: ["React", "TypeScript", "CSS", "HTML"], location: { city: "Cairo", country: "Egypt" }, type: "full-time", status: "open", category: "Frontend", salary: { min: 25000, max: 40000, currency: "EGP" }, workplaceType: "hybrid", totalSlots: 2 },
  { title: "Junior React Developer", company: "Webly", description: "Entry-level role building React components, learning state management, and contributing to a design system.", requirements: ["React", "JavaScript", "Git"], location: { city: "Alexandria", country: "Egypt" }, type: "internship", status: "open", category: "Frontend", salary: { min: 8000, currency: "EGP" }, workplaceType: "on_site" },
  { title: "Senior UI Engineer", company: "DesignForge", description: "Lead frontend architecture for our flagship product. React, Next.js, accessibility, and performance optimization.", requirements: ["React", "Next.js", "Accessibility", "Performance"], location: { city: "Giza", country: "Egypt" }, type: "full-time", status: "closed", category: "Frontend", workplaceType: "remote" },
  { title: "Part-time Vue Developer", company: "Stellar Apps", description: "Maintain and extend a Vue.js dashboard. Flexible hours, remote-friendly.", requirements: ["Vue.js", "JavaScript", "CSS"], location: { city: "Cairo", country: "Egypt" }, type: "part-time", status: "open", category: "Frontend", workplaceType: "remote" },

  // ───── Backend (4) ─────
  { title: "Backend Engineer", company: "ServerCo", description: "Design and build scalable REST APIs with Node.js and Express. Optimize MongoDB queries and ship reliable services.", requirements: ["Node.js", "Express", "MongoDB", "REST APIs"], location: { city: "Cairo", country: "Egypt" }, type: "full-time", status: "open", category: "Backend", salary: { min: 30000, max: 50000, currency: "EGP" }, workplaceType: "hybrid" },
  { title: "Python Backend Intern", company: "PyWorks", description: "Build Python microservices with FastAPI and PostgreSQL. Great for students learning backend fundamentals.", requirements: ["Python", "FastAPI", "PostgreSQL"], location: { city: "Alexandria", country: "Egypt" }, type: "internship", status: "open", category: "Backend", salary: { min: 6000, currency: "EGP" }, workplaceType: "on_site" },
  { title: "Go Backend Developer", company: "GoFast", description: "Write high-performance Go services for our trading platform. gRPC, Kafka, and Redis experience helpful.", requirements: ["Go", "gRPC", "Kafka", "Redis"], location: { city: "Cairo", country: "Egypt" }, type: "full-time", status: "open", category: "Backend", salary: { min: 45000, max: 70000, currency: "EGP" }, workplaceType: "remote" },
  { title: "Java Spring Developer", company: "Enterprise Solutions", description: "Maintain large Java Spring Boot microservices. Banking domain experience a plus.", requirements: ["Java", "Spring Boot", "Maven", "JUnit"], location: { city: "Cairo", country: "Egypt" }, type: "full-time", status: "closed", category: "Backend", workplaceType: "on_site" },

  // ───── AI/ML (3) ─────
  { title: "Machine Learning Engineer", company: "DeepThink AI", description: "Train and deploy deep learning models for computer vision and NLP. PyTorch, Hugging Face Transformers, and MLOps.", requirements: ["Python", "PyTorch", "Transformers", "MLOps"], location: { city: "Cairo", country: "Egypt" }, type: "full-time", status: "open", category: "AI/ML", salary: { min: 50000, max: 90000, currency: "EGP" }, workplaceType: "hybrid" },
  { title: "AI Research Intern", company: "DeepThink AI", description: "Assist research scientists in NLP experiments. Run training jobs, analyze results, contribute to papers.", requirements: ["Python", "PyTorch", "NLP"], location: { city: "Cairo", country: "Egypt" }, type: "internship", status: "open", category: "AI/ML", salary: { min: 12000, currency: "EGP" }, workplaceType: "on_site" },
  { title: "Computer Vision Engineer", company: "VisionLabs", description: "Build CV models for autonomous systems. OpenCV, YOLO, and edge deployment experience.", requirements: ["Python", "OpenCV", "YOLO", "TensorRT"], location: { city: "Giza", country: "Egypt" }, type: "full-time", status: "open", category: "AI/ML", workplaceType: "remote" },

  // ───── DevOps (3) ─────
  { title: "DevOps Engineer", company: "CloudOps Inc", description: "Manage AWS infrastructure, Kubernetes clusters, and CI/CD pipelines. Terraform and observability tooling.", requirements: ["AWS", "Kubernetes", "Terraform", "CI/CD"], location: { city: "Cairo", country: "Egypt" }, type: "full-time", status: "open", category: "DevOps", salary: { min: 40000, max: 65000, currency: "EGP" }, workplaceType: "remote" },
  { title: "Site Reliability Engineer", company: "Uptime Co", description: "Keep our distributed systems running 24/7. On-call rotation, incident response, capacity planning.", requirements: ["Linux", "Prometheus", "Grafana", "Bash"], location: { city: "Cairo", country: "Egypt" }, type: "full-time", status: "open", category: "DevOps", workplaceType: "hybrid" },
  { title: "Junior DevOps Intern", company: "CloudOps Inc", description: "Learn cloud infrastructure hands-on. Help maintain dev environments and write deployment scripts.", requirements: ["Linux", "Docker", "Bash"], location: { city: "Alexandria", country: "Egypt" }, type: "internship", status: "closed", category: "DevOps", workplaceType: "on_site" },

  // ───── Data Engineering (3) ─────
  { title: "Data Engineer", company: "DataPipe Co", description: "Build ETL pipelines and data warehouses. Airflow, Spark, and dbt experience. Snowflake or BigQuery a plus.", requirements: ["Python", "Airflow", "Spark", "SQL"], location: { city: "Cairo", country: "Egypt" }, type: "full-time", status: "open", category: "Data Engineering", salary: { min: 35000, max: 60000, currency: "EGP" }, workplaceType: "hybrid" },
  { title: "Analytics Engineer", company: "InsightWorks", description: "Model business data with dbt. Partner with analysts to define metrics and ship trustworthy dashboards.", requirements: ["SQL", "dbt", "BigQuery", "Python"], location: { city: "Cairo", country: "Egypt" }, type: "full-time", status: "open", category: "Data Engineering", workplaceType: "remote" },
  { title: "Data Engineering Intern", company: "DataPipe Co", description: "Learn data engineering hands-on. Write SQL transformations and help maintain our Airflow DAGs.", requirements: ["SQL", "Python", "Git"], location: { city: "Cairo", country: "Egypt" }, type: "internship", status: "open", category: "Data Engineering", salary: { min: 7000, currency: "EGP" }, workplaceType: "on_site" },

  // ───── Other (3) ─────
  { title: "Technical Product Manager", company: "BuildCo", description: "Define product strategy for our developer tools. Work across engineering, design, and customer success.", requirements: ["Product Management", "Roadmapping", "Stakeholder Management"], location: { city: "Cairo", country: "Egypt" }, type: "full-time", status: "open", category: "Other", salary: { min: 50000, max: 80000, currency: "EGP" }, workplaceType: "hybrid" },
  { title: "QA Engineer", company: "QualityFirst", description: "Test web applications manually and write automated tests with Playwright. Bug triage and regression analysis.", requirements: ["Playwright", "Manual Testing", "Bug Triage"], location: { city: "Alexandria", country: "Egypt" }, type: "part-time", status: "open", category: "Other", workplaceType: "remote" },
  { title: "Technical Writer", company: "DocsHub", description: "Write developer documentation, API references, and tutorials. Markdown, Git, and a strong eye for clarity.", requirements: ["Technical Writing", "Markdown", "Git"], location: { city: "Cairo", country: "Egypt" }, type: "full-time", status: "closed", category: "Other", workplaceType: "remote" },
];

async function seed() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MongoDB connection string missing. Set MONGO_URI in backend/.env");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected.");

  const recruiter = await User.findOne({ role: "recruiter" });
  if (!recruiter) {
    throw new Error("No recruiter user found in DB. Register at least one recruiter first, then re-run this script.");
  }
  console.log(`Using recruiter: ${recruiter.name} (${recruiter.email})`);

  const deleted = await JobPost.deleteMany({});
  console.log(`Deleted ${deleted.deletedCount} existing job(s).`);

  const jobsWithRecruiter = SEED_JOBS.map((j) => ({ ...j, createdBy: recruiter._id }));

  // insertMany bypasses the pre('save') hook (Mongoose 8 compatibility), so
  // we pre-compute isRemote and salary.normalizedUSD here instead.
  const RATES = { USD: 1, EGP: 0.02, EUR: 1.08, GBP: 1.27 };
  const processed = jobsWithRecruiter.map((j) => {
    const doc = { ...j };
    doc.isRemote = doc.workplaceType === "remote" || doc.workplaceType === "hybrid";
    if (doc.salary?.min && doc.salary?.currency) {
      doc.salary = { ...doc.salary, normalizedUSD: Math.round(doc.salary.min * (RATES[doc.salary.currency] || 1) * 100) / 100 };
    }
    return doc;
  });
  const inserted = await JobPost.insertMany(processed, { ordered: true });
  console.log(`Inserted ${inserted.length} job(s).`);

  const byCategory = {};
  inserted.forEach((j) => { byCategory[j.category] = (byCategory[j.category] || 0) + 1; });
  console.log("By category:", byCategory);

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
