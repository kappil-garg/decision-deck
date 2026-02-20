# DecisionDesk

Lightweight AI-powered pro–con and decision assistant. Get structured analysis (pros/cons, comparison, SWOT, recommendation) for any decision.

## Run locally

**Prerequisites:** Node.js

1. `npm install`
2. Create `.env.local` in the project root and add:
   ```
   GEMINI_API_KEY=<your-api-key>
   ```
   Optional footer variables:
   ```
   FOOTER_URL=https://example.com
   FOOTER_LABEL=Your Name
   ```
   **Note:** `.env.local` is gitignored and won't be committed. Vite loads env files in this order (highest priority last): `.env` → `.env.local` → `.env.development` → `.env.development.local`
3. `npm run dev` — app runs at http://localhost:3000

## Deploy (GitHub Pages)

Push to the `main` branch; the included workflow builds and deploys to GitHub Pages.

1. In the repo **Settings → Pages**, set source to **GitHub Actions**.
2. In **Settings → Secrets and variables → Actions**:
   - Add secret `GEMINI_API_KEY` (your Gemini API key). The app will not work without it; the build still succeeds but users will see an error when analyzing.
   - Optional variables `FOOTER_URL` and `FOOTER_LABEL` to show “Built by [link]” in the footer. The footer is hidden if `FOOTER_URL` is not set.

## Footer

The footer is a full-width bar at the end of the page showing “Built by [link]”, using the app’s aqua/teal theme. Set `FOOTER_URL` and (optionally) `FOOTER_LABEL` in repository variables or `.env.local`. If `FOOTER_URL` is empty, the footer is hidden.
