import { useEffect, useState } from "react";
import { getSites } from "../api/sites.js";
import {
  getInspections,
  createInspection,
  resolveViolation,
} from "../api/inspections.js";
import { DEFAULT_CHECKLIST } from "./inspectionChecklistTemplate.js";
import StatusBadge from "../components/StatusBadge.jsx";
import "./DataPages.css";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyChecklist() {
  return DEFAULT_CHECKLIST.map((label) => ({ label, status: "pass", notes: "" }));
}

const SEVERITIES = ["low", "medium", "high"];

export default function Inspections() {
  const [inspections, setInspections] = useState([]);
  const [sites, setSites] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    site: "",
    weekOf: todayIso(),
    checklist: emptyChecklist(),
    violations: [],
  });
  const [newViolation, setNewViolation] = useState({ description: "", severity: "medium" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [detailInspection, setDetailInspection] = useState(null);

  useEffect(() => {
    getSites().then(setSites).catch(() => {});
    loadInspections();
  }, []);

  useEffect(() => {
    loadInspections();
  }, [statusFilter]);

  async function loadInspections() {
    setLoading(true);
    try {
      const data = await getInspections(statusFilter ? { status: statusFilter } : {});
      setInspections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setForm({
      site: sites[0]?._id || "",
      weekOf: todayIso(),
      checklist: emptyChecklist(),
      violations: [],
    });
    setNewViolation({ description: "", severity: "medium" });
    setError(null);
    setModalOpen(true);
  }

  function setChecklistStatus(index, status) {
    setForm((f) => {
      const checklist = [...f.checklist];
      checklist[index] = { ...checklist[index], status };
      return { ...f, checklist };
    });
  }

  function addViolation() {
    if (!newViolation.description.trim()) return;
    setForm((f) => ({
      ...f,
      violations: [...f.violations, { ...newViolation, status: "open" }],
    }));
    setNewViolation({ description: "", severity: "medium" });
  }

  function removeViolation(index) {
    setForm((f) => ({
      ...f,
      violations: f.violations.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.site) {
      setError("Select a site.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createInspection(form);
      setModalOpen(false);
      await loadInspections();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong submitting the inspection.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(inspectionId, violationId) {
    try {
      const updated = await resolveViolation(inspectionId, violationId);
      setDetailInspection(updated);
      setInspections((list) =>
        list.map((i) => (i._id === updated._id ? updated : i))
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header__text">
          <p className="tag-chip">Inspections</p>
          <h1>Weekly Inspections</h1>
          <p>Submit checklist-based inspections and track violations to resolution.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "9px 11px",
              borderRadius: 6,
              border: "1px solid var(--color-border)",
              fontSize: "0.85rem",
              background: "var(--color-surface)",
            }}
          >
            <option value="">All statuses</option>
            <option value="compliant">Compliant</option>
            <option value="non-compliant">Non-compliant</option>
          </select>
          <button className="btn btn-primary" onClick={openCreateModal}>
            + New inspection
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--color-ink-soft)" }}>Loading inspections...</p>
      ) : inspections.length === 0 ? (
        <div className="empty-state">
          No inspections logged yet. Submit your first weekly inspection to
          start building a compliance record.
        </div>
      ) : (
        inspections.map((insp) => (
          <div
            className="card-row"
            key={insp._id}
            onClick={() => setDetailInspection(insp)}
          >
            <div className="card-row__top">
              <div>
                <strong>{insp.site?.name}</strong>
                <div className="card-row__meta">
                  Week of {new Date(insp.weekOf).toLocaleDateString()} &middot; submitted by{" "}
                  {insp.submittedBy?.name}
                </div>
              </div>
              <StatusBadge status={insp.overallStatus} />
            </div>
          </div>
        ))
      )}

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New inspection</h2>

            {error && <div className="form-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="insp-site">Site</label>
                <select
                  id="insp-site"
                  value={form.site}
                  onChange={(e) => setForm({ ...form, site: e.target.value })}
                  required
                >
                  <option value="" disabled>
                    Select a site
                  </option>
                  {sites.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="insp-week">Week of</label>
                <input
                  id="insp-week"
                  type="date"
                  value={form.weekOf}
                  onChange={(e) => setForm({ ...form, weekOf: e.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label>Checklist</label>
                <div>
                  {form.checklist.map((item, i) => (
                    <div className="checklist-item-row" key={item.label}>
                      <span className="checklist-item-row__label">{item.label}</span>
                      <div className="pass-fail-toggle">
                        <button
                          type="button"
                          className={item.status === "pass" ? "selected-pass" : ""}
                          onClick={() => setChecklistStatus(i, "pass")}
                        >
                          Pass
                        </button>
                        <button
                          type="button"
                          className={item.status === "fail" ? "selected-fail" : ""}
                          onClick={() => setChecklistStatus(i, "fail")}
                        >
                          Fail
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label>Violations</label>
                {form.violations.map((v, i) => (
                  <div className="violation-row" key={i}>
                    <div>
                      <div className="violation-row__text">{v.description}</div>
                      <div className="violation-row__severity">{v.severity}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                      onClick={() => removeViolation(i)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="add-violation-row">
                  <input
                    placeholder="Describe a violation..."
                    value={newViolation.description}
                    onChange={(e) =>
                      setNewViolation({ ...newViolation, description: e.target.value })
                    }
                  />
                  <select
                    value={newViolation.severity}
                    onChange={(e) =>
                      setNewViolation({ ...newViolation, severity: e.target.value })
                    }
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-ghost" onClick={addViolation}>
                    Add
                  </button>
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
                  {saving ? "Submitting..." : "Submit inspection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailInspection && (
        <div className="modal-backdrop" onClick={() => setDetailInspection(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <h2>{detailInspection.site?.name}</h2>
              <StatusBadge status={detailInspection.overallStatus} />
            </div>
            <p className="card-row__meta" style={{ marginBottom: 18 }}>
              Week of {new Date(detailInspection.weekOf).toLocaleDateString()} &middot;
              submitted by {detailInspection.submittedBy?.name}
            </p>

            <h3 style={{ fontSize: "0.95rem", marginBottom: 8 }}>Checklist</h3>
            {detailInspection.checklist.map((item) => (
              <div className="checklist-item-row" key={item.label}>
                <span className="checklist-item-row__label">{item.label}</span>
                <StatusBadge status={item.status === "fail" ? "non-compliant" : "compliant"} />
              </div>
            ))}

            <h3 style={{ fontSize: "0.95rem", margin: "18px 0 8px" }}>Violations</h3>
            {detailInspection.violations.length === 0 ? (
              <p style={{ color: "var(--color-ink-soft)", fontSize: "0.85rem" }}>
                No violations flagged.
              </p>
            ) : (
              detailInspection.violations.map((v) => (
                <div className="violation-row" key={v._id}>
                  <div>
                    <div className="violation-row__text">{v.description}</div>
                    <div className="violation-row__severity">{v.severity}</div>
                  </div>
                  {v.status === "open" ? (
                    <button
                      className="btn btn-primary"
                      style={{ padding: "5px 12px", fontSize: "0.75rem" }}
                      onClick={() => handleResolve(detailInspection._id, v._id)}
                    >
                      Resolve
                    </button>
                  ) : (
                    <StatusBadge status="resolved" />
                  )}
                </div>
              ))
            )}

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDetailInspection(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
