# Heat Map Feature Documentation

## Overview

The heat map feature provides density zone visualization for food outlets and intervention locations, functioning as a territory/zone map with color-coded entity types.

## Features

### Density Visualization
- **Food Outlet Density Zones**: Visual representation of healthy, mixed, unhealthy, and unknown food outlet concentrations
- **Intervention Density Zones**: Heat map showing optimal placement locations for various intervention types
- **Color-Coded Mapping**: Each entity type has a distinct color gradient for easy identification

### Color Coordination (High Contrast with Glassmorphism)

#### Food Outlet Heat Maps
- **Healthy Outlets** 🟢: Vibrant emerald green gradient with glassmorphism
  - Gradient: `rgba(16, 185, 129, 0) → rgba(5, 150, 105, 0.7) → rgba(6, 78, 59, 0.95)`
  - Glow: Emerald shadow effect

- **Mixed Selection** 🟠: Vibrant amber/orange gradient with glassmorphism
  - Gradient: `rgba(251, 191, 36, 0) → rgba(245, 158, 11, 0.7) → rgba(180, 83, 9, 0.95)`
  - Glow: Amber shadow effect

- **Unhealthy Outlets** 🔴: Vibrant red gradient with glassmorphism
  - Gradient: `rgba(239, 68, 68, 0) → rgba(220, 38, 38, 0.7) → rgba(127, 29, 29, 0.95)`
  - Glow: Red shadow effect

- **Unknown/Unclassified** 🔵: Blue-gray gradient with glassmorphism
  - Gradient: `rgba(148, 163, 184, 0) → rgba(100, 116, 139, 0.65) → rgba(51, 65, 85, 0.9)`
  - Glow: Slate shadow effect

#### Intervention Heat Map
- **Intervention Locations** 🟣: Vibrant purple/magenta gradient with glassmorphism
  - Gradient: `rgba(168, 85, 247, 0) → rgba(147, 51, 234, 0.7) → rgba(107, 33, 168, 0.95)`
  - Glow: Purple shadow effect

### Glassmorphism Effects (UX-Optimized)

The heat maps feature modern glassmorphism styling optimized for map readability:
- **No Backdrop Blur**: Removed to preserve map outline clarity and text readability
- **Mix Blend Mode**: Multiply mode for seamless map integration without obscuring features
- **Subtle Enhancement**: 1.15x contrast and 1.05x brightness for gentle visual pop
- **Density-Responsive Opacity**: Smooth ramping from 0% (no density) to 90% (maximum density)
- **Smart Gradients**: 7-stop gradients (0.0, 0.1, 0.2, 0.4, 0.6, 0.8, 1.0) for natural transitions
- **Minimal Glows**: Very subtle drop-shadows (8px, 15% opacity) that don't interfere with map elements
- **Pointer Events**: Disabled to ensure map interactions work properly

**UX Benefits:**
- Low-density areas remain nearly transparent, keeping the base map visible
- High-density areas get full color saturation for clear identification
- Map labels, roads, and boundaries remain crisp and readable
- No visual blur artifacts that could confuse users
- Natural eye-friendly gradients that guide attention to important areas

## Implementation Details

### Components

#### HeatMapLayer.js
Main component managing heat map overlays using Leaflet.heat plugin.

**Props:**
- `mapInstance`: Leaflet map instance reference
- `foodOutlets`: Array of food outlet data with lat/lng and classification
- `optimalPlacements`: Optimal intervention placement data
- `visibleLayers`: Object controlling layer visibility
- `heatMapConfig`: Optional configuration for heat map appearance

**Configuration Options:**
```javascript
{
  radius: 30,          // Heat point radius in pixels (larger for better visibility)
  blur: 20,            // Amount of blur (enhanced for glassmorphism)
  maxZoom: 17,         // Zoom level where max intensity is reached
  max: 1.0,            // Maximum intensity value
  minOpacity: 0.4,     // Minimum opacity (increased for better contrast)
  gradient: {          // High-contrast RGBA gradients with transparency
    healthy: {
      0.0: 'rgba(16, 185, 129, 0)',
      0.3: 'rgba(16, 185, 129, 0.4)',
      0.6: 'rgba(5, 150, 105, 0.7)',
      0.8: 'rgba(4, 120, 87, 0.85)',
      1.0: 'rgba(6, 78, 59, 0.95)'
    },
    // ... similar for other types
  }
}
```

**Glassmorphism Styling (UX-Optimized):**
```css
canvas {
  /* No backdrop-filter to preserve map readability */
  mix-blend-mode: multiply;
  filter: contrast(1.15) brightness(1.05) drop-shadow(0 0 8px rgba(color, 0.15));
  pointer-events: none; /* Ensure map interactions work */
}
```

