const BACKEND_URL = 'http://localhost:5000';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ANALYZE_EMAIL') {
    handleEmailAnalysis(request.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
      
    return true;
  }
});

async function handleEmailAnalysis(emailData) {
  try {
    // Get userId from storage
    const storage = await chrome.storage.local.get(['user']);
    const userId = storage.user ? storage.user.id : null;

    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...emailData,
        userId: userId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const aiResult = await response.json();
    return aiResult;
  } catch (error) {
    console.error("Background AI Analysis Error:", error);
    throw error;
  }
}
