const API_BASE      = "https://phishguard-production-e3d7.up.railway.app";

// Elements (same as before)
const urlDisplay   = document.getElementById("urlDisplay");
const scanBtn      = document.getElementById("scanBtn");
const loadingState = document.getElementById("loadingState");
const errorBox     = document.getElementById("errorBox");
const verdictCard  = document.getElementById("verdictCard");
const verdictLabel = document.getElementById("verdictLabel");
const verdictText  = document.getElementById("verdictText");
const riskScore    = document.getElementById("riskScore");
const scoreBar     = document.getElementById("scoreBar");
const flagsSection = document.getElementById("flagsSection");
const flagsList    = document.getElementById("flagsList");
const footerStatus = document.getElementById("footerStatus");

let currentUrl = "";
let currentTabId = null;

// ─────────────────────────────────────────
// On popup open — load cached result instantly
// ─────────────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  currentTabId = tabs[0].id;
  currentUrl   = tabs[0].url;
  urlDisplay.textContent = currentUrl;

  // Try to load cached result from background.js
  const data = await chrome.storage.local.get(`result_${currentTabId}`);
  const cached = data[`result_${currentTabId}`];

  if (cached) {
    showResult(cached);
    footerStatus.textContent = "Auto-scanned in background";
    scanBtn.textContent = "Re-scan";
  }
});

// ─────────────────────────────────────────
// Manual re-scan button
// ─────────────────────────────────────────
scanBtn.addEventListener("click", async () => {
  if (!currentUrl) return;

  setLoading(true);
  hideAll();

  try {
    const response = await fetch(`${API_BASE}/scan`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ url: currentUrl })
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const result = await response.json();
    await chrome.storage.local.set({ [`result_${currentTabId}`]: result });
    showResult(result);

  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
});

// ─────────────────────────────────────────
// Display functions — same as before
// ─────────────────────────────────────────
function showResult(result) {
  const color  = result.color  || "green";
  const verdict = result.verdict || "unknown";
  const score  = result.risk_score || 0;
  const flags  = result.flags || [];

  verdictCard.className    = `verdict-card ${color}`;
  verdictCard.style.display = "block";
  verdictLabel.textContent = "Verdict";
  verdictText.textContent  = verdict.toUpperCase();
  riskScore.textContent    = `Risk score: ${score}/100`;

  setTimeout(() => { scoreBar.style.width = `${score}%`; }, 50);

  if (flags.length > 0) {
    flagsList.innerHTML = flags.map(f => `
      <div class="flag-item">
        <div class="flag-dot"></div>
        <span>${f}</span>
      </div>
    `).join("");
    flagsSection.style.display = "block";
  }

  footerStatus.textContent = `Scanned at ${new Date().toLocaleTimeString()}`;
}

function setLoading(isLoading) {
  loadingState.style.display = isLoading ? "block" : "none";
  scanBtn.disabled = isLoading;
}

function hideAll() {
  verdictCard.style.display  = "none";
  flagsSection.style.display = "none";
  errorBox.style.display     = "none";
}

function showError(message) {
  errorBox.textContent   = `Error: ${message}. Make sure your server is running on port 8000.`;
  errorBox.style.display = "block";
}

// ─────────────────────────────────────────
// Open Dashboard button
// Opens dashboard in a new tab, or focuses
// it if it's already open
// ─────────────────────────────────────────
const DASHBOARD_URL = "https://phishguard-dashboard-itbr.onrender.com";

document.getElementById("dashboardLink").addEventListener("click", async () => {
  // Check if dashboard tab is already open
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find(tab =>
    tab.url && tab.url.startsWith(DASHBOARD_URL)
  );

  if (existing) {
    // Focus the existing tab instead of opening a duplicate
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
  } else {
    // Open a new tab
    await chrome.tabs.create({ url: DASHBOARD_URL });
  }

  // Close the popup
  window.close();
});