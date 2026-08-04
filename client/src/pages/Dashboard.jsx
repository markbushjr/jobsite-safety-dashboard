import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDashboardSummary } from "../api/dashboard.js";
import "./Dashboard.css";

function formatWeekLabel(weekKey) {
  const d = new Date(weekKey);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setError("Couldn't load the dashboard right now."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ color: "var(--color-ink-soft)" }}>Loading dashboard...</p>;
  }

  if (error) {
    return <p style={{ color: "var(--color-danger)" }}>{error}</p>;
  }

  const chartData = summary.trend.map((point) => ({
    ...point,
    label: formatWeekLabel(point.week),
  }));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p className="tag-chip">Overview</p>
        <h1 style={{ marginTop: 10 }}>Compliance Dashboard</h1>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card__label">Compliance Rate</div>
          <div
            className={`kpi-card__value ${
              summary.complianceRate >= 80 ? "accent-success" : "accent-warning"
            }`}
          >
            {summary.complianceRate}%
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Total Sites</div>
          <div className="kpi-card__value">{summary.totalSites}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Open Violations</div>
          <div
            className={`kpi-card__value ${
              summary.openViolations > 0 ? "accent-danger" : "accent-success"
            }`}
          >
            {summary.openViolations}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Overdue Sites</div>
          <div
            className={`kpi-card__value ${
              summary.overdueSites.length > 0 ? "accent-danger" : "accent-success"
            }`}
          >
            {summary.overdueSites.length}
          </div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-card">
          <h3>Compliance Rate Trend</h3>
          <p className="chart-card__subtitle">
            Weekly compliance rate across all accessible sites, last 8 weeks
          </p>
          {chartData.length === 0 ? (
            <p style={{ color: "var(--color-ink-soft)", fontSize: "0.85rem" }}>
              Not enough inspection history yet to chart a trend.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "var(--color-ink-soft)" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: "var(--color-ink-soft)" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip formatter={(v) => [`${v}%`, "Compliance"]} />
                <Line
                  type="monotone"
                  dataKey="complianceRate"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Overdue Sites</h3>
          <p className="chart-card__subtitle">
            Sites past their expected inspection window
          </p>
          {summary.overdueSites.length === 0 ? (
            <p style={{ color: "var(--color-success)", fontSize: "0.85rem" }}>
              All sites are up to date.
            </p>
          ) : (
            summary.overdueSites.map((site) => (
              <div className="overdue-row" key={site.id}>
                <span>{site.name}</span>
                <span className="overdue-row__meta">
                  {site.lastInspection
                    ? `Last: ${new Date(site.lastInspection).toLocaleDateString()}`
                    : "No inspections yet"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
