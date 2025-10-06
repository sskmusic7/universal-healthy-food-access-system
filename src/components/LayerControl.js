// LayerControl.js - Map Layer Toggle Component
// Allows users to show/hide different intervention types and food outlet categories

import React, { useState } from 'react';

function LayerControl(props = {}) {
  const { visibleLayers = {}, onLayerToggle = () => {} } = props;
  const [isExpanded, setIsExpanded] = useState(true);

  // Food outlet categories
  const foodOutletLayers = [
    { id: 'healthy', label: 'Healthy Food Outlets', color: '#0d5e3a', icon: '🥬' },
    { id: 'mixed', label: 'Mixed Selection', color: '#fbbf24', icon: '🏪' },
    { id: 'unhealthy', label: 'Unhealthy Outlets', color: '#dc2626', icon: '🍔' },
    { id: 'unknown', label: 'Unknown/Unclassified', color: '#6b7280', icon: '❓' }
  ];

  // Intervention/placement types
  const interventionLayers = [
    { id: 'SUPERMARKET', label: 'Supermarkets', icon: '🏪', color: '#8b5cf6' },
    { id: 'FARMERS_MARKET', label: 'Farmers Markets', icon: '🌾', color: '#8b5cf6' },
    { id: 'MOBILE_MARKET', label: 'Mobile Markets', icon: '🚐', color: '#8b5cf6' },
    { id: 'URBAN_FARM', label: 'Urban Farms', icon: '🌱', color: '#8b5cf6' },
    { id: 'COMMUNITY_GARDEN', label: 'Community Gardens', icon: '🥬', color: '#8b5cf6' },
    { id: 'VERTICAL_FARM', label: 'Vertical Farms', icon: '🏢', color: '#8b5cf6' },
    { id: 'AQUAPONICS', label: 'Aquaponics', icon: '🐟', color: '#8b5cf6' },
    { id: 'FOOD_HUB', label: 'Food Hubs', icon: '📦', color: '#8b5cf6' },
    { id: 'COMMUNITY_KITCHEN', label: 'Community Kitchens', icon: '👨‍🍳', color: '#8b5cf6' },
    { id: 'FOOD_PANTRY', label: 'Food Pantries', icon: '🥫', color: '#8b5cf6' }
  ];

  const aiLayers = [
    { id: 'ai_recommendations', label: 'AI Strategy Hotspots', icon: '🤖', color: '#0ea5e9' }
  ];

  // Heat map layers with high-contrast colors matching glassmorphism gradients
  const heatMapLayers = [
    { id: 'heatmap_healthy', label: 'Healthy Outlets Density', color: '#10b981', glowColor: 'rgba(16, 185, 129, 0.4)' },
    { id: 'heatmap_mixed', label: 'Mixed Outlets Density', color: '#f59e0b', glowColor: 'rgba(251, 191, 36, 0.4)' },
    { id: 'heatmap_unhealthy', label: 'Unhealthy Outlets Density', color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.4)' },
    { id: 'heatmap_unknown', label: 'Unknown Outlets Density', color: '#64748b', glowColor: 'rgba(148, 163, 184, 0.4)' },
    { id: 'heatmap_intervention', label: 'Intervention Density', color: '#a855f7', glowColor: 'rgba(168, 85, 247, 0.4)' }
  ];

  const handleToggle = (layerId) => {
    onLayerToggle(layerId);
  };

  const toggleAllFoodOutlets = (visible) => {
    foodOutletLayers.forEach(layer => {
      if (visibleLayers[layer.id] !== visible) {
        onLayerToggle(layer.id);
      }
    });
  };

  const toggleAllInterventions = (visible) => {
    interventionLayers.forEach(layer => {
      if (visibleLayers[layer.id] !== visible) {
        onLayerToggle(layer.id);
      }
    });
  };

  const toggleAllHeatMaps = (visible) => {
    heatMapLayers.forEach(layer => {
      if (visibleLayers[layer.id] !== visible) {
        onLayerToggle(layer.id);
      }
    });
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      minWidth: '280px',
      maxWidth: '320px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          backgroundColor: '#f9fafb',
          borderRadius: isExpanded ? '8px 8px 0 0' : '8px'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🗺️</span>
          <span style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
            Map Layers
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Layer Controls */}
      {isExpanded && (
        <div style={{ padding: '12px 16px', maxHeight: '500px', overflowY: 'auto' }}>

          {/* Food Outlets Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Food Outlets
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleAllFoodOutlets(true); }}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleAllFoodOutlets(false); }}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    cursor: 'pointer'
                  }}
                >
                  None
                </button>
              </div>
            </div>

            {foodOutletLayers.map(layer => (
              <label
                key={layer.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 8px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  backgroundColor: visibleLayers[layer.id] ? '#f3f4f6' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = visibleLayers[layer.id] ? '#f3f4f6' : 'transparent'}
              >
                <input
                  type="checkbox"
                  checked={visibleLayers[layer.id]}
                  onChange={() => handleToggle(layer.id)}
                  style={{ marginRight: '8px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '16px', marginRight: '8px' }}>{layer.icon}</span>
                <span style={{ fontSize: '13px', color: '#374151', flex: 1 }}>
                  {layer.label}
                </span>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: layer.color,
                    border: '2px solid white',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                />
              </label>
            ))}
          </div>

          {/* Interventions Section */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Recommended Interventions
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleAllInterventions(true); }}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleAllInterventions(false); }}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    cursor: 'pointer'
                  }}
                >
                  None
                </button>
              </div>
            </div>

            {interventionLayers.map(layer => (
              <label
                key={layer.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 8px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  backgroundColor: visibleLayers[layer.id] ? '#f3f4f6' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = visibleLayers[layer.id] ? '#f3f4f6' : 'transparent'}
              >
                <input
                  type="checkbox"
                  checked={visibleLayers[layer.id]}
                  onChange={() => handleToggle(layer.id)}
                  style={{ marginRight: '8px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '16px', marginRight: '8px' }}>{layer.icon}</span>
                <span style={{ fontSize: '13px', color: '#374151', flex: 1 }}>
                  {layer.label}
                </span>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: layer.color,
                    border: '2px solid white',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                />
              </label>
            ))}
          </div>

          {/* AI Strategy Section */}
          <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: '8px'
            }}>
              AI Strategy Layers
            </span>

            {aiLayers.map(layer => (
              <label
                key={layer.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 8px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  backgroundColor: visibleLayers[layer.id] ? '#ecfeff' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = visibleLayers[layer.id] ? '#ecfeff' : 'transparent'}
              >
                <input
                  type="checkbox"
                  checked={visibleLayers[layer.id]}
                  onChange={() => handleToggle(layer.id)}
                  style={{ marginRight: '8px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '16px', marginRight: '8px' }}>{layer.icon}</span>
                <span style={{ fontSize: '13px', color: '#374151', flex: 1 }}>
                  {layer.label}
                </span>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: layer.color,
                    border: '2px solid white',
                    boxShadow: '0 1px 2px rgba(14,165,233,0.25)'
                  }}
                />
              </label>
            ))}
          </div>

          {/* Heat Map Section */}
          <div style={{ marginTop: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Heat Map Density Zones
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleAllHeatMaps(true); }}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleAllHeatMaps(false); }}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    cursor: 'pointer'
                  }}
                >
                  None
                </button>
              </div>
            </div>

            {heatMapLayers.map(layer => (
              <label
                key={layer.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 8px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  backgroundColor: visibleLayers[layer.id] ? '#f3f4f6' : 'transparent',
                  border: visibleLayers[layer.id] ? `1px solid ${layer.color}20` : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.boxShadow = `0 0 8px ${layer.glowColor}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = visibleLayers[layer.id] ? '#f3f4f6' : 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleLayers[layer.id]}
                  onChange={() => handleToggle(layer.id)}
                  style={{ marginRight: '8px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: '#374151', flex: 1, fontWeight: visibleLayers[layer.id] ? '500' : '400' }}>
                  {layer.label}
                </span>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: layer.color,
                    border: '2px solid white',
                    boxShadow: `0 0 6px ${layer.glowColor}, 0 2px 4px rgba(0,0,0,0.2)`,
                    backdropFilter: 'blur(2px)'
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LayerControl;
