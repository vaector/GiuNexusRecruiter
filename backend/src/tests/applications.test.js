jest.mock("../services/hfService", () => ({
  zeroShotClassification: jest.fn().mockResolvedValue([
    {
      sequence: "test",
      labels: ["Backend", "Frontend", "AI/ML", "DevOps", "Data Engineering", "Other"],
      scores: [0.9, 0.05, 0.02, 0.01, 0.01, 0.01],
    },
  ]),
  featureExtraction: jest.fn().mockResolvedValue([[1, 0], [0.9, 0.1]]),
  tokenClassification: jest.fn().mockResolvedValue([]),
}));

const request = require("supertest");
const app = require("./app");
const User = require("../features/user/User");

const AUTH = "/api/v1/auth";
const JOBS = "/api/v1/jobs";

const validJob = {
  title: "Backend Intern",
  company: "TechCo",
  description: "Build REST APIs for our platform.",
  requirements: ["Node.js", "Express"],
  location: "Cairo",
  type: "internship",
};

async function setupActors() {
  // Create an approved recruiter and a job
  await request(app)
    .post(`${AUTH}/register`)
    .send({ name: "TechCo Recruiter", email: "recruiter@techco.com", password: "pass123", role: "recruiter" });
  await User.findOneAndUpdate({ email: "recruiter@techco.com" }, { status: "approved" });
  const recLogin = await request(app)
    .post(`${AUTH}/login`)
    .send({ email: "recruiter@techco.com", password: "pass123" });
  const recruiterToken = recLogin.body.token;

  const jobRes = await request(app)
    .post(JOBS)
    .set("Authorization", `Bearer ${recruiterToken}`)
    .send(validJob);
  const jobId = jobRes.body.job._id;

  // Create a job seeker
  const jsRes = await request(app)
    .post(`${AUTH}/register`)
    .send({ name: "Sara Ahmed", email: "sara@example.com", password: "secret123", role: "jobSeeker" });
  const seekerToken = jsRes.body.token;

  return { seekerToken, recruiterToken, jobId };
}

describe("POST /api/v1/jobs/:jobId/apply", () => {
  it("returns 201 when a job seeker applies for the first time", async () => {
    const { seekerToken, jobId } = await setupActors();

    const res = await request(app)
      .post(`${JOBS}/${jobId}/apply`)
      .set("Authorization", `Bearer ${seekerToken}`)
      .send({ coverLetter: "I am a great fit for this role." });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.application._id).toBeDefined();
    expect(res.body.application.status).toBe("pending");
    expect(res.body.application.job).toBe(jobId);
  });

  it("returns 400 when the same job seeker applies twice to the same job", async () => {
    const { seekerToken, jobId } = await setupActors();

    await request(app)
      .post(`${JOBS}/${jobId}/apply`)
      .set("Authorization", `Bearer ${seekerToken}`)
      .send({ coverLetter: "First application." });

    const res = await request(app)
      .post(`${JOBS}/${jobId}/apply`)
      .set("Authorization", `Bearer ${seekerToken}`)
      .send({ coverLetter: "Second application attempt." });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already applied/i);
  });

  it("returns 404 when the job does not exist", async () => {
    const jsRes = await request(app)
      .post(`${AUTH}/register`)
      .send({ name: "Another Seeker", email: "seeker2@example.com", password: "pass123", role: "jobSeeker" });

    const res = await request(app)
      .post(`${JOBS}/000000000000000000000001/apply`)
      .set("Authorization", `Bearer ${jsRes.body.token}`)
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns 403 when a recruiter tries to apply", async () => {
    const { recruiterToken, jobId } = await setupActors();

    const res = await request(app)
      .post(`${JOBS}/${jobId}/apply`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({});

    expect(res.status).toBe(403);
  });
});

describe("GET /api/v1/applications/my", () => {
  it("returns the job seeker's submitted applications with job details", async () => {
    const { seekerToken, jobId } = await setupActors();

    await request(app)
      .post(`${JOBS}/${jobId}/apply`)
      .set("Authorization", `Bearer ${seekerToken}`)
      .send({});

    const res = await request(app)
      .get("/api/v1/applications/my")
      .set("Authorization", `Bearer ${seekerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.applications.length).toBe(1);
    expect(res.body.applications[0].job.title).toBe(validJob.title);
  });
});
