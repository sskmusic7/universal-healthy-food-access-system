# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Universal Healthy Food Access System - A React web application analyzing food access patterns worldwide, built for NASA Space Apps Challenge 2025. The system combines OpenStreetMap data with NASA climate APIs to identify food deserts and opportunities for urban farming interventions.

**Core Purpose**: Help urban planners and policymakers identify areas lacking healthy food access by visualizing food outlet distribution and integrating climate data for intervention planning.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (opens http://localhost:3000)
npm start

# Create production build
npm run build

# Run tests
npm test

# Deploy to GitHub Pages
npm run deploy
```

## Architecture Overview

### Data Flow Pattern

The application follows a **hub-and-spoke data architecture**:

1. **User Selection** → CitySelector component captures city name or map click
2. **Geocoding Hub** → `dataFetchers.js` geocodes city via Nominatim API
3. **Parallel Data Fetching** → Multiple API calls executed simultaneously:
   - Overpass API for food outlets (OpenStreetMap)
   - NASA POWER API for solar/climate data
   - (Optional) NASA Earthdata APIs for satellite imagery
4. **Data Processing** → Food outlets classified as healthy/mixed/unhealthy
5. **Visualization** → Leaflet map displays color-coded markers + metrics dashboard

### Key Architectural Decisions

**Universal Data Fetcher Module** (`src/dataFetchers.js`):
- Central module handling ALL external API interactions
- Exports discrete functions for each data source (no classes)
- Implements retry logic and error handling at the module level
- Uses axios for HTTP requests with configurable timeouts

**Stateless Component Design**:
- `App.js` holds all application state (city, data, loading, errors)
- Child components are pure presentational components receiving props
- State updates trigger re-renders cascading down component tree
- No Redux/Context - single useState pattern sufficient for app complexity

**Vanilla Leaflet Integration**:
- Uses Leaflet.js directly (NO react-leaflet wrapper)
- Map initialization happens in useEffect with cleanup
- Markers managed through Leaflet's native API
- Rationale: Better control, fewer dependency conflicts, smaller bundle

### Food Outlet Classification Logic

Located in `dataFetchers.js` functions `classifyOutlet()` and `getOutletClassification()`:

- **Healthy Primary** (Green #0d5e3a): supermarket, greengrocer, farm, health_food, marketplace
- **Mixed Selection** (Yellow #fbbf24): grocery, convenience, butcher, fishmonger
- **Unhealthy** (Red #dc2626): fast_food, alcohol stores
- **Unknown** (Gray #6b7280): Unclassified outlets

Classification affects:
- Marker color on map
- Food access scoring (0-100%)
- Metrics panel statistics

### API Integration Details

**OpenStreetMap APIs** (No authentication required):
- **Nominatim**: City geocoding, returns lat/lng + bounding box
- **Overpass**: Food outlet queries using Overpass QL syntax
- Rate limits: Nominatim 1 req/sec, Overpass ~10k queries/day
- CORS: Fully supported, no proxy needed

**NASA POWER API** (No authentication required):
- Parameters: `ALLSKY_SFC_SW_DWN` (solar), `T2M` (temp), `PRECTOTCORR` (precip)
- Returns 1 year of daily data for specified lat/lng
- Used for urban farming site selection analysis

**NASA Earthdata APIs** (Authentication required - not yet implemented):
- SEDAC: Population density data
- MODIS: NDVI (vegetation index) and LST (land surface temperature)
- Requires NASA Earthdata account + bearer token
- Implementation ready in `dataFetchers.js`, gated by options flags

## Component Structure

```
src/
├── App.js                      # Main container, manages all state
├── dataFetchers.js            # Universal API client (geocoding, OSM, NASA)
├── components/
│   ├── CitySelector.js        # City search + quick test city buttons
│   ├── Map.js                 # Leaflet map with food outlet markers
│   └── MetricsPanel.js        # Statistics dashboard (food access score, climate data)
```

**State Management Pattern**:
- App.js: `selectedCity`, `cityData`, `loading`, `error`
- CitySelector: Local search input state only
- Map: Stateless, rebuilds on prop changes
- MetricsPanel: Stateless, pure presentation

## Critical Implementation Notes

### Bounding Box Format Consistency

All bounding boxes MUST follow format: `[south, north, west, east]` or `[minLat, maxLat, minLng, maxLng]`

- Nominatim returns this format directly
- Overpass API query format: `(south, west, north, east)` - ORDER DIFFERS
- NASA APIs expect: `west,south,east,north` (WGS84 standard)
- Helper function: `validateBBox()` in dataFetchers.js

### Leaflet Map Lifecycle

Map initialization in `Map.js` must follow this pattern:

```javascript
useEffect(() => {
  // 1. Initialize map ONLY if container exists and map doesn't
  if (!mapRef.current && mapContainerRef.current) {
    mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], zoom);
  }

  // 2. Update view when city changes
  if (mapRef.current && cityData) {
    mapRef.current.setView([cityData.lat, cityData.lng], 12);
  }

  // 3. Cleanup on unmount
  return () => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  };
}, [cityData]);
```

**Why**: Leaflet doesn't play well with React's reconciliation. Must manually manage map instance lifecycle to avoid memory leaks and duplicate map tiles.

### CSS Import Order

Critical for Leaflet styling:

```javascript
// index.js
import 'leaflet/dist/leaflet.css';  // MUST come before App.css
import './index.css';
import App from './App';
```

If Leaflet CSS loads after custom CSS, markers and controls render incorrectly.

## Testing Strategy

**Test Cities** (pre-configured in CitySelector):
- Hull, England (~300 outlets) - Medium UK city
- Nairobi, Kenya (~750 outlets) - Developing world test case
- Phoenix, Arizona (~2,200 outlets) - Large US city
- London, Tokyo - Megacity stress tests

**Expected Behavior**:
1. City search returns geocoded location
2. Map centers on city with 15km view
3. Food outlets appear as colored markers within 2-3 seconds
4. Clicking markers shows outlet name + type
5. Metrics panel calculates food access score
6. NASA climate data displays (if available)

**Common Issues**:
- "City not found": Try full name ("Kingston upon Hull") or add country
- No markers: Check browser console for coordinate validation errors
- Slow loading: Large cities (>1000 outlets) may take 5-10 seconds
- CORS errors: Shouldn't happen with OSM APIs; check network tab

## Environment Variables

Create `.env` file in project root:

```bash
# Optional - for NASA Earthdata APIs (not yet implemented)
REACT_APP_NASA_EARTHDATA_TOKEN=your_token_here

