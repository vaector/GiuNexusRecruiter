// Mock the HuggingFace singleton before any module is loaded.
// zeroShotClassification is called inside createJob to auto-assign category.
jest.mock("../services/hfService", () => ({
  zeroShotClassification: jest.fn().mockResolvedValue([
    {
      sequence: "Backend developer internship role",
      labels: ["Backend", "Frontend", "AI/ML", "DevOps", "Data Engineering", "Other"],
      scores: [0.9, 0.05, 0.02, 0.01, 0.01, 0.01],
    },
  ]),
  featureExtraction: jest.fn().mockResolvedValue([[1, 0, 0], [0.9, 0.1, 0]]),
  tokenClassification: jest.fn().mockResolvedValue([]),
  textGeneration: jest.fn().mockResolvedValue({
    generated_text: "Dear TechCo Hiring Team,\n\nI am excited to apply for this role.",
  }),
}));

const request = require("supertest");
const app = require("./app");
const hf = require("../services/hfService");
const User = require("../features/user/User");

const AUTH = "/api/v1/auth";
const JOBS = "/api/v1/jobs";

const validJob = {
  title: "Backend Intern",
  company: "TechCo",
  description: "Build REST APIs with Node.js and Express for our core platform.",
  requirements: ["Node.js", "Express", "MongoDB"],
  location: "Cairo",
  type: "internship",
};

async function registerAndApproveRecruiter(email = "recruiter@techco.com", password = "pass123") {
  await request(app)
    .post(`${AUTH}/register`)
    .send({ name: "TechCo Recruiter", email, password, role: "recruiter" });

  await User.findOneAndUpdate({ email }, { status: "approved" });

  const loginRes = await request(app)
    .post(`${AUTH}/login`)
    .send({ email, password });

  return loginRes.body.token;
}

async function registerPendingRecruiter(email = "pending@corp.com", password = "pass123") {
  const res = await request(app)
    .post(`${AUTH}/register`)
    .send({ name: "Pending Recruiter", email, password, role: "recruiter" });

  return res.body.token;
}

async function registerSeeker(email = "seeker@techco.com", password = "pass123") {
  const res = await request(app)
    .post(`${AUTH}/register`)
    .send({ name: "Sara Seeker", email, password, role: "jobSeeker" });

  return res.body.token;
}

describe("POST /api/v1/jobs", () => {
  it("returns 201 and an AI-assigned category when an approved recruiter creates a job", async () => {
    const token = await registerAndApproveRecruiter();

    const res = await request(app)
      .post(JOBS)
      .set("Authorization", `Bearer ${token}`)
      .send(validJob);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.job._id).toBeDefined();
    expect(typeof res.body.job.category).toBe("string");
    expect(res.body.job.category.length).toBeGreaterThan(0);
    expect(res.body.job.status).toBe("open");
    expect(res.body.job.createdBy).toBeDefined();
  });

  it("returns 403 when a pending recruiter tries to create a job", async () => {
    const token = await registerPendingRecruiter();

    const res = await request(app)
      .post(JOBS)
      .set("Authorization", `Bearer ${token}`)
      .send(validJob);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/pending approval/i);
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app).post(JOBS).send(validJob);

    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    const token = await registerAndApproveRecruiter();

    const res = await request(app)
      .post(JOBS)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Incomplete job" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/v1/jobs", () => {
  it("returns 200 with paginated job list (public)", async () => {
    const token = await registerAndApproveRecruiter();
    await request(app)
      .post(JOBS)
      .set("Authorization", `Bearer ${token}`)
      .send(validJob);

    const res = await request(app).get(JOBS);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });
});

describe("POST /api/v1/jobs/:id/cover-letter-suggestion", () => {
  it("returns a template draft when Hugging Face is unavailable", async () => {
    const recruiterToken = await registerAndApproveRecruiter("cover-rec@techco.com");
    const jobRes = await request(app)
      .post(JOBS)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send(validJob);

    const seekerToken = await registerSeeker("cover-seeker@example.com");
    await User.findOneAndUpdate(
      { email: "cover-seeker@example.com" },
      { bio: "I build backend APIs and enjoy reliable product engineering.", skills: ["Node.js", "MongoDB"] }
    );

    hf.textGeneration.mockRejectedValueOnce(new Error("provider unavailable"));

    const res = await request(app)
      .post(`${JOBS}/${jobRes.body.job._id}/cover-letter-suggestion`)
      .set("Authorization", `Bearer ${seekerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.generatedBy).toBe("template");
    expect(res.body.suggestion).toMatch(/Dear TechCo Hiring Team/);
    expect(res.body.suggestion).toMatch(/Node\.js/);
  });
});
