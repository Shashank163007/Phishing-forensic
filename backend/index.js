import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Enable CORS for all origins so the Chrome Extension can reach it
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.post('/api/analyze', async (req, res) => {
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
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Railway Backend running perfectly on port ${PORT}`);
});
