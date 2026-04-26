const BACKEND_URL = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const authView = document.getElementById('auth-view');
  const sandboxView = document.getElementById('sandbox-view');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const authBtn = document.getElementById('auth-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const authError = document.getElementById('auth-error');
  const consentContainer = document.getElementById('consent-container');
  const consentCheckbox = document.getElementById('consent');
  const historyContainer = document.getElementById('history-container');

  let isLogin = true;

  // Check Current Session
  chrome.storage.local.get(['user'], (result) => {
    if (result.user) {
      showSandbox();
      loadHistory(result.user.id);
    } else {
      showAuth();
    }
  });

  function showAuth() {
    authView.classList.remove('hidden');
    sandboxView.classList.add('hidden');
    authError.textContent = '';
  }

  function showSandbox() {
    authView.classList.add('hidden');
    sandboxView.classList.remove('hidden');
  }

  // Dashboard button
  const dashboardBtn = document.getElementById('open-dashboard');
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:3000' });
    });
  }

  // Tabs
  tabLogin.addEventListener('click', () => {
    isLogin = true;
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    authBtn.textContent = 'Login';
    consentContainer.style.display = 'none';
    document.getElementById('signup-fields').style.display = 'none';
    authError.textContent = '';
  });

  tabSignup.addEventListener('click', () => {
    isLogin = false;
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    authBtn.textContent = 'Sign Up';
    consentContainer.style.display = 'flex';
    document.getElementById('signup-fields').style.display = 'block';
    authError.textContent = '';
  });

  // Auth Action
  authBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
      authError.textContent = 'Please fill in all fields.';
      return;
    }

    if (!isLogin) {
      if (!consentCheckbox.checked) {
        authError.textContent = 'You must accept the terms.';
        return;
      }
      const fullname = document.getElementById('fullname').value;
      const org = document.getElementById('organization').value;
      const role = document.getElementById('role').value;
      
      if (!fullname || !org || !role) {
        authError.textContent = 'Please provide Name, Organization, and Role.';
        return;
      }
    }

    authBtn.textContent = 'Authenticating...';
    authBtn.disabled = true;

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin ? { email, password } : { 
        email, 
        password, 
        fullName: document.getElementById('fullname').value,
        organization: document.getElementById('organization').value,
        role: document.getElementById('role').value
      };

      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auth failed');

      chrome.storage.local.set({ user: data }, () => {
        showSandbox();
        loadHistory(data.id);
      });

    } catch (error) {
      authError.textContent = `Error: ${error.message}`;
    } finally {
      authBtn.textContent = isLogin ? 'Login' : 'Sign Up';
      authBtn.disabled = false;
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['user'], () => {
      showAuth();
    });
  });

  // Load History
  async function loadHistory(userId) {
    historyContainer.innerHTML = '<p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">Loading history...</p>';
    try {
      const res = await fetch(`${BACKEND_URL}/api/history/${userId}`);
      const history = await res.json();
      
      historyContainer.innerHTML = '';
      
      if (!history || history.length === 0) {
        historyContainer.innerHTML = '<p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">No scans yet. Open an email in Gmail to start!</p>';
        return;
      }

      history.forEach((data) => {
        const date = new Date(data.timestamp).toLocaleString();
        
        let levelClass = '';
        let icon = '✅';
        if (data.level === 'red' || data.level === 'danger') { levelClass = 'danger'; icon = '🚨'; }
        else if (data.level === 'amber' || data.level === 'warning') { levelClass = 'warning'; icon = '⚠️'; }

        let findingsHtml = '';
        if (data.flags && data.flags.length > 0) {
          findingsHtml = `<ul class="history-findings">
            ${data.flags.map(f => `<li>${f}</li>`).join('')}
          </ul>`;
        }

        const card = document.createElement('div');
        card.className = `history-card ${levelClass}`;
        card.innerHTML = `
          <div class="history-header">
            <span><strong>${data.sender || 'Unknown Sender'}</strong></span>
            <span>${date}</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">${data.subject || 'No Subject'}</div>
          <div class="history-verdict">${icon} ${data.verdict || 'Analysis complete'}</div>
          ${findingsHtml}
        `;
        historyContainer.appendChild(card);
      });
    } catch (error) {
      console.error('Failed to load history:', error);
      historyContainer.innerHTML = '<p style="color: #ef4444; font-size: 12px; text-align: center; margin-top: 20px;">Failed to load history.</p>';
    }
  }
});
