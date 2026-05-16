import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const VERDICT_COLORS = {
  legitimate : "#22c55e",
  suspicious : "#f97316",
  phishing   : "#ef4444"
};

export default function RiskChart({ stats, history }) {
  // Pie chart data — verdict breakdown
  const pieData = Object.entries(stats.by_verdict || {}).map(
    ([verdict, count]) => ({ name: verdict, value: count })
  );

  // Bar chart data — group scans into risk score buckets
  const buckets = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
  history.forEach(scan => {
    const s = scan.risk_score;
    if      (s <= 20)  buckets["0-20"]++;
    else if (s <= 40)  buckets["21-40"]++;
    else if (s <= 60)  buckets["41-60"]++;
    else if (s <= 80)  buckets["61-80"]++;
    else               buckets["81-100"]++;
  });

  const barData = Object.entries(buckets).map(
    ([range, count]) => ({ range, count })
  );

  const barColors = ["#22c55e", "#84cc16", "#f97316", "#ef4444", "#dc2626"];

  return (
    <div style={{
      display             : "grid",
      gridTemplateColumns : "1fr 1fr",
      gap                 : "16px",
      marginBottom        : "24px"
    }}>

      {/* Verdict pie chart */}
      <div style={{
        background   : "#1a1d2e",
        border       : "1px solid #1e2130",
        borderRadius : "12px",
        padding      : "20px"
      }}>
        <div style={{
          fontSize     : "13px",
          fontWeight   : "500",
          marginBottom : "16px",
          color        : "#9ca3af"
        }}>
          Verdict Distribution
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={VERDICT_COLORS[entry.name] || "#6b7280"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background   : "#1a1d2e",
                border       : "1px solid #2e3250",
                borderRadius : "8px",
                color        : "#fff"
              }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Risk score bar chart */}
      <div style={{
        background   : "#1a1d2e",
        border       : "1px solid #1e2130",
        borderRadius : "12px",
        padding      : "20px"
      }}>
        <div style={{
          fontSize     : "13px",
          fontWeight   : "500",
          marginBottom : "16px",
          color        : "#9ca3af"
        }}>
          Risk Score Distribution
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barCategoryGap="30%">
            <XAxis
              dataKey="range"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background   : "#1a1d2e",
                border       : "1px solid #2e3250",
                borderRadius : "8px",
                color        : "#fff"
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {barData.map((_, i) => (
                <Cell key={i} fill={barColors[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}