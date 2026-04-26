// Phishing Forensics Content Script (Gmail AI Background)

console.log("🛡️ Phishing Forensics AI injected into Gmail.");

// 1. Inject Top Banner
function injectTopBanner() {
  const banner = document.createElement('div');
  banner.id = "pf-top-banner";
  banner.innerHTML = "🛡️ Phishing Forensics AI is active. You can read mails safely.";
  Object.assign(banner.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    backgroundColor: '#10b981', // green
    color: '#ffffff',
    textAlign: 'center',
    padding: '8px',
    fontSize: '13px',
    fontWeight: '600',
    zIndex: '999999',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    fontFamily: 'sans-serif'
  });
  
  document.body.prepend(banner);
  
  // Auto-hide after 5 seconds to not annoy the user
  setTimeout(() => {
    banner.style.transition = "top 0.5s";
    banner.style.top = "-40px";
  }, 5000);
}

injectTopBanner();

// 2. Email Observer
// We look for the main email body container in Gmail. 
// Gmail's DOM is complex, but commonly email bodies are inside '.a3s' or '.ii.gt'
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      // Find open emails that haven't been scanned yet
      const emails = document.querySelectorAll('.a3s.aiL:not(.pf-scanned), .ii.gt:not(.pf-scanned)');
      if (emails.length > 0) {
        // Only analyze the most recent email in the thread to prevent Gemini Free Tier rate limits!
        const targetEmailNode = emails[emails.length - 1];
        
        // Mark all as scanned so we don't process the older ones in the thread
        emails.forEach(node => node.classList.add('pf-scanned'));
        
        analyzeEmailNode(targetEmailNode);
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

function analyzeEmailNode(node) {
  // Extract content
  const bodyText = node.innerText || "";
  
  // Try to find sender/subject if possible in the surrounding Gmail DOM
  // Gmail's DOM is highly obfuscated, but we can look for common header elements near the body
  let senderName = "Unknown";
  let senderEmail = "Unknown";
  let subject = document.title.replace(" - Gmail", ""); // Fallback to page title for subject

  // A basic attempt to find the sender in the expanded email view:
  const headerElem = node.closest('div[role="listitem"]')?.querySelector('.gD');
  if (headerElem) {
    senderName = headerElem.innerText || senderName;
    senderEmail = headerElem.getAttribute('email') || senderEmail;
  }

  // Show loading indicator
  const loadingId = "pf-loading-" + Math.random().toString(36).substr(2, 9);
  injectLoadingPopup(node, loadingId);

  // Send to background for AI Analysis
  chrome.runtime.sendMessage({
    type: 'ANALYZE_EMAIL',
    data: {
      subject: subject,
      senderName: senderName,
      sender: senderEmail,
      body: bodyText.substring(0, 5000) // limit length for API
    }
  }, (response) => {
    // Remove loading
    const loadingElem = document.getElementById(loadingId);
    if (loadingElem) loadingElem.remove();

    if (chrome.runtime.lastError || !response || !response.success) {
      console.error("AI Analysis Failed:", chrome.runtime.lastError || response?.error);
      injectRiskPopup(node, { overall_risk: "ERROR", verdict: "Failed to reach AI backend.", findings: [] });
      return;
    }

    // Display result
    injectRiskPopup(node, response.result);
  });
}

function injectLoadingPopup(emailNode, id) {
  const popup = document.createElement('div');
  popup.id = id;
  popup.className = "pf-risk-popup";
  popup.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-size:16px;">⏳</span>
      <span><strong>Forensic AI:</strong> Analyzing email...</span>
    </div>
  `;
  Object.assign(popup.style, {
    backgroundColor: '#334155',
    borderLeft: `4px solid #94a3b8`,
    color: '#f8fafc',
    padding: '8px 16px',
    margin: '16px 0',
    borderRadius: '0 8px 8px 0',
    fontSize: '13px',
    fontFamily: 'sans-serif'
  });
  emailNode.prepend(popup);
}

function injectRiskPopup(emailNode, report) {
  const popup = document.createElement('div');
  popup.className = "pf-risk-popup";
  
  const risk = (report.overall_risk || "UNKNOWN").toUpperCase();
  
  let color = '#10b981'; // green
  let icon = '✅';
  if (risk === 'RED' || risk === 'DANGER') {
    color = '#ef4444'; // red
    icon = '🚨';
  } else if (risk === 'AMBER' || risk === 'WARNING') {
    color = '#f59e0b'; // yellow
    icon = '⚠️';
  } else if (risk === 'ERROR') {
    color = '#64748b'; // slate
    icon = '❌';
  }

  // Create findings list safely
  let findingsHtml = '';
  if (report.findings && report.findings.length > 0) {
    findingsHtml = '<ul style="margin: 4px 0 0 20px; padding: 0; list-style-type: disc; opacity: 0.9;">' + 
                   report.findings.map(f => `<li>${f}</li>`).join('') + 
                   '</ul>';
  }

  popup.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:4px;">
      <div style="display:flex; align-items:center; gap:8px; font-size: 14px;">
        <span style="font-size:18px;">${icon}</span>
        <span><strong>AI Verdict [${risk}]:</strong> ${report.verdict || 'Analysis complete.'}</span>
      </div>
      ${findingsHtml}
    </div>
  `;

  Object.assign(popup.style, {
    backgroundColor: '#1e293b',
    borderLeft: `4px solid ${color}`,
    color: '#f8fafc',
    padding: '12px 16px',
    margin: '16px 0',
    borderRadius: '0 8px 8px 0',
    fontSize: '13px',
    fontFamily: 'sans-serif',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: '10'
  });

  // Insert at the top of the email body
  emailNode.prepend(popup);
}
