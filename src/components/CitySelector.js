// CitySelector.js - City Selection Component
// Supports both text search and map click selection

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeCity } from '../dataFetchers';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function CitySelector(props = {}) {
  const { onCitySelected = () => {} } = props;
  const [mode, setMode] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Initialize Leaflet map for draw mode
  useEffect(() => {
    if (mode === 'draw' && mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([51.505, -0.09], 6);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Add click handler for boundary selection
      mapInstanceRef.current.on('click', (e) => {
        const cityData = {
          name: 'Custom Location',
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          boundingBox: [
            e.latlng.lat - 0.1,
            e.latlng.lat + 0.1,
            e.latlng.lng - 0.1,
            e.latlng.lng + 0.1
          ],
          source: 'manual'
        };
        onCitySelected(cityData);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mode, onCitySelected]);

  async function handleSearch(query = searchQuery) {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    setError(null);

    try {
      const cityData = await geocodeCity(trimmed);
      onCitySelected(cityData);
      setSearching(false);
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message);
      setSearching(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ 
        fontSize: '18px', 
        marginBottom: '16px',
        color: '#2c3e50',
        fontWeight: '600'
      }}>
        Select City
      </h2>
      
      {/* Mode Selection */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '16px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '12px'
      }}>
        <button 
          onClick={() => setMode('search')}
          style={{
            padding: '8px 16px',
            backgroundColor: mode === 'search' ? '#007bff' : '#f8f9fa',
            color: mode === 'search' ? 'white' : '#6c757d',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          Search
        </button>
        <button 
          onClick={() => setMode('draw')}
          style={{
            padding: '8px 16px',
            backgroundColor: mode === 'draw' ? '#007bff' : '#f8f9fa',
            color: mode === 'draw' ? 'white' : '#6c757d',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          Click Map
        </button>
      </div>

      {/* Search Mode */}
      {mode === 'search' && (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '8px',
              color: '#495057'
            }}>
              City Name
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Hull, Nairobi, Phoenix"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '8px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <button 
            onClick={handleSearch} 
            disabled={searching || !searchQuery.trim()}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: searching || !searchQuery.trim() ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: searching || !searchQuery.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
          >
            {searching ? 'Searching...' : 'Find City'}
          </button>

          {/* Error Display */}
          {error && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c00',
              fontSize: '13px'
            }}>
              Error: {error}
            </div>
          )}

          {/* Search Tips */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#e7f3ff',
            border: '1px solid #0ea5e9',
            borderRadius: '4px',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#0c4a6e'
          }}>
            <strong>Search Tips:</strong><br/>
            • Try full city names: "Kingston upon Hull"<br/>
            • Include country for clarity: "Hull, England"<br/>
            • Works worldwide: "Nairobi, Kenya"
          </div>
        </div>
      )}

      {/* Draw Mode */}
      {mode === 'draw' && (
        <div>
          <div style={{
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#856404'
          }}>
            <strong>Click anywhere on the map</strong> to select a location for analysis.
          </div>
          
          <div 
            ref={mapRef} 
            style={{ 
              height: '300px', 
              width: '100%',
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}
          />
        </div>
      )}

      {/* Recent Searches */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <h4 style={{ 
          fontSize: '14px', 
          margin: '0 0 8px 0',
          color: '#495057'
        }}>
          Quick Test Cities
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {['Hull', 'Nairobi', 'Phoenix', 'London', 'Tokyo'].map(city => (
            <button
              key={city}
              onClick={() => {
                setSearchQuery(city);
                setMode('search');
                handleSearch(city);
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: 'white',
                color: '#007bff',
                border: '1px solid #007bff',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CitySelector;
