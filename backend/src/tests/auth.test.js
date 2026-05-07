const request = require("supertest");
const app = require("./app");

const BASE = "/api/v1/auth";

const johnSeeker = {
  name: "John Seeker",
  email: "john.seeker@example.com",
  password: "password123",
  role: "jobSeeker",
};

describe("POST /api/v1/auth/register", () => {
  it("returns 201 with a signed JWT when all fields are valid", async () => {
    const res = await request(app).post(`${BASE}/register`).send(johnSeeker);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe(johnSeeker.email);
    expect(res.body.user.role).toBe("jobSeeker");
    expect(res.body.user.status).toBe("approved");
    expect(res.body.user.password).toBeUndefined();
  });

  it("returns pending status for a recruiter registration", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ name: "Rec Ruiter", email: "rec@corp.com", password: "pass123", role: "recruiter" });

    expect(res.status).toBe(201);
    expect(res.body.user.status).toBe("pending");
  });

  it("returns 400 when the email is already in use", async () => {
    await request(app).post(`${BASE}/register`).send(johnSeeker);

    const res = await request(app).post(`${BASE}/register`).send({
      name: "Duplicate User",
      email: johnSeeker.email,
      password: "different123",
      role: "jobSeeker",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when a required field is missing", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: "no-name@example.com", password: "pass123", role: "jobSeeker" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when password is fewer than 6 characters", async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ name: "Short Pass", email: "short@example.com", password: "abc", role: "jobSeeker" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(johnSeeker);
  });

  it("returns 200 with a JWT for valid credentials", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: johnSeeker.email, password: johnSeeker.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe(johnSeeker.email);
  });

  it("returns 401 for a wrong password", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: johnSeeker.email, password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it("returns 401 for an email that does not exist", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: "nobody@example.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
