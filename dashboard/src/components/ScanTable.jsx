import { useState } from "react";
import { Download, Search } from "lucide-react";

const VERDICT_STYLES = {
  phishing   : { color: "#f87171", bg: "#2d1515", border: "#7f1d1d" },
  suspicious : { color: "#fb923c", bg: "#2d1f0f", border: "#7c3a00" },
  legitimate : { color: "#4ade80", bg: "#0f2d1a", border: "#14532d" }
};

export default function ScanTable({ history, onRowClick }) {
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");

  // Filter and search
  const filtered = history.filter(scan => {
    const matchesFilter  = filter === "all" || scan.verdict === filter;
    const matchesSearch  = scan.url.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // CSV export
  function exportCSV() {
    const headers = ["URL", "Verdict", "Risk Score", "Scanned At"];
    const rows    = filtered.map(s => [
      `"${s.url}"`,
      s.verdict,
      s.risk_score,
      s.scanned_at
    ]);
    const csv  = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href     = URL.createObjectURL(blob);
    link.download = `phishguard_report_${Date.now()}.csv`;
    link.click();
  }

  return (
    <div style={{
      background   : "#1a1d2e",
      border       : "1px solid #1e2130",
      borderRadius : "12px",
      overflow     : "hidden"
    }}>

      {/* Table toolbar */}
      <div style={{
        display        : "flex",
        justifyContent : "space-between",
        alignItems     : "center",
        padding        : "16px 20px",
        borderBottom   : "1px solid #1e2130",
        gap            : "12px",
        flexWrap       : "wrap"
      }}>
        <div style={{ fontSize: "13px", fontWeight: "500", color: "#9ca3af" }}>
          Scan History
          <span style={{ color: "#4b5563", marginLeft: "8px" }}>
            ({filtered.length} results)
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{
              position  : "absolute",
              left      : "10px",
              top       : "50%",
              transform : "translateY(-50%)",
              color     : "#4b5563"
            }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search URLs..."
              style={{
                background   : "#0f1117",
                border       : "1px solid #2e3250",
                borderRadius : "6px",
                padding      : "7px 12px 7px 30px",
                color        : "#fff",
                fontSize     : "12px",
                width        : "200px",
                outline      : "none"
              }}
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              background   : "#0f1117",
              border       : "1px solid #2e3250",
              borderRadius : "6px",
              padding      : "7px 12px",
              color        : "#fff",
              fontSize     : "12px",
              outline      : "none",
              cursor       : "pointer"
            }}
          >
            <option value="all">All verdicts</option>
            <option value="phishing">Phishing</option>
            <option value="suspicious">Suspicious</option>
            <option value="legitimate">Legitimate</option>
          </select>

          {/* Export */}
          <button
            onClick={exportCSV}
            style={{
              display      : "flex",
              alignItems   : "center",
              gap          : "6px",
              background   : "#1e3a5f",
              border       : "1px solid #2563eb",
              borderRadius : "6px",
              padding      : "7px 14px",
              color        : "#3b82f6",
              fontSize     : "12px",
              cursor       : "pointer",
              fontWeight   : "500"
            }}
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width          : "100%",
          borderCollapse : "collapse",
          fontSize       : "13px"
        }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e2130" }}>
              {["URL", "Verdict", "Risk Score", "Scanned At"].map(h => (
                <th key={h} style={{
                  padding   : "12px 20px",
                  textAlign : "left",
                  color     : "#4b5563",
                  fontWeight: "500",
                  fontSize  : "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px"
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{
                  padding   : "40px",
                  textAlign : "center",
                  color     : "#4b5563",
                  fontSize  : "13px"
                }}>
                  No scans found
                </td>
              </tr>
            ) : (
              filtered.map((scan, i) => {
                const vs = VERDICT_STYLES[scan.verdict] || VERDICT_STYLES.legitimate;
                return (
                  <tr
                    key={i}
                    onClick={() => onRowClick(scan)}
                    style={{
                      borderBottom : "1px solid #1a1d2e",
                      cursor       : "pointer",
                      transition   : "background 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#1e2130"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 20px", maxWidth: "320px" }}>
                      <div style={{
                        overflow     : "hidden",
                        textOverflow : "ellipsis",
                        whiteSpace   : "nowrap",
                        color        : "#d1d5db"
                      }}>
                        {scan.url}
                      </div>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{
                        background   : vs.bg,
                        border       : `1px solid ${vs.border}`,
                        color        : vs.color,
                        borderRadius : "4px",
                        padding      : "3px 10px",
                        fontSize     : "11px",
                        fontWeight   : "500"
                      }}>
                        {scan.verdict}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width        : "60px",
                          height       : "4px",
                          background   : "#0f1117",
                          borderRadius : "2px",
                          overflow     : "hidden"
                        }}>
                          <div style={{
                            width      : `${scan.risk_score}%`,
                            height     : "100%",
                            background : vs.color,
                            borderRadius: "2px"
                          }}/>
                        </div>
                        <span style={{ color: vs.color, fontWeight: "500" }}>
                          {scan.risk_score}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 20px", color: "#6b7280", fontSize: "12px" }}>
                      {new Date(scan.scanned_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}