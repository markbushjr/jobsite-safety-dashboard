import request from "supertest";
import { createApp } from "../app.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./testDb.js";

const app = createApp();

async function registerAndLogin(overrides = {}) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "supervisor",
      ...overrides,
    });
  return { token: res.body.token, user: res.body.user };
}

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("POST /api/sites", () => {
  it("allows an admin to create a site", async () => {
    const { token } = await registerAndLogin({ email: "admin@example.com", role: "admin" });

    const res = await request(app)
      .post("/api/sites")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Site", address: "123 Main St" });

    expect(res.status).toBe(201);
    expect(res.body.site.name).toBe("Test Site");
  });

  it("blocks a supervisor from creating a site", async () => {
    const { token } = await registerAndLogin({ email: "sup@example.com", role: "supervisor" });

    const res = await request(app)
      .post("/api/sites")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Should Not Exist" });

    expect(res.status).toBe(403);
  });

  it("blocks an unauthenticated request", async () => {
    const res = await request(app).post("/api/sites").send({ name: "No Auth Site" });
    expect(res.status).toBe(401);
  });

  it("rejects a site with no name", async () => {
    const { token } = await registerAndLogin({ email: "admin2@example.com", role: "admin" });

    const res = await request(app)
      .post("/api/sites")
      .set("Authorization", `Bearer ${token}`)
      .send({ address: "No name provided" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/sites", () => {
  it("shows an admin every site, but a supervisor only their assigned sites", async () => {
    const { token: adminToken } = await registerAndLogin({
      email: "admin3@example.com",
      role: "admin",
    });
    const { token: supToken, user: supervisor } = await registerAndLogin({
      email: "sup2@example.com",
      role: "supervisor",
    });

    // Admin creates two sites, only assigning the supervisor to one.
    await request(app)
      .post("/api/sites")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Assigned Site", supervisors: [supervisor.id] });

    await request(app)
      .post("/api/sites")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Unassigned Site" });

    const adminView = await request(app)
      .get("/api/sites")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminView.body.sites).toHaveLength(2);

    const supervisorView = await request(app)
      .get("/api/sites")
      .set("Authorization", `Bearer ${supToken}`);
    expect(supervisorView.body.sites).toHaveLength(1);
    expect(supervisorView.body.sites[0].name).toBe("Assigned Site");
  });
});
