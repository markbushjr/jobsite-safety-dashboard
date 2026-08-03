export default function Dashboard() {
  return (
    <div>
      <p className="tag-chip">Overview</p>
      <h1 style={{ marginTop: 12, marginBottom: 8 }}>Compliance Dashboard</h1>
      <p style={{ color: "var(--color-ink-soft)" }}>
        Site compliance rates, overdue inspections, and trend charts will
        render here once sites and inspections are connected.
      </p>
    </div>
  );
}
