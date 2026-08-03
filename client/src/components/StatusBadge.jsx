const STYLES = {
  compliant: { bg: "var(--color-success-soft)", fg: "var(--color-success)", label: "Compliant" },
  "non-compliant": { bg: "var(--color-danger-soft)", fg: "var(--color-danger)", label: "Non-compliant" },
  open: { bg: "var(--color-danger-soft)", fg: "var(--color-danger)", label: "Open" },
  resolved: { bg: "var(--color-success-soft)", fg: "var(--color-success)", label: "Resolved" },
  active: { bg: "var(--color-success-soft)", fg: "var(--color-success)", label: "Active" },
  inactive: { bg: "var(--color-warning-soft)", fg: "var(--color-warning)", label: "Inactive" },
  completed: { bg: "var(--color-border)", fg: "var(--color-ink-soft)", label: "Completed" },
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || {
    bg: "var(--color-border)",
    fg: "var(--color-ink-soft)",
    label: status,
  };

  return (
    <span
      style={{
        background: style.bg,
        color: style.fg,
        fontSize: "0.75rem",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: "999px",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {style.label}
    </span>
  );
}
