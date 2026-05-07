// tokenClassification is called inside extractSkills.
jest.mock("../services/hfService", () => ({
  tokenClassification: jest.fn().mockResolvedValue([
    { word: "React", entity_group: "MISC", score: 0.99, start: 0, end: 5 },
    { word: "Node.js", entity_group: "ORG", score: 0.98, start: 7, end: 14 },
    { word: "MongoDB", entity_group: "ORG", score: 0.95, start: 16, end: 23 },
  ]),
  zeroShotClassification: jest.fn().mockResolvedValue([
    { labels: ["Backend"], scores: [0.9] },
  ]),
  featureExtraction: jest.fn().mockResolvedValue([[1, 0], [0.9, 0.1]]),
}));

const request = require("supertest");
const app = require("./app");

const AUTH = "/api/v1/auth";
const PROFILE = "/api/v1/profile";

async function registerSeeker(email = "seeker@example.com", password = "pass123") {
  const res = await request(app)
    .post(`${AUTH}/register`)
    .send({ name: "Sara Seeker", email, password, role: "jobSeeker" });
  return res.body.token;
}

describe("POST /api/v1/profile/extract-skills", () => {
  it("extracts skills from bio, saves them to the profile, and returns them in the response", async () => {
    const token = await registerSeeker();

    // First set a bio on the profile
    await request(app)
      .patch(PROFILE)
      .set("Authorization", `Bearer ${token}`)
      .send({ bio: "I have experience with React, Node.js, and MongoDB." });

    const res = await request(app)
      .post(`${PROFILE}/extract-skills`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.skills)).toBe(true);
    expect(res.body.skills.length).toBeGreaterThan(0);
    expect(res.body.extracted).toBeDefined();

    // The mocked NER returns React (MISC), Node.js (ORG), MongoDB (ORG)
    expect(res.body.skills).toContain("React");
  });

  it("returns 400 when the bio is empty", async () => {
    const token = await registerSeeker("empty-bio@example.com");

    const res = await request(app)
      .post(`${PROFILE}/extract-skills`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/bio is empty/i);
  });

  it("returns 403 when a recruiter tries to extract skills", async () => {
    const regRes = await request(app)
      .post(`${AUTH}/register`)
      .send({ name: "A Recruiter", email: "arec@corp.com", password: "pass123", role: "recruiter" });

    const res = await request(app)
      .post(`${PROFILE}/extract-skills`)
      .set("Authorization", `Bearer ${regRes.body.token}`);

    expect(res.status).toBe(403);
  });
});

describe("GET /api/v1/profile", () => {
  it("returns the authenticated user's profile", async () => {
    const token = await registerSeeker("profile-check@example.com");

    const res = await request(app)
      .get(PROFILE)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe("profile-check@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get(PROFILE);
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/v1/profile", () => {
  it("updates name and bio on the authenticated user's profile", async () => {
    const token = await registerSeeker("patch-profile@example.com");

    const res = await request(app)
      .patch(PROFILE)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name", bio: "New bio text." });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe("Updated Name");
    expect(res.body.user.bio).toBe("New bio text.");
  });
});
