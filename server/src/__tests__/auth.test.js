import request from "supertest";
import { createApp } from "../app.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./testDb.js";

const app = createApp();

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("POST /api/auth/register", () => {
  it("creates a new account and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alex Admin",
      email: "alex@example.com",
      password: "password123",
      role: "admin",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("alex@example.com");
    expect(res.body.user.role).toBe("admin");
    // Password should never come back in the response.
    expect(res.body.user.password).toBeUndefined();
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/auth/register").send({
      name: "First User",
      email: "dupe@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Second User",
      email: "dupe@example.com",
      password: "differentpassword",
    });

    expect(res.status).toBe(409);
  });

  it("rejects a missing required field", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "missing-name@example.com",
      password: "password123",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Login Test User",
      email: "login-test@example.com",
      password: "correct-password",
      role: "supervisor",
    });
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login-test@example.com",
      password: "correct-password",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects an incorrect password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login-test@example.com",
      password: "wrong-password",
    });

    expect(res.status).toBe(401);
  });

  it("rejects a nonexistent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "whatever",
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("rejects a request with no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a request with an invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("returns the logged-in user's profile with a valid token", async () => {
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Profile Test User",
      email: "profile-test@example.com",
      password: "password123",
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${registerRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("profile-test@example.com");
  });
});
