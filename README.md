# Phishing Forensics 🛡️
### AI-Powered Email Threat Detection, Forensic Analysis, & Security Operations Center (SOC)

Phishing Forensics is an end-to-end security solution designed to detect, highlight, and monitor phishing and social engineering threats in Gmail. The project combines a **Manifest V3 Chrome Extension** that scans emails in real-time, an **Express.js Backend** utilizing Google’s **Gemini 2.0 Flash** for forensic analysis, and a modern **Next.js SOC Dashboard** for security analysts to track, analyze, and export threat feeds.

---

## 🏗️ System Architecture

```
                                      +-------------------------+
                                      |   Google Gemini API     |
                                      |   (gemini-2.0-flash)    |
                                      +------------^------------+
                                                   |
                                                   v
+------------------+                 +-------------+------------+         +--------------------------+
|     Gmail UI     | <-------------> |    Express.js Backend    | <-----> |   Local Storage JSON     |
| (Chrome Tab DOM) |                 |    (Port 5000 / Vercel)  |         |   (users.json, history)  |
+--------^---------+                 +-------------^------------+         +--------------------------+
         |                                         |
         | (Scans DOM / Injects UI)                | (REST API POST)
         v                                         |
+--------------------------------------------------+------------+
|             Phishing Forensics Chrome Extension              |
|        - Content Script (MutationObserver + Highlights)       |
|        - Background Service Worker (Broker Requests)          |
|        - Extension Popup UI (Authentication / Scan History)   |
+---------------------------------------------------------------+
                                                   ^
                                                   |
                                                   v
                                     +-------------+------------+
                                     |   React Next.js SOC App  |
                                     |   (Analytics & Reports)  |
                                     +--------------------------+
```

---

## 📂 Repository Structure

The project is structured as a monorepo containing three core components:

*   **`backend/`**: Express.js server providing authentication and Gemini AI analysis endpoints. Set up for local execution and serverless deployment via Vercel.
    *   `index.js`: Main Express.js server with routes for user auth and email forensics.
    *   `api/analyze.js`: Serverless handler for hosting on Vercel.
    *   `data/`: File-based database storing users (`users.json`) and scanning records (`history.json`).
*   **`extension/`**: Manifest V3 Chrome Extension source files and Webpack compiler.
    *   `manifest.json`: Configuration, permissions (activeTab, tabs, storage, identity), and host matching constraints (`mail.google.com`).
    *   `src/content.js`: DOM observer that scans opened emails in Gmail, injects forensic verdicts, and highlights threats inline.
    *   `src/background.js`: Service worker forwarding email bodies to the analysis backend.
    *   `src/popup.html` / `popup.js`: Extension control interface for user authentication and quick history review.
    *   `dist/`: Production-ready compiled extension bundle ready for Chrome.
*   **`dashboard/`**: The Security Operations Center (SOC) Next.js 16 dashboard.
    *   `app/`: Next.js 16 app directory containing core routing (`page.tsx`), layout configuration (`layout.tsx`), and styling (`globals.css`).
    *   `components/`: Reusable interface elements (custom UI fields, charts, theme providers, and cyberpunk-style layouts).
    *   `hooks/`: Shared React hooks (`use-toast.ts`, `use-mobile.ts`).
*   **`docs/`**: Presentations and project documentation (e.g. `Zero-Trust-Security-for-Your-Inbox.pptx`).
*   **`legacy/`**: Preserved historical and prototype files (standalone HTML/JS Firebase dashboard and early demos).

---

## ⚡ Key Features

1.  **Automated Real-Time Gmail Scanning**: Monitors the Gmail interface. When an email is opened, it automatically extracts details (Sender, Subject, Body) and requests forensic verification.
2.  **In-Context Threat Popups**: Instantly displays alert banners directly in the email header containing the risk rating (`GREEN`, `AMBER`, or `RED`), safety score, and a clear legal/security verdict.
3.  **Inline Threat Highlighting**: Extracts suspicious phrases flagged by Gemini and highlights them in-place in the email body, letting users hover for safety tooltips.
4.  **Local History Logging & Session Auth**: Extension popups require login/registration. Scanned threats are automatically logged under the corresponding User ID in the history database.
5.  **Interactive SOC Analytics**: The Next.js dashboard visualizes risk trends, displays live threat feeds, lets analysts drill down into detailed forensic reports, and allows exporting history to standard CSV logs.

---

## ⚙️ Installation & Setup

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   Google Gemini API Key (obtained from [Google AI Studio](https://aistudio.google.com/))
*   Google Chrome (or any Chromium-based browser supporting unpacked MV3 extensions)

---

### Quick Start (Root Monorepo Workspaces)

The repository is configured as an npm monorepo workspace. You can manage everything directly from the project root:

1.  **Install all dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment Variables**:
    Create `backend/.env` (or copy from `.env.example`):
    ```env
    PORT=5000
    GOOGLE_API_KEY=your_gemini_api_key_here
    ```

3.  **Build All Packages**:
    ```bash
    npm run build
    ```
    This simultaneously bundles the Chrome extension into `extension/dist/` and compiles the Next.js SOC dashboard.

4.  **Run Development Servers**:
    *   **Backend API** (port 5000):
        ```bash
        npm run dev:backend
        ```
    *   **SOC Dashboard** (port 3000):
        ```bash
        npm run dev:dashboard
        ```
    *   **Extension (Watch Mode)**:
        ```bash
        npm run dev:extension
        ```

---

### Loading the Extension in Google Chrome
1.  Open Chrome and type `chrome://extensions/` in the URL bar.
2.  Toggle **Developer mode** (top-right corner).
3.  Click **Load unpacked** (top-left corner).
4.  Select the `extension/dist/` directory.
5.  *Note: Make sure the backend server is running on `http://localhost:5000` to allow the extension to analyze emails.*

---

## 🛠️ Tech Stack & Integrations

*   **AI Engine**: Gemini 2.0 Flash API (`@google/generative-ai`)
*   **Backend Services**: Express.js, CORS, Dotenv, Node.js filesystem DB.
*   **Security & Monitoring Portal**: Next.js 16 (React 19), Tailwind CSS v4, Lucide Icons, Recharts, Framer Motion, Radix UI.
*   **Chrome Extension Framework**: Webpack 5, Manifest V3, Chrome Extension APIs (`tabs`, `scripting`, `storage`, `identity`).
*   **Legacy Databases**: Integrated hooks for Firebase Auth and Cloud Firestore.

---

## 💡 Developer Notes & Best Practices

*   **API Rate Limiting**: The extension content script (`content.js`) is configured to only analyze the *most recent* message in a thread. This prevents redundant processing and saves free-tier API units.
*   **Webpack & Resource Resolving**: `CopyPlugin` in `webpack.config.js` moves HTML templates and style assets. Webpack bundles JS modules into flat files inside the `dist/` folder.
*   **Dev URL Configurations**: By default, `extension/src/popup.js` and `extension/src/background.js` point to `http://localhost:5000`. Update this URL to your deployed Vercel domain when moving to production.
*   **Security Disclaimer**: This tool is an AI-assisted detection client. Always double-check domain origins and email metadata directly on critical systems.
