import api from "./client.js";

export async function getInspections(params = {}) {
  const { data } = await api.get("/inspections", { params });
  return data.inspections;
}

export async function createInspection(payload) {
  const { data } = await api.post("/inspections", payload);
  return data.inspection;
}

export async function resolveViolation(inspectionId, violationId) {
  const { data } = await api.patch(
    `/inspections/${inspectionId}/violations/${violationId}/resolve`
  );
  return data.inspection;
}
