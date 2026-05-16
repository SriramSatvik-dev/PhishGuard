export default function StatsCards({ stats }) {
  const cards = [
    {
      label : "Total Scans",
      value : stats.total_scans ?? 0,
      color : "#3b82f6",
      bg    : "#1a2744"
    },
    {
      label : "Phishing Detected",
      value : stats.by_verdict?.phishing ?? 0,
      color : "#ef4444",
      bg    : "#2d1515"
    },
    {
      label : "Suspicious",
      value : stats.by_verdict?.suspicious ?? 0,
      color : "#f97316",
      bg    : "#2d1f0f"
    },
    {
      label : "Avg Risk Score",
      value : stats.avg_risk_score ?? 0,
      color : "#a855f7",
      bg    : "#21133a"
    }
  ];

  return (
    <div style={{
      display             : "grid",
      gridTemplateColumns : "repeat(auto-fit, minmax(200px, 1fr))",
      gap                 : "16px",
      marginBottom        : "24px"
    }}>
      {cards.map((card) => (
        <div key={card.label} style={{
          background   : card.bg,
          border       : `1px solid ${card.color}33`,
          borderRadius : "12px",
          padding      : "20px 24px",
        }}>
          <div style={{
            fontSize   : "12px",
            color      : "#6b7280",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.8px"
          }}>
            {card.label}
          </div>
          <div style={{
            fontSize   : "32px",
            fontWeight : "700",
            color      : card.color
          }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}