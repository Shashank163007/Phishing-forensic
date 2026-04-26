import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Local Storage Setup
const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));

const getUsers = () => JSON.parse(fs.readFileSync(USERS_FILE));
const saveUsers = (users) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
const getHistory = () => JSON.parse(fs.readFileSync(HISTORY_FILE));
const saveHistory = (history) => fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- Auth Endpoints ---

app.post('/api/auth/signup', (req, res) => {
  const { email, password, fullName, organization, role } = req.body;
  const users = getUsers();
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'User exists' });
  
  const newUser = { id: Date.now().toString(), email, password, fullName, organization, role };
  users.push(newUser);
  saveUsers(users);
  res.status(201).json({ id: newUser.id, email: newUser.email, fullName: newUser.fullName });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUsers().find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.status(200).json({ id: user.id, email: user.email, fullName: user.fullName });
});

// --- Analysis & History Endpoints ---

app.post('/api/analyze', async (req, res) => {
  try {
    const { subject, sender, senderName, body, userId } = req.body;
    if (!body || !sender) return res.status(400).json({ error: 'Missing fields' });

    const prompt = `
    Perform a forensic security assessment on the following email.
    Return ONLY a valid JSON object.
    
    Email Details:
    Sender: ${senderName || 'Unknown'} <${sender}>
    Subject: ${subject || 'No Subject'}
    Body: ${body}

    JSON Schema:
    {
      "overall_risk": "GREEN" | "AMBER" | "RED",
      "risk_score": 0-100,
      "verdict": "string",
      "findings": ["string"],
      "suspicious_phrases": ["string"]
    }`;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text().replace(/^```json/m, '').replace(/```$/m, '').trim();
    const aiResult = JSON.parse(textResponse);

    // Save to history if userId provided
    if (userId) {
      const history = getHistory();
      history.push({
        id: Date.now().toString(),
        userId,
        subject,
        sender,
        score: aiResult.risk_score,
        level: aiResult.overall_risk.toLowerCase(),
        verdict: aiResult.verdict,
        flags: aiResult.findings,
        timestamp: new Date().toISOString()
      });
      saveHistory(history);
    }

    return res.status(200).json(aiResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.get('/api/history/:userId', (req, res) => {
  const history = getHistory().filter(h => h.userId === req.params.userId);
  res.json(history);
});

// Get ALL history for SOC Dashboard
app.get('/api/history', (req, res) => {
  res.json(getHistory());
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Normal Auth Backend running on port ${PORT}`);
});
