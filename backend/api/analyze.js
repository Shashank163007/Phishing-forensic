import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subject, sender, senderName, body } = req.body;

    if (!body || !sender) {
      return res.status(400).json({ error: 'Missing required email fields (sender, body)' });
    }

    const prompt = `
    Perform a forensic security assessment on the following email to detect phishing.
    Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
    
    Email Details:
    Sender Name: ${senderName || 'Unknown'}
    Sender Email: ${sender}
    Subject: ${subject || 'No Subject'}
    Body:
    ${body}

    JSON Schema requirement:
    {
      "overall_risk": "GREEN" | "AMBER" | "RED",
      "risk_score": <number between 0 and 100>,
      "verdict": "<Short 1-2 sentence explanation>",
      "findings": [
        "<bullet point finding 1>",
        "<bullet point finding 2>"
      ]
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text();
    
    // Clean up any potential markdown formatting the model might still add
    textResponse = textResponse.replace(/^```json/m, '').replace(/```$/m, '').trim();

    try {
      const parsedReport = JSON.parse(textResponse);
      return res.status(200).json(parsedReport);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', textResponse);
      return res.status(500).json({ error: 'AI returned invalid JSON format' });
    }

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Internal server error during analysis' });
  }
}
