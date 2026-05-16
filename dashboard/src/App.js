import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import StatsCards from "./components/StatsCards";
import RiskChart  from "./components/RiskChart";
import ScanTable  from "./components/ScanTable";
import ScanModal  from "./components/ScanModal";

const API = "http://localhost:8000";

export default function App() {
  const [stats,      setStats]      = useState({});
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [lastUpdated,  setLastUpdated]  = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/history?limit=200`)
      ]);
      setStats(statsRes.data);
      setHistory(historyRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 15 seconds
  // so new scans from the extension appear automatically
  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return (
    <div style={{
      display        : "flex",
      alignItems     : "center",
      justifyContent : "center",
      height         : "100vh",
      color          : "#6b7280",
      fontSize       : "14px"
    }}>
      Loading PhishGuard dashboard...
    </div>
  );

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{
        display        : "flex",
        justifyContent : "space-between",
        alignItems     : "center",
        marginBottom   : "28px"
      }}>
        <div>
          <h1 style={{
            fontSize   : "24px",
            fontWeight : "700",
            color      : "#ffffff"
          }}>
            🛡️ PhishGuard
          </h1>
          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
            Security analyst dashboard
          </div>
        </div>
        <div style={{
          display    : "flex",
          alignItems : "center",
          gap        : "12px"
        }}>
          {lastUpdated && (
            <span style={{ fontSize: "11px", color: "#4b5563" }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            style={{
              background   : "#1a1d2e",
              border       : "1px solid #2e3250",
              borderRadius : "8px",
              padding      : "8px 16px",
              color        : "#9ca3af",
              fontSize     : "12px",
              cursor       : "pointer"
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <StatsCards stats={stats} />

      {/* Charts */}
      <RiskChart stats={stats} history={history} />

      {/* Scan history table */}
      <ScanTable
        history={history}
        onRowClick={setSelectedScan}
      />

      {/* Detail modal */}
      <ScanModal
        scan={selectedScan}
        onClose={() => setSelectedScan(null)}
      />

    </div>
  );
}