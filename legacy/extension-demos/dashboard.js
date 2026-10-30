import { auth, db, getDocs, collection, query, where, orderBy, signOut } from './firebase';

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const historyList = document.getElementById('history-list');
  const noData = document.getElementById('no-data');
  const logoutBtn = document.getElementById('logout-btn');

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      fetchHistory(user.uid);
    } else {
      // Redirect to popup if not logged in
      window.location.href = "popup.html";
    }
  });

  logoutBtn.onclick = () => signOut(auth);

  async function fetchHistory(uid) {
    try {
      const q = query(
        collection(db, "history"),
        where("uid", "==", uid),
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      loading.classList.add('hidden');
      
      if (querySnapshot.empty) {
        noData.classList.remove('hidden');
        return;
      }

      historyList.classList.remove('hidden');
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.timestamp).toLocaleString();
        
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
          <div class="card-header">
            <span class="date">${date}</span>
            <span class="badge ${data.level}">${data.level.toUpperCase()}</span>
          </div>
          <div class="score-text">Score: ${data.score}</div>
          <p class="summary">${data.summary}</p>
          <div class="snippet">${escapeHtml(data.snippet)}</div>
        `;
        historyList.appendChild(card);
      });

    } catch (err) {
      console.error("Error fetching history:", err);
      loading.textContent = "Error loading history. Make sure Firestore rules allow read access.";
    }
  }

  function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }
});
