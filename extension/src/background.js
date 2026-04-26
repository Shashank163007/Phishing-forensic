import { auth, db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const GROQ_API_KEY = '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';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ANALYZE_EMAIL') {
    handleEmailAnalysis(request.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
      
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

async function handleEmailAnalysis(emailData) {
  try {
    const prompt = `
    Perform a forensic security assessment on the following email to detect phishing.
    Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
    
    Email Details:
    Sender Name: ${emailData.senderName || 'Unknown'}
    Sender Email: ${emailData.sender}
    Subject: ${emailData.subject || 'No Subject'}
    Body:
    ${emailData.body}

    JSON Schema requirement:
    {
      "overall_risk": "GREEN" | "AMBER" | "RED",
      "risk_score": 0 to 100,
      "verdict": "Short explanation",
      "findings": ["finding 1", "finding 2"]
    }`;

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GROQ API FULL ERROR:", errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let textResponse = data.choices[0].message.content;
    textResponse = textResponse.replace(/^```json/m, '').replace(/```$/m, '').trim();

    const aiResult = JSON.parse(textResponse);
    
    // Save to Firestore if user is logged in
    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, 'users', user.uid, 'history'), {
        subject: emailData.subject,
        sender: emailData.sender,
        score: aiResult.risk_score,
        level: aiResult.overall_risk.toLowerCase(),
        verdict: aiResult.verdict,
        flags: aiResult.findings,
        timestamp: serverTimestamp()
      });
    }

    return aiResult;
  } catch (error) {
    console.error("Background AI Analysis Error:", error);
    throw error;
  }
}
