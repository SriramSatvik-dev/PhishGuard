// background.js

const API_BASE     = "http://localhost:8000";
const CACHE_TTL_MS = 10 * 60 * 1000;

// ─────────────────────────────────────────
// Confirm service worker is alive
// ─────────────────────────────────────────
console.log("PhishGuard background service worker started");


// ─────────────────────────────────────────
// Watch tab navigation
// ─────────────────────────────────────────
chrome.webNavigation.onCommitted.addListener(
  async (details) => {
    // Only care about the main frame — not iframes
    if (details.frameId !== 0) return;

    const validTransitions = ["link", "typed", "generated", "reload", "form_submit"];
    if (!validTransitions.includes(details.transitionType)) return;

    const url = details.url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return;

    // Skip browser internal pages
    if (url.startsWith("chrome://") ||
        url.startsWith("chrome-extension://") ||
        url === "about:blank") return;

    console.log("PhishGuard scanning:", url);
    await scanUrl(url, details.tabId);
  },
  // Filter to only fire on http/https — improves performance
  { url: [{ schemes: ["http", "https"] }] }
);


// ─────────────────────────────────────────
// Also watch for tab URL updates
// Catches cases webNavigation misses
// ─────────────────────────────────────────
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only fire when the page has fully committed to a new URL
  if (changeInfo.status !== "loading") return;
  if (!changeInfo.url) return;

  const url = changeInfo.url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return;

  console.log("PhishGuard tabs.onUpdated scanning:", url);
  await scanUrl(url, tabId);
});


// ─────────────────────────────────────────
// Core scan function
// ─────────────────────────────────────────
async function scanUrl(url, tabId) {
  try {
    // Check cache first
    const cached = await getCached(url);
    if (cached) {
      console.log("PhishGuard cache hit:", url);
      await applyResult(tabId, url, cached);
      return;
    }

    // Show scanning state on badge immediately
    await setBadge(tabId, "...", "#3b82f6");

    const response = await fetch(`${API_BASE}/scan`, {
      method  : "POST",
      headers : { "Content-Type": "application/json" },
      body    : JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const result = await response.json();
    console.log("PhishGuard result:", result.verdict, result.risk_score);

    await cacheResult(url, result);
    await applyResult(tabId, url, result);

  } catch (err) {
    console.warn("PhishGuard scan error:", err.message);
    // Show offline badge — don't crash
    await setBadge(tabId, "off", "#6b7280");
  }
}


// ─────────────────────────────────────────
// Apply result — update badge + notify page
// ─────────────────────────────────────────
async function applyResult(tabId, url, result) {
  const verdict = result.verdict;
  const score   = String(result.risk_score);

  const colors = {
    "phishing"   : "#ef4444",
    "suspicious" : "#f97316",
    "legitimate" : "#22c55e",
  };

  await setBadge(tabId, score, colors[verdict] || "#6b7280");

  // Store for popup to read
  await chrome.storage.local.set({
    [`result_${tabId}`]: result
  });

  // Notify content script if threat detected
  if (verdict === "phishing" || verdict === "suspicious") {
    // Small delay to ensure content script has loaded
    setTimeout(async () => {
      try {
        await chrome.tabs.sendMessage(tabId, {
          type   : "SHOW_BANNER",
          result : result
        });
      } catch (err) {
        // Content script not ready — try injecting it manually
        try {
          await chrome.scripting.executeScript({
            target : { tabId },
            files  : ["content.js"]
          });
          // Try sending message again after injection
          setTimeout(async () => {
            try {
              await chrome.tabs.sendMessage(tabId, {
                type   : "SHOW_BANNER",
                result : result
              });
            } catch { /* give up silently */ }
          }, 500);
        } catch { /* scripting failed — page may not allow it */ }
      }
    }, 1000);
  }
}


// ─────────────────────────────────────────
// Badge helper
// ─────────────────────────────────────────
async function setBadge(tabId, text, color) {
  try {
    await chrome.action.setBadgeText({ text, tabId });
    await chrome.action.setBadgeBackgroundColor({ color, tabId });
  } catch {
    // Tab may have closed — ignore
  }
}


// ─────────────────────────────────────────
// Cache helpers
// ─────────────────────────────────────────
async function getCached(url) {
  try {
    const key  = "cache_" + btoa(encodeURIComponent(url)).slice(0, 60);
    const data = await chrome.storage.local.get(key);
    const entry = data[key];

    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      await chrome.storage.local.remove(key);
      return null;
    }
    return entry.result;
  } catch {
    return null;
  }
}

async function cacheResult(url, result) {
  try {
    const key = "cache_" + btoa(encodeURIComponent(url)).slice(0, 60);
    await chrome.storage.local.set({
      [key]: { result, timestamp: Date.now() }
    });
  } catch { /* storage full or failed — ignore */ }
}


// ─────────────────────────────────────────
// Clean up when tab closes
// ─────────────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`result_${tabId}`);
});