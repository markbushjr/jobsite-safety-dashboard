import request from "supertest";
import { createApp } from "../app.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./testDb.js";
import Inspection from "../models/Inspection.js";
import Site from "../models/Site.js";
import User from "../models/User.js";

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

describe("Inspection model: overallStatus computation", () => {
  it("is compliant when every checklist item passes and there are no violations", async () => {
    const user = await User.create({
      name: "Model Test",
      email: "model-test@example.com",
      password: "hashed",
    });
    const site = await Site.create({ name: "Model Test Site" });

    const inspection = await Inspection.create({
      site: site._id,
      submittedBy: user._id,
      weekOf: new Date(),
      checklist: [{ label: "PPE worn on site", status: "pass" }],
      violations: [],
    });

    expect(inspection.overallStatus).toBe("compliant");
  });

  it("is non-compliant when a checklist item fails", async () => {
    const user = await User.create({
      name: "Model Test 2",
      email: "model-test-2@example.com",
      password: "hashed",
    });
    const site = await Site.create({ name: "Model Test Site 2" });

    const inspection = await Inspection.create({
      site: site._id,
      submittedBy: user._id,
      weekOf: new Date(),
      checklist: [{ label: "Fall protection in use", status: "fail" }],
      violations: [],
    });

    expect(inspection.overallStatus).toBe("non-compliant");
  });

  it("is non-compliant while a violation is open, and flips to compliant once resolved", async () => {
    const user = await User.create({
      name: "Model Test 3",
      email: "model-test-3@example.com",
      password: "hashed",
    });
    const site = await Site.create({ name: "Model Test Site 3" });

    const inspection = await Inspection.create({
      site: site._id,
      submittedBy: user._id,
      weekOf: new Date(),
      checklist: [{ label: "Housekeeping clear", status: "pass" }],
      violations: [{ description: "Debris on stairwell", severity: "medium", status: "open" }],
    });

    expect(inspection.overallStatus).toBe("non-compliant");

    inspection.violations[0].status = "resolved";
    await inspection.save();

    expect(inspection.overallStatus).toBe("compliant");
  });
});

describe("POST /api/inspections", () => {
  it("blocks a supervisor from submitting for a site they aren't assigned to", async () => {
    const { token: adminToken } = await registerAndLogin({
      email: "admin@example.com",
      role: "admin",
    });
    const { token: supToken } = await registerAndLogin({
      email: "sup@example.com",
      role: "supervisor",
    });

    const siteRes = await request(app)
      .post("/api/sites")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Unassigned Site" }); // no supervisors attached

    const res = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${supToken}`)
      .send({
        site: siteRes.body.site._id,
        weekOf: new Date().toISOString(),
        checklist: [],
        violations: [],
      });

    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/inspections/:id/violations/:violationId/resolve", () => {
  it("marks a violation resolved and updates overallStatus via the API", async () => {
    const { token: adminToken, user: admin } = await registerAndLogin({
      email: "admin2@example.com",
      role: "admin",
    });

    const siteRes = await request(app)
      .post("/api/sites")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Resolve Test Site", supervisors: [admin.id] });

    const inspectionRes = await request(app)
      .post("/api/inspections")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        site: siteRes.body.site._id,
        weekOf: new Date().toISOString(),
        checklist: [],
        violations: [{ description: "Test violation", severity: "low" }],
      });

    expect(inspectionRes.body.inspection.overallStatus).toBe("non-compliant");
    const violationId = inspectionRes.body.inspection.violations[0]._id;

    const resolveRes = await request(app)
      .patch(
        `/api/inspections/${inspectionRes.body.inspection._id}/violations/${violationId}/resolve`
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.inspection.overallStatus).toBe("compliant");
    expect(resolveRes.body.inspection.violations[0].status).toBe("resolved");
  });
});
