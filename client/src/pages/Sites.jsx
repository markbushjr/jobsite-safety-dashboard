import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getSites, createSite, updateSite } from "../api/sites.js";
import { getUsers } from "../api/users.js";
import StatusBadge from "../components/StatusBadge.jsx";
import "./DataPages.css";

const emptyForm = { name: "", address: "", supervisors: [] };

export default function Sites() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [sites, setSites] = useState([]);
  const [supervisorOptions, setSupervisorOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSites();
    if (isAdmin) {
      getUsers("supervisor").then(setSupervisorOptions).catch(() => {});
    }
  }, []);

  async function loadSites() {
    setLoading(true);
    try {
      const data = await getSites();
      setSites(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingSite(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(site) {
    setEditingSite(site);
    setForm({
      name: site.name,
      address: site.address || "",
      supervisors: site.supervisors.map((s) => s._id),
    });
    setError(null);
    setModalOpen(true);
  }

  function toggleSupervisor(id) {
    setForm((f) => {
      const has = f.supervisors.includes(id);
      return {
        ...f,
        supervisors: has
          ? f.supervisors.filter((s) => s !== id)
          : [...f.supervisors, id],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Site name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingSite) {
        await updateSite(editingSite._id, form);
      } else {
        await createSite(form);
      }
      setModalOpen(false);
      await loadSites();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong saving the site.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header__text">
          <p className="tag-chip">Sites</p>
          <h1>Jobsites</h1>
          <p>
            {isAdmin
              ? "Manage active jobsites and assign supervisors responsible for weekly inspections."
              : "Jobsites you're assigned to inspect."}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + New site
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: "var(--color-ink-soft)" }}>Loading sites...</p>
      ) : sites.length === 0 ? (
        <div className="empty-state">
          {isAdmin
            ? "No sites yet. Create your first jobsite to start tracking inspections."
            : "You're not currently assigned to any sites."}
        </div>
      ) : (
        <div className="card-grid">
          {sites.map((site) => (
            <div
              className="card"
              key={site._id}
              style={{ cursor: isAdmin ? "pointer" : "default" }}
              onClick={() => isAdmin && openEditModal(site)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <h3 style={{ fontSize: "1.05rem" }}>{site.name}</h3>
                <StatusBadge status={site.status} />
              </div>
              {site.address && (
                <p style={{ color: "var(--color-ink-soft)", fontSize: "0.85rem", marginTop: 6 }}>
                  {site.address}
                </p>
              )}
              <p className="card-row__meta" style={{ marginTop: 12 }}>
                {site.supervisors.length === 0
                  ? "No supervisor assigned"
                  : site.supervisors.map((s) => s.name).join(", ")}
              </p>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSite ? "Edit site" : "New site"}</h2>

            {error && <div className="form-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="site-name">Site name</label>
                <input
                  id="site-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Riverside Commons - Bldg C"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="site-address">Address</label>
                <input
                  id="site-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. 412 Riverside Dr, Atlanta, GA"
                />
              </div>
              <div className="form-field">
                <label>Assigned supervisors</label>
                <div className="checkbox-list">
                  {supervisorOptions.length === 0 ? (
                    <span style={{ color: "var(--color-ink-soft)", fontSize: "0.85rem" }}>
                      No supervisor accounts yet.
                    </span>
                  ) : (
                    supervisorOptions.map((s) => (
                      <label key={s._id}>
                        <input
                          type="checkbox"
                          checked={form.supervisors.includes(s._id)}
                          onChange={() => toggleSupervisor(s._id)}
                        />
                        {s.name} ({s.email})
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingSite ? "Save changes" : "Create site"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
