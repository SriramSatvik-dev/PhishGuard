import { X } from "lucide-react";

const COLORS = {
  phishing   : { bg: "#2d1515", border: "#ef4444", text: "#f87171" },
  suspicious : { bg: "#2d1f0f", border: "#f97316", text: "#fb923c" },
  legitimate : { bg: "#0f2d1a", border: "#22c55e", text: "#4ade80" }
};

export default function ScanModal({ scan, onClose }) {
  if (!scan) return null;

  const c = COLORS[scan.verdict] || COLORS.legitimate;

  return (
    <div
      onClick={onClose}
      style={{
        position       : "fixed",
        inset          : 0,
        background     : "rgba(0,0,0,0.7)",
        zIndex         : 1000,
        display        : "flex",
        alignItems     : "center",
        justifyContent : "center",
        padding        : "20px"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background   : "#0f1117",
          border       : `1px solid ${c.border}`,
          borderRadius : "16px",
          padding      : "28px",
          width        : "100%",
          maxWidth     : "560px",
          maxHeight    : "80vh",
          overflowY    : "auto"
        }}
      >
        {/* Header */}
        <div style={{
          display        : "flex",
          justifyContent : "space-between",
          alignItems     : "flex-start",
          marginBottom   : "20px"
        }}>
          <div>
            <div style={{
              fontSize     : "11px",
              color        : "#6b7280",
              marginBottom : "4px",
              textTransform: "uppercase",
              letterSpacing: "0.8px"
            }}>
              Full Scan Report
            </div>
            <div style={{
              fontSize   : "20px",
              fontWeight : "700",
              color      : c.text
            }}>
              {scan.verdict.toUpperCase()} — {scan.risk_score}/100
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background : "transparent",
              border     : "none",
              color      : "#6b7280",
              cursor     : "pointer"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* URL */}
        <div style={{
          background   : "#1a1d2e",
          border       : "1px solid #1e2130",
          borderRadius : "8px",
          padding      : "10px 14px",
          fontSize     : "12px",
          color        : "#9ca3af",
          wordBreak    : "break-all",
          marginBottom : "20px"
        }}>
          {scan.url}
        </div>

        {/* Flags */}
        {scan.flags?.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{
              fontSize     : "11px",
              color        : "#6b7280",
              marginBottom : "10px",
              textTransform: "uppercase",
              letterSpacing: "0.8px"
            }}>
              Risk Signals
            </div>
            {scan.flags.map((flag, i) => (
              <div key={i} style={{
                display      : "flex",
                alignItems   : "flex-start",
                gap          : "10px",
                marginBottom : "8px",
                fontSize     : "13px",
                color        : "#d1d5db"
              }}>
                <span style={{
                  width        : "6px",
                  height       : "6px",
                  borderRadius : "50%",
                  background   : c.border,
                  flexShrink   : 0,
                  marginTop    : "5px"
                }}/>
                {flag}
              </div>
            ))}
          </div>
        )}

        {/* Scores breakdown */}
        <div style={{
          background   : "#1a1d2e",
          border       : "1px solid #1e2130",
          borderRadius : "8px",
          padding      : "16px"
        }}>
          <div style={{
            fontSize     : "11px",
            color        : "#6b7280",
            marginBottom : "12px",
            textTransform: "uppercase",
            letterSpacing: "0.8px"
          }}>
            Layer Breakdown
          </div>
          {[
            ["ML Model",          `${scan.ml?.ml_phishing_probability ?? 0}% phishing probability`],
            ["VirusTotal",        `${scan.threat_intel?.vt_malicious ?? 0} engines flagged`],
            ["URLhaus",           scan.threat_intel?.urlhaus_listed ? "Listed as malware" : "Not listed"],
            ["Domain Age",        scan.dns_whois?.domain_age_days != null
                                    ? `${scan.dns_whois.domain_age_days} days old`
                                    : "Unknown"],
            ["Typosquatting",     scan.dns_whois?.is_typosquat ? `Imitates ${scan.dns_whois.typosquat_of}` : "Not detected"],
          ].map(([label, value]) => (
            <div key={label} style={{
              display        : "flex",
              justifyContent : "space-between",
              marginBottom   : "8px",
              fontSize       : "12px"
            }}>
              <span style={{ color: "#6b7280" }}>{label}</span>
              <span style={{ color: "#d1d5db" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Scanned at */}
        <div style={{
          fontSize  : "11px",
          color     : "#4b5563",
          marginTop : "16px",
          textAlign : "right"
        }}>
          Scanned at {new Date(scan.scanned_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}