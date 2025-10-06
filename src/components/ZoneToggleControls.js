// ZoneToggleControls.js - Toggle Controls for Zone Shading Layers
// Provides UI controls for toggling different zone types on/off

import React, { useState, useEffect } from 'react';

function ZoneToggleControls({ 
  onToggleZone, 
  onClearAllZones, 
  onShowAllZones,
  availableZones = {},
  isVisible = true 
}) {
  const [zoneStates, setZoneStates] = useState({
    foodDeserts: true,
    interventionSites: true,
    overlaps: true,
    allZones: true
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Update zone states when available zones change
  useEffect(() => {
    const newStates = {
      foodDeserts: availableZones.foodDeserts || false,
      interventionSites: availableZones.interventionSites || false,
      overlaps: availableZones.overlaps || false,
      allZones: (availableZones.foodDeserts || availableZones.interventionSites || availableZones.overlaps) || false
    };
    setZoneStates(newStates);
  }, [availableZones]);

  const handleToggle = (zoneType) => {
    const newState = !zoneStates[zoneType];
    setZoneStates(prev => ({
      ...prev,
      [zoneType]: newState
    }));
    
    if (onToggleZone) {
      onToggleZone(zoneType, newState);
    }
  };

  const handleShowAll = () => {
    const newStates = {
      foodDeserts: true,
      interventionSites: true,
      overlaps: true,
      allZones: true
    };
    setZoneStates(newStates);
    
    if (onShowAllZones) {
      onShowAllZones();
    }
  };

  const handleClearAll = () => {
    const newStates = {
      foodDeserts: false,
      interventionSites: false,
      overlaps: false,
      allZones: false
    };
    setZoneStates(newStates);
    
    if (onClearAllZones) {
      onClearAllZones();
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 1000,
      minWidth: '200px',
      maxWidth: '300px'
    }}>
      {/* Header */}
      <div 
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '20px',
            height: '20px',
            backgroundColor: '#3b82f6',
            borderRadius: '4px',
            marginRight: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Z</span>
          </div>
          <span style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>
            Zone Layers
          </span>
        </div>
        <div style={{
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          ▼
        </div>
      </div>

      {/* Controls */}
      {isExpanded && (
        <div style={{ padding: '12px 16px' }}>
          {/* Individual Zone Toggles */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#6b7280', 
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Zone Types
            </div>
            
            {/* Food Deserts */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: zoneStates.foodDeserts ? '#dc2626' : '#e5e7eb',
                  borderRadius: '2px',
                  marginRight: '8px'
                }}></div>
                <span style={{ fontSize: '13px', color: '#374151' }}>
                  Food Deserts
                </span>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
                <input
                  type="checkbox"
                  checked={zoneStates.foodDeserts}
                  onChange={() => handleToggle('foodDeserts')}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: zoneStates.foodDeserts ? '#dc2626' : '#d1d5db',
                  transition: '0.3s',
                  borderRadius: '20px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '16px',
                    width: '16px',
                    right: zoneStates.foodDeserts ? '2px' : '18px',
                    bottom: '2px',
                    backgroundColor: 'white',
                    transition: '0.3s',
                    borderRadius: '50%'
                  }}></span>
                </span>
              </label>
            </div>

            {/* Intervention Sites */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: zoneStates.interventionSites ? '#16a34a' : '#e5e7eb',
                  borderRadius: '2px',
                  marginRight: '8px'
                }}></div>
                <span style={{ fontSize: '13px', color: '#374151' }}>
                  Intervention Sites
                </span>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
                <input
                  type="checkbox"
                  checked={zoneStates.interventionSites}
                  onChange={() => handleToggle('interventionSites')}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: zoneStates.interventionSites ? '#16a34a' : '#d1d5db',
                  transition: '0.3s',
                  borderRadius: '20px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '16px',
                    width: '16px',
                    right: zoneStates.interventionSites ? '2px' : '18px',
                    bottom: '2px',
                    backgroundColor: 'white',
                    transition: '0.3s',
                    borderRadius: '50%'
                  }}></span>
                </span>
              </label>
            </div>

            {/* Overlaps */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: zoneStates.overlaps ? '#8b5cf6' : '#e5e7eb',
                  borderRadius: '2px',
                  marginRight: '8px'
                }}></div>
                <span style={{ fontSize: '13px', color: '#374151' }}>
                  Conflict Zones
                </span>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
                <input
                  type="checkbox"
                  checked={zoneStates.overlaps}
                  onChange={() => handleToggle('overlaps')}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: zoneStates.overlaps ? '#8b5cf6' : '#d1d5db',
                  transition: '0.3s',
                  borderRadius: '20px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '16px',
                    width: '16px',
                    right: zoneStates.overlaps ? '2px' : '18px',
                    bottom: '2px',
                    backgroundColor: 'white',
                    transition: '0.3s',
                    borderRadius: '50%'
                  }}></span>
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleShowAll}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#059669',
                backgroundColor: '#ecfdf5',
                border: '1px solid #d1fae5',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#d1fae5';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#ecfdf5';
              }}
            >
              Show All
            </button>
            <button
              onClick={handleClearAll}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#fecaca';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#fef2f2';
              }}
            >
              Clear All
            </button>
          </div>

          {/* Zone Legend */}
          <div style={{ 
            marginTop: '12px', 
            padding: '8px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#6b7280'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Legend:</div>
            <div style={{ marginBottom: '2px' }}>
              <span style={{ color: '#dc2626' }}>■</span> Food Deserts
            </div>
            <div style={{ marginBottom: '2px' }}>
              <span style={{ color: '#16a34a' }}>■</span> Intervention Sites
            </div>
            <div>
              <span style={{ color: '#8b5cf6' }}>■</span> Conflict Zones
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ZoneToggleControls;
