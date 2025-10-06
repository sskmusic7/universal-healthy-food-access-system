// App.js - Main Application Component
// Integrates City Selector, Data Fetcher, Map, and Metrics Panel

import React, { useState } from 'react';
import CitySelector from './components/CitySelector';
import Map from './components/Map';
import MetricsPanel from './components/MetricsPanel';
import AISolutionPanel from './components/AISolutionPanel';
import AlgorithmAnalysisPanel from './components/AlgorithmAnalysisPanel';
import OverlapAnalysisPanel from './components/OverlapAnalysisPanel';
import { fetchAllCityData } from './dataFetchers';
import './App.css';

function App() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityData, setCityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle city selection from CitySelector
  async function handleCitySelected(cityInfo) {
    setSelectedCity(cityInfo);
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching data for:', cityInfo.name);
      
      // Fetch all data for the selected city
      const data = await fetchAllCityData(cityInfo, {
        includeFoodOutlets: true,
        includePower: true,
        includePopulation: true,    // NASA SEDAC Population Density
        includeNDVI: true,          // NASA MODIS NDVI
        includeLST: true,           // NASA MODIS LST
        includePrecipitation: true, // NASA GPM IMERG
        includeNighttimeLights: true // NASA Black Marble
      });

      setCityData(data);
      setLoading(false);
      
      console.log('Data loaded successfully:', data);
    } catch (err) {
      console.error('Error fetching city data:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  // Reset to initial state
  function handleReset() {
    setSelectedCity(null);
    setCityData(null);
    setError(null);
  }

  return (
    <div className="App">
      {/* Header */}
      <header className="mobile-header" style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '16px 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              margin: 0,
              fontWeight: '600'
            }}>
              Universal Healthy Food Access System
            </h1>
            <p style={{ 
              fontSize: '14px', 
              margin: '4px 0 0 0',
              color: '#bdc3c7'
            }}>
              NASA Space Apps Challenge - Analyzing food access patterns worldwide
            </p>
          </div>
          
          {selectedCity && (
            <button
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content" style={{ 
        display: 'flex', 
        height: 'calc(100vh - 80px)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Left Panel - Controls */}
        <div className="left-panel" style={{
          width: '350px',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #dee2e6',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* City Selector */}
          <div style={{ flex: '0 0 auto' }}>
            <CitySelector onCitySelected={handleCitySelected} />
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              margin: '0 20px 20px 20px',
              padding: '12px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c00',
              fontSize: '13px'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Metrics Panel */}
          <div style={{ flex: '1 1 auto', padding: '0 20px 20px 20px' }}>
            <MetricsPanel 
              cityData={selectedCity}
              foodOutlets={cityData?.data?.foodOutlets}
              nasaPowerData={cityData?.data?.power}
              nasaPrecipitationData={cityData?.data?.precipitation}
              nasaNighttimeData={cityData?.data?.nighttimeLights}
              nasaLSTData={cityData?.data?.lst}
              nasaPopulationData={cityData?.data?.population}
            />
            
            {/* AI Solution Panel */}
            <AISolutionPanel 
              aiSolution={cityData?.data?.aiSolution}
              cityData={cityData}
            />
            
      {/* Algorithm Analysis Panel */}
      <AlgorithmAnalysisPanel
        algorithmAnalysis={cityData?.data?.algorithmAnalysis}
        cityData={cityData}
      />

      {/* Overlap Analysis Panel */}
      <OverlapAnalysisPanel
        overlapAnalysis={cityData?.data?.algorithmAnalysis?.overlapAnalysis}
        cityData={cityData}
      />
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="right-panel" style={{ 
          flex: 1, 
          position: 'relative',
          backgroundColor: '#f8f9fa'
        }}>
          <Map 
            cityData={selectedCity}
            foodOutlets={cityData?.data?.foodOutlets}
            loading={loading}
            algorithmAnalysis={cityData?.algorithmAnalysis}
            overlapAnalysis={cityData?.overlapAnalysis}
          />
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#34495e',
        color: '#bdc3c7',
        padding: '12px 20px',
        fontSize: '12px',
        textAlign: 'center',
        borderTop: '1px solid #2c3e50'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            Data sources: OpenStreetMap (Nominatim, Overpass) • NASA POWER API
          </div>
          <div>
            Built for NASA Space Apps Challenge 2024
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
