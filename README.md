# Universal Healthy Food Access System

A comprehensive web application for analyzing food access patterns worldwide, built for the NASA Space Apps Challenge 2025.

## Features

- **City Selection**: Search any city worldwide or click on map to select location
- **Food Outlet Analysis**: Automatically fetches and classifies food outlets from OpenStreetMap
- **Interactive Map**: Visual display of food outlets with color-coded classifications
- **Metrics Dashboard**: Detailed statistics and food access scoring
- **NASA Climate Data**: Integration with NASA POWER API for solar/climate data
- **Real-time Analysis**: Instant data fetching and visualization

## APIs Integrated

### Currently Working (No Authentication Required)
- **Nominatim API** (OpenStreetMap): City geocoding and boundaries
- **Overpass API** (OpenStreetMap): Food outlet data retrieval
- **NASA POWER API**: Solar irradiance, temperature, precipitation data

### Placeholder (Requires Authentication)
- **NASA Earthdata**: Population density, NDVI, Land Surface Temperature
- **Google Gemini**: AI solution generation (coming next)

## Quick Start

### 1. Install Dependencies
```bash
cd food-access-system
npm install
```

### 2. Start Development Server
```bash
npm start
```

### 3. Test the Application
Open [http://localhost:3000](http://localhost:3000) and try these test cities:
- **Hull, UK** - Should find 20-40 food outlets
- **Nairobi, Kenya** - Variable results (informal markets may not be in OSM)
- **Phoenix, Arizona** - Should find 100+ outlets (large city)

## Project Structure

```
src/
├── App.js                    # Main application component
├── App.css                   # Application styles
├── dataFetchers.js          # Universal data fetching module
├── components/
│   ├── CitySelector.js      # City search and selection
│   ├── Map.js               # Interactive map display
│   └── MetricsPanel.js      # Statistics and metrics
├── index.js                 # React entry point
└── index.css               # Global styles
```

## How It Works

### 1. City Selection
- User enters city name or clicks on map
- System geocodes city using Nominatim API
- Retrieves city boundaries and coordinates

### 2. Data Fetching
- Fetches food outlets from OpenStreetMap using Overpass API
- Classifies outlets as Healthy, Mixed, or Unhealthy
- Retrieves NASA POWER climate data for the location

### 3. Analysis & Visualization
- Calculates food access scores and statistics
- Displays outlets on interactive map with color coding
- Shows detailed metrics panel with breakdowns

## Food Outlet Classification

### Healthy Food Sources (Green)
- Supermarkets
- Greengrocers
- Health food stores
- Farmers markets
- Farms

### Mixed Selection (Yellow)
- Grocery stores
- Convenience stores
- Butchers
- Fishmongers

### Unhealthy Options (Red)
- Fast food restaurants
- Alcohol stores

## Expected Console Output

```
Geocoding city: Hull
Fetching data for: Kingston upon Hull
Fetching food outlets from OpenStreetMap...
✓ Found 34 food outlets
Fetching NASA POWER solar/climate data...
✓ NASA POWER data retrieved
✓ All data fetched successfully
```

## Troubleshooting

### "City not found" error
- Try full name: "Kingston upon Hull" instead of "Hull"
- Try with country: "Hull, England"

### CORS errors with Overpass API
- Overpass supports CORS, but check browser console
- If persistent, add a small delay between requests

### No markers showing on map
- Check browser console for coordinate errors
- Verify outlets have valid lat/lng
- Check Leaflet CSS is properly imported

## Next Steps

Once this foundation works:

1. **Add AI Solution Generator** - Integrate Gemini Flash 2.5 for urban farming recommendations
2. **Food Desert Analysis** - Implement algorithms to identify food deserts
3. **NASA Satellite Data** - Add NDVI, LST, and population density layers
4. **Before/After Comparison** - Build comparison views for intervention planning

## Development Notes

- Uses vanilla Leaflet.js (no react-leaflet wrapper) for better compatibility
- All API calls include proper error handling and retry logic
- Responsive design works on desktop and mobile
- Real-time data fetching with loading states

## Testing Checklist

After setup, verify these features work:

- [ ] Search for any city by name
- [ ] See city centered on map
- [ ] See food outlets plotted as markers
- [ ] Click markers to see outlet details
- [ ] See count of healthy vs unhealthy outlets
- [ ] View NASA climate data in metrics panel
- [ ] Reset functionality works

If all checkboxes work, you're ready for Phase 2 (AI solution generation)!

## License

Built for NASA Space Apps Challenge 2025
