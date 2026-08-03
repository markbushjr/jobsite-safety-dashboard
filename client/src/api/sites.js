import api from "./client.js";

export async function getSites() {
  const { data } = await api.get("/sites");
  return data.sites;
}

export async function createSite(payload) {
  const { data } = await api.post("/sites", payload);
  return data.site;
}

export async function updateSite(id, payload) {
  const { data } = await api.patch(`/sites/${id}`, payload);
  return data.site;
}
