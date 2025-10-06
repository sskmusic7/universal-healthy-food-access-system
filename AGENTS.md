# Repository Guidelines

## Project Structure & Module Organization
- `src/index.js` bootstraps React while `src/App.js` coordinates data flow.
- UI layers live in `src/components/` (map, selectors, metrics); share utility logic through `src/utils/` and `src/optimization/OptimalPlacementEngine.js`.
- API orchestration, feature flags, and rate limiting sit in `src/config/apiConfig.js`; adjust environment toggles there.
- Static assets and the HTML shell reside in `public/`; root-level `test-*.js` focus on integration and data pipelines.

## Build, Test, and Development Commands
- `npm install` installs dependencies after cloning or when `package.json` changes.
- `npm start` launches the CRA dev server with hot reload at http://localhost:3000.
- `npm run build` compiles an optimized production bundle in `build/`; run before deploying.
- `npm test` starts Jest in watch mode; use `CI=true npm test` for a single pass in CI workflows.
- `npm run deploy` publishes the `build/` directory to GitHub Pages via `gh-pages`.

## Coding Style & Naming Conventions
- Keep 2-space indentation and rely on the bundled `react-app` ESLint config; resolve warnings before committing.
- Name React files and exports in `src/components/` using PascalCase; hooks and helpers remain camelCase.
- Co-locate domain helpers with their feature (e.g., analytics in `src/utils/`); prefer named exports and pure functions.
- Extract complex map logic into utilities or `useMemo` blocks to preserve render performance.

## Testing Guidelines
- Jest + React Testing Library power the suite; mirror patterns in existing `test-*.js` files.
- Name new specs `test-<feature>.js` at the repo root or `*.test.js` beside the module under test.
- Mock external APIs (`axios`, `fetch`) and supply fixtures for NASA/OSM responses to keep tests deterministic.
- Maintain coverage for map interactions, outlet classification, and rate-limited fetch flows before requesting review.

## Commit & Pull Request Guidelines
- Follow the observed `type: summary` style (`feat:`, `fix:`, `docs:`); keep subjects ≤72 characters and use present tense.
- Group related changes per commit; isolate configuration or schema updates when touching multiple surfaces.
- PRs must outline the change, tests executed, and any new env vars; add before/after screenshots for UI updates.
- Link related issues and mention API owners when modifying `src/config/apiConfig.js` or rate limit constants.

## Security & Configuration Tips
- Store secrets in `.env.local` using the `REACT_APP_*` keys consumed by `src/config/apiConfig.js`; never commit credentials.
- Run `./setup.sh` only after reviewing its steps; it primes local env files and dependencies.
- Respect documented rate limits; reuse `rateLimitedApiCall` when adding integrations instead of custom throttling.