# Optional - for Google Gemini AI (Phase 2 feature)
REACT_APP_GEMINI_API_KEY=your_key_here
```

**Current Status**: App works fully without any environment variables. NASA POWER API requires no authentication.

## Deployment

**GitHub Pages** (current setup):
```bash
npm run build       # Creates optimized production build
npm run deploy      # Deploys to gh-pages branch via gh-pages package
```

GitHub Actions workflow (`.github/workflows/deploy.yml`) auto-deploys on push to `main` branch.

**Vercel** (alternative):
- `vercel.json` included with SPA routing config
- Automatic deployment on git push if linked to Vercel

## Next Phase Development Priorities

1. **AI Solution Generator**: Integrate Google Gemini Flash 2.5 for urban farming recommendations based on climate + food access data
2. **Food Desert Analysis**: Implement walking distance algorithms to identify areas >15min walk from healthy food
3. **NASA Satellite Integration**: Add population density (SEDAC), NDVI (vegetation), LST (heat) layers
4. **Before/After Comparison**: Build intervention planning tool showing projected improvements

## Known Limitations

- **OpenStreetMap Coverage**: Informal markets in developing nations often not mapped (affects Nairobi, Lagos, etc.)
- **Food Classification**: Binary healthy/unhealthy; doesn't account for price, cultural food preferences
- **Static Analysis**: No temporal changes tracking (yet)
- **Walking Distance**: 15min radius circles, not actual walkable paths (future: integrate routing APIs)

## Code Style Notes

- No semicolons in JSX files (project convention)
- Inline styles used extensively (no CSS modules)
- Console.log debugging statements intentionally left in for transparency
- Function components with hooks (no class components)
- Async/await preferred over Promise chains
