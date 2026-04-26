// Using Firebase SDK via CDN for the standalone dashboard
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getFirestore, collection, query, orderBy, onSnapshot, limit } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// Copy the firebase config from the extension
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY", // Note to user: We will replace this automatically
  authDomain: "phishing-forensics-hackathon.firebaseapp.com",
  projectId: "phishing-forensics-hackathon",
  storageBucket: "phishing-forensics-hackathon.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// We will fetch the exact config from the extension folder
async function loadConfig() {
  try {
    const response = await fetch('../extension/src/firebase.js');
    const text = await response.text();
    const apiKeyMatch = text.match(/apiKey:\s*["']([^"']+)["']/);
    const appIdMatch = text.match(/appId:\s*["']([^"']+)["']/);
    const projectIdMatch = text.match(/projectId:\s*["']([^"']+)["']/);
    const messagingSenderIdMatch = text.match(/messagingSenderId:\s*["']([^"']+)["']/);
    const storageBucketMatch = text.match(/storageBucket:\s*["']([^"']+)["']/);
    const authDomainMatch = text.match(/authDomain:\s*["']([^"']+)["']/);

    if (apiKeyMatch) firebaseConfig.apiKey = apiKeyMatch[1];
    if (appIdMatch) firebaseConfig.appId = appIdMatch[1];
    if (projectIdMatch) firebaseConfig.projectId = projectIdMatch[1];
    if (messagingSenderIdMatch) firebaseConfig.messagingSenderId = messagingSenderIdMatch[1];
    if (storageBucketMatch) firebaseConfig.storageBucket = storageBucketMatch[1];
    if (authDomainMatch) firebaseConfig.authDomain = authDomainMatch[1];
  } catch(e) { console.error("Could not load config automatically", e); }
}

await loadConfig();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authModal = document.getElementById('auth-modal');
const dashboardContent = document.getElementById('dashboard-content');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const submitLogin = document.getElementById('submit-login');
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const authError = document.getElementById('auth-error');

// Chart Instance
let riskChart = null;

// Auth State Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    authModal.classList.add('hidden');
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    dashboardContent.classList.remove('hidden');
    startDataListener(user.uid);
  } else {
    authModal.classList.remove('hidden');
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    dashboardContent.classList.add('hidden');
  }
});

// Login
submitLogin.addEventListener('click', async () => {
  try {
    authError.textContent = "Authenticating...";
    await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
  } catch (error) {
    authError.textContent = error.message;
  }
});

// Logout
logoutBtn.addEventListener('click', () => signOut(auth));
loginBtn.addEventListener('click', () => authModal.classList.remove('hidden'));

// Firestore Data
function startDataListener(uid) {
  const q = query(collection(db, 'users', uid, 'history'), orderBy('timestamp', 'desc'), limit(50));
  
  onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById('threat-table');
    tbody.innerHTML = '';
    
    let red = 0, amber = 0, green = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Just now';
      const level = (data.level || '').toLowerCase();
      
      let badgeClass = 'bg-slate-700 text-slate-300';
      if (level === 'red') { badgeClass = 'bg-red-500/20 text-red-400 border border-red-500/30'; red++; }
      else if (level === 'amber') { badgeClass = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'; amber++; }
      else if (level === 'green') { badgeClass = 'bg-green-500/20 text-green-400 border border-green-500/30'; green++; }
      
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-800/50 transition-colors";
      tr.innerHTML = `
        <td class="p-4 text-sm text-slate-400 whitespace-nowrap">${date}</td>
        <td class="p-4 text-sm font-medium">${data.sender || 'Unknown'}</td>
        <td class="p-4 text-sm"><span class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${badgeClass}">${level}</span></td>
        <td class="p-4 text-sm font-mono text-slate-300">${data.score || 0}/100</td>
        <td class="p-4 text-sm text-slate-300 truncate max-w-xs" title="${data.verdict}">${data.verdict || '-'}</td>
      `;
      tbody.appendChild(tr);
    });

    // Update Stats
    document.getElementById('stat-total').textContent = snapshot.size;
    document.getElementById('stat-threats').textContent = red + amber;
    document.getElementById('stat-safe').textContent = green;

    updateChart(green, amber, red);
  });
}

function updateChart(green, amber, red) {
  const ctx = document.getElementById('riskChart').getContext('2d');
  
  if (riskChart) {
    riskChart.data.datasets[0].data = [green, amber, red];
    riskChart.update();
    return;
  }

  riskChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Safe', 'Warning', 'Danger'],
      datasets: [{
        data: [green, amber, red],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8' } }
      },
      cutout: '75%'
    }
  });
}