**Opacity Ramping Example (Healthy Outlets):**
```javascript
{
  0.0: 'rgba(16, 185, 129, 0)',    // Zero density: invisible
  0.1: 'rgba(16, 185, 129, 0.08)', // Very low: barely visible
  0.2: 'rgba(16, 185, 129, 0.2)',  // Low: light presence
  0.4: 'rgba(16, 185, 129, 0.45)', // Medium-low: becoming clear
  0.6: 'rgba(5, 150, 105, 0.65)',  // Medium-high: moderate density
  0.8: 'rgba(4, 120, 87, 0.8)',    // High: strong presence
  1.0: 'rgba(6, 78, 59, 0.9)'      // Maximum: full saturation
}
```

#### LayerControl.js
Extended with "Heat Map Density Zones" section providing:
- Individual toggles for each heat map type
- "All" and "None" bulk toggle buttons
- Visual indicators with color swatches

#### Map.js
Integrated heat map with:
- Visibility state management for heat map layers
- HeatMapLayer component rendering
- Synchronized toggle controls

## Usage

### Accessing Heat Maps

1. **Load City Data**: Select a city to load food outlet and intervention data
2. **Open Layer Control**: Click the layer control panel in the top-right corner
3. **Toggle Heat Maps**: Navigate to "Heat Map Density Zones" section
4. **Select Layers**: Enable/disable specific heat map types:
   - Healthy Outlets Density
   - Mixed Outlets Density
   - Unhealthy Outlets Density
   - Unknown Outlets Density
   - Intervention Density

### Best Practices

- **Combine with Markers**: Use heat maps alongside regular markers for comprehensive view
- **Zoom Levels**: Heat maps are most effective at zoom levels 11-15
- **Layer Combinations**: Enable complementary heat maps (e.g., healthy + intervention) to identify coverage gaps
- **Performance**: Disable unused heat maps for better performance with large datasets

## Technical Architecture

### Data Flow
```
City Data → foodOutlets/optimalPlacements
           ↓
      Map.js (state management)
           ↓
      HeatMapLayer (heat map generation)
           ↓
      Leaflet.heat (rendering)
```

### Heat Point Weighting

**Food Outlets:**
- Weight = `classification.score / 100`
- Higher scores = more intense heat points
- Reflects food access quality

**Interventions:**
- Weight = `score × priorityWeight`
- Priority weights: CRITICAL (1.0), HIGH (0.8), MEDIUM (0.6), LOW (0.4)
- Emphasizes high-priority interventions

## Dependencies

- **leaflet.heat** (v0.2.0): Core heat map plugin for Leaflet
- **leaflet** (v1.9.4): Base mapping library
- **react** (v18.2.0): UI framework

## API Reference

### HeatMapLayer Component

```javascript
<HeatMapLayer
  mapInstance={mapInstanceRef.current}
  foodOutlets={foodOutlets}
  optimalPlacements={optimalPlacements}
  visibleLayers={visibleLayers}
  heatMapConfig={{
    radius: 30,
    blur: 20,
    maxZoom: 18
  }}
/>
```

### Layer Visibility State

```javascript
{
  heatmap_healthy: false,
  heatmap_mixed: false,
  heatmap_unhealthy: false,
  heatmap_unknown: false,
  heatmap_intervention: false
}
```

## Performance Considerations

- **Large Datasets**: Heat maps perform well with 1000+ data points
- **Multiple Layers**: Enable only necessary heat maps to maintain performance
- **Browser Rendering**: Uses Canvas API for efficient rendering
- **Memory Usage**: Minimal memory footprint compared to individual markers

## Future Enhancements

- [ ] Adjustable heat map intensity slider
- [ ] Time-based heat map animations
- [ ] Custom gradient editor
- [ ] Export heat map as static image
- [ ] Clustering for extremely large datasets
- [ ] 3D heat map visualization option

## Troubleshooting

### Heat Map Not Appearing
1. Verify city data is loaded (check console for data fetch confirmation)
2. Enable heat map layer in Layer Control
3. Check zoom level (zoom in if map is too far out)
4. Ensure data points have valid lat/lng coordinates

### Performance Issues
1. Disable unused heat map layers
2. Reduce radius and blur values in heatMapConfig
3. Clear browser cache
4. Check for console errors

### Color Not Matching Expected
1. Verify gradient configuration in HeatMapLayer.js
2. Check classification scoring in food outlet data
3. Adjust minOpacity for visibility

## Example Use Cases

### Identifying Food Deserts
Enable only "Healthy Outlets Density" heat map to visualize areas lacking healthy food access (cold zones = food deserts).

### Intervention Planning
Enable "Healthy Outlets Density" + "Intervention Density" to see if planned interventions target areas with low healthy food access.

### Comparative Analysis
Toggle between different outlet types (healthy vs unhealthy) to compare distribution patterns.

### Access Gap Analysis
Enable all food outlet heat maps simultaneously to identify overall food access patterns and gaps.

## Contributing

When extending the heat map feature:
1. Maintain color consistency with existing gradients
2. Add new heat map types to LayerControl.js layer definitions
3. Update visibleLayers state in Map.js
4. Document new features in this file
5. Test with various dataset sizes

## License

Part of Universal Healthy Food Access System - NASA Space Apps Challenge 2025
