# Phishing Forensics

An AI-assisted Chrome extension that scans Gmail messages for phishing indicators, shows findings in the Gmail interface, and keeps a recent scan history in the extension popup.

The Chrome extension is the user-facing product. A small Express API in `backend/` is included because it securely connects the extension to Gemini and provides account and scan-history endpoints. The dashboard, archived web demos, and presentation materials have been removed.

## Features

- Scans the open Gmail message and displays an AI-generated risk verdict.
- Highlights suspicious phrases in the message.
- Provides sign-in, sign-up, and recent scan history in the extension popup.
- Uses the companion API to call Gemini without putting an API key in the extension.

AI verdicts can be incorrect. Do not treat a result as a guarantee that a message or sender is safe.

## Requirements

- Node.js 20 or later and npm
- Google Chrome
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

## Local setup

1. Install dependencies from the repository root:

   ```sh
   npm ci
   ```

2. Create `backend/.env` from `backend/.env.example` and set your Gemini API key:

   ```env
   PORT=5000
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```

   Never commit your `.env` file or API key.

3. Start the companion API in one terminal:

   ```sh
   npm run dev:backend
   ```

4. Build the extension in another terminal:

   ```sh
   npm run build
   ```

5. In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `extension/dist/`.

The extension's API URL defaults to `http://localhost:5000` in `extension/src/popup.js` and `extension/src/background.js`. For a deployed API, update both constants and configure the corresponding API host in `extension/manifest.json`.

## Development

- `npm run dev:extension` — rebuild the extension when source files change.
- `npm run dev:backend` — start the local API.
- `npm run build` — create the production extension bundle in `extension/dist/`.

After rebuilding, reload the extension from `chrome://extensions`.

## Project structure

- `extension/` — Manifest V3 extension source and Webpack build.
- `backend/` — Express API for Gemini analysis, authentication, and scan history.
- `.github/` — issue and pull request templates and build workflow.

The backend is a required companion service, not a web dashboard. Keep it running locally while using the extension, or deploy it and configure the extension to use its URL.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and pull request guidance, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community expectations. Please report vulnerabilities privately using the process in [SECURITY.md](SECURITY.md), not in a public issue.

## License

This project is licensed under the [MIT License](LICENSE). Third-party dependencies and assets may have their own licenses.
