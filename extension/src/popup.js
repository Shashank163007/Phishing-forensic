import { auth, db } from './firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const authView = document.getElementById('auth-view');
  const sandboxView = document.getElementById('sandbox-view');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const authBtn = document.getElementById('auth-btn');
  const googleBtn = document.getElementById('google-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const authError = document.getElementById('auth-error');
  const consentContainer = document.getElementById('consent-container');
  const consentCheckbox = document.getElementById('consent');
  const historyContainer = document.getElementById('history-container');

  let isLogin = true;

  // Monitor Auth State
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showSandbox();
      loadHistory(user.uid);
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

  // Tabs
  tabLogin.addEventListener('click', () => {
    isLogin = true;
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    authBtn.textContent = 'Login';
    consentContainer.style.display = 'none';
    authError.textContent = '';
  });

  tabSignup.addEventListener('click', () => {
    isLogin = false;
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    authBtn.textContent = 'Sign Up';
    consentContainer.style.display = 'flex';
    authError.textContent = '';
  });

  // Email Auth
  authBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
      authError.textContent = 'Please fill in all fields.';
      return;
    }

    if (!isLogin && !consentCheckbox.checked) {
      authError.textContent = 'You must accept the terms.';
      return;
    }

    authBtn.textContent = 'Authenticating...';
    authBtn.disabled = true;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      authError.textContent = `Error: ${error.message}`;
    } finally {
      authBtn.textContent = isLogin ? 'Login' : 'Sign Up';
      authBtn.disabled = false;
    }
  });

  // Google Auth
  googleBtn.addEventListener('click', () => {
    authError.textContent = '';
    
    if (typeof chrome !== 'undefined' && chrome.identity) {
      chrome.identity.getAuthToken({ interactive: true }, async function(token) {
        if (chrome.runtime.lastError) {
          authError.textContent = chrome.runtime.lastError.message;
          return;
        }
        
        try {
          const credential = GoogleAuthProvider.credential(null, token);
          await signInWithCredential(auth, credential);
        } catch (error) {
          authError.textContent = `Google Auth Error: ${error.message}`;
        }
      });
    } else {
      authError.textContent = 'Google Login requires Chrome Extension context.';
    }
  });

  // Logout
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      if (typeof chrome !== 'undefined' && chrome.identity) {
        chrome.identity.clearAllCachedAuthTokens(() => {});
      }
    } catch (error) {
      console.error('Logout error', error);
    }
  });

  // Load History
  async function loadHistory(uid) {
    historyContainer.innerHTML = '<p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">Loading history...</p>';
    try {
      const q = query(collection(db, 'users', uid, 'history'), orderBy('timestamp', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      
      historyContainer.innerHTML = '';
      
      if (querySnapshot.empty) {
        historyContainer.innerHTML = '<p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">No scans yet. Open an email in Gmail to start!</p>';
        return;
      }

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Just now';
        
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
