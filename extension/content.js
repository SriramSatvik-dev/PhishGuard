// ─────────────────────────────────────────
// Listen for messages from background.js
// ─────────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SHOW_BANNER") {
    showBanner(message.result);
  }
});


// ─────────────────────────────────────────
// Inject warning banner into the page
// ─────────────────────────────────────────
function showBanner(result) {
  // Don't show duplicate banners
  if (document.getElementById("phishguard-banner")) return;

  const isPhishing = result.verdict === "phishing";
  const score      = result.risk_score;
  const flags      = result.flags || [];

  // Colors
  const bgColor     = isPhishing ? "#2d1515" : "#2d1f0f";
  const borderColor = isPhishing ? "#ef4444" : "#f97316";
  const textColor   = isPhishing ? "#f87171" : "#fb923c";
  const icon        = isPhishing ? "🚨" : "⚠️";
  const title       = isPhishing
    ? "Phishing Website Detected"
    : "Suspicious Website";

  // Build banner HTML
  const banner = document.createElement("div");
  banner.id    = "phishguard-banner";
  banner.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 2147483647;
    background: ${bgColor};
    border-bottom: 2px solid ${borderColor};
    padding: 12px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  `;

  // Left side — icon + message
  const left = document.createElement("div");
  left.style.cssText = "display:flex; align-items:flex-start; gap:12px; flex:1;";

  const iconEl = document.createElement("span");
  iconEl.textContent = icon;
  iconEl.style.cssText = "font-size:20px; flex-shrink:0; margin-top:1px;";

  const content = document.createElement("div");

  const titleEl = document.createElement("div");
  titleEl.textContent = `${title} — Risk Score: ${score}/100`;
  titleEl.style.cssText = `
    color: ${textColor};
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
  `;

  // Show first two flags as reason
  const reasonEl = document.createElement("div");
  reasonEl.textContent = flags.slice(0, 2).join(" · ") || "Multiple risk signals detected";
  reasonEl.style.cssText = `
    color: #9ca3af;
    font-size: 12px;
    line-height: 1.4;
  `;

  content.appendChild(titleEl);
  content.appendChild(reasonEl);
  left.appendChild(iconEl);
  left.appendChild(content);

  // Right side — buttons
  const buttons = document.createElement("div");
  buttons.style.cssText = "display:flex; gap:8px; align-items:center; flex-shrink:0;";

  // "Proceed anyway" button
  const proceedBtn = document.createElement("button");
  proceedBtn.textContent = "Proceed anyway";
  proceedBtn.style.cssText = `
    background: transparent;
    border: 1px solid #4b5563;
    color: #9ca3af;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
  `;
  proceedBtn.addEventListener("click", () => {
    banner.remove();
  });

  // "Go back" button
  const backBtn = document.createElement("button");
  backBtn.textContent = "Go back";
  backBtn.style.cssText = `
    background: ${borderColor};
    border: none;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
  `;
  backBtn.addEventListener("click", () => {
    history.back();
  });

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = `
    background: transparent;
    border: none;
    color: #6b7280;
    font-size: 16px;
    cursor: pointer;
    padding: 4px 6px;
    line-height: 1;
  `;
  closeBtn.addEventListener("click", () => banner.remove());

  buttons.appendChild(proceedBtn);
  buttons.appendChild(backBtn);
  buttons.appendChild(closeBtn);

  banner.appendChild(left);
  banner.appendChild(buttons);
  document.body.prepend(banner);

  // Push page content down so banner doesn't overlap it
  document.body.style.marginTop =
    (parseInt(document.body.style.marginTop || "0") + banner.offsetHeight + 12) + "px";

  // Auto-dismiss after 30 seconds for suspicious (not phishing)
  if (!isPhishing) {
    setTimeout(() => {
      if (document.getElementById("phishguard-banner")) {
        banner.remove();
      }
    }, 30000);
  }
}