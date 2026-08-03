import api from "./client.js";

export async function getUsers(role) {
  const { data } = await api.get("/users", { params: role ? { role } : {} });
  return data.users;
}
