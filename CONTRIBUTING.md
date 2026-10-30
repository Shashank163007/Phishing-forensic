# Contributing

Thanks for helping improve Phishing Forensics. Contributions of bug fixes, documentation, accessibility improvements, and carefully scoped features are welcome.

## Before you start

- Check open issues and pull requests for related work.
- For a substantial change, open an issue first to discuss the approach.
- For a security vulnerability, do not open a public issue. Follow [SECURITY.md](SECURITY.md).
- Do not include real email content, personal information, credentials, API keys, or other sensitive data in issues, pull requests, logs, or screenshots.

## Development setup

1. Install Node.js 20.9 or later and npm.
2. Fork and clone the repository, then install dependencies from the repository root:

   ```sh
   npm ci
   ```

3. Copy `backend/.env.example` to `backend/.env` and add a Google Gemini API key:

   ```env
   PORT=5000
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```

   Keep real credentials out of Git. The extension's companion API uses `http://localhost:5000` by default.

4. Build the Chrome extension:

   ```sh
   npm run build
   ```

5. To develop the extension and its companion API, use separate terminals:

   ```sh
   npm run dev:backend
   npm run dev:extension
   ```

   Load the generated `extension/dist/` directory as an unpacked extension in Chrome.

## Making a change

- Keep changes focused and follow the conventions in the surrounding code.
- Update documentation when setup, behavior, or configuration changes.
- Do not commit generated output, local environment files, credentials, or real user data.
- If adding dependencies, explain why they are needed and update the npm lockfile.

## Validation

Run this from the repository root before opening a pull request:

```sh
npm run build
```

This builds the Chrome extension. The project does not currently have an automated test suite; include the manual verification you performed in the pull request description. The GitHub Actions workflow runs the same production build.

## Pull requests

- Use a descriptive title and explain the problem and solution.
- Link related issues and call out any user-visible or configuration changes.
- Summarize validation performed, including manual checks when relevant.
- Confirm that the change contains no secrets or unredacted email/user data.
- Be responsive to review feedback and keep follow-up commits scoped to the requested changes.

By submitting a contribution, you agree that it is provided under the project's [MIT License](LICENSE).
