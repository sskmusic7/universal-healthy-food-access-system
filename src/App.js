// App.js - Main Application Component
// Integrates City Selector, Data Fetcher, Map, and Metrics Panel

import React, { useState, useCallback, useMemo, lazy, Suspense, useTransition } from 'react';
import CitySelector from './components/CitySelector';
import { fetchAllCityData } from './dataFetchers';
import './App.css';
import { generateAiSolutionPlan } from './utils/aiSolutionService';

// Lazy load heavy components for better initial load performance
const Map = lazy(() => import('./components/Map'));
const MetricsPanel = lazy(() => import('./components/MetricsPanel'));
const OptimalPlacementPanel = lazy(() => import('./components/OptimalPlacementPanel'));

// Loading fallback component for lazy-loaded components
function ComponentLoader({ label, fullScreen = false }) {
  return (
    <div style={{
      height: fullScreen ? '100%' : '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: fullScreen ? '#f8f9fa' : 'transparent'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '30px',
          height: '30px',
          border: '3px solid #f3f4f6',
          borderTop: '3px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px'
        }}></div>
        <div style={{ fontSize: '13px', color: '#6c757d' }}>
          Loading {label}...
        </div>
      </div>
    </div>
  );
}

function App() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityData, setCityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [optimalPlacements, setOptimalPlacements] = useState(null);
  const [aiPlan, setAiPlan] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Handle city selection from CitySelector (memoized with async transition)
  const handleCitySelected = useCallback(async (cityInfo) => {
    setSelectedCity(cityInfo);
    setOptimalPlacements(null);
    setAiPlan(null);
    setAiError(null);
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching data for:', cityInfo.name);

      // Fetch all data for the selected city
      const data = await fetchAllCityData(cityInfo, {
        includeFoodOutlets: true,
        includePower: true,
        includeNASAData: false // Set to true when you have NASA auth
      });

      // Use transition for non-blocking UI updates
      startTransition(() => {
        setCityData(data);
        setLoading(false);
      });

      console.log('Data loaded successfully:', data);
    } catch (err) {
      console.error('Error fetching city data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [startTransition]);

  // Memoize derived data to avoid recalculations
  const foodOutletsData = useMemo(() => cityData?.data?.foodOutlets, [cityData]);
  const nasaPowerData = useMemo(() => cityData?.data?.power, [cityData]);

  // Handle optimal placement results (memoized)
  const handlePlacementsFound = useCallback((placements) => {
    setOptimalPlacements(placements);
    console.log('Optimal placements received:', placements);
  }, []);

  const handleGenerateAiPlan = useCallback(async () => {
    if (!selectedCity) {
      setAiError('Select a city before generating an AI plan.');
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const plan = await generateAiSolutionPlan({
        city: selectedCity,
        placements: optimalPlacements?.placements || [],
        climate: nasaPowerData,
        foodOutlets: foodOutletsData || []
      });

      setAiPlan(plan);
    } catch (err) {
      console.error('AI solution generation failed:', err);
      setAiError(err.message || 'AI solution generation failed');
    } finally {
      setAiLoading(false);
    }
  }, [selectedCity, optimalPlacements, nasaPowerData, foodOutletsData]);

  // Reset to initial state (memoized)
  const handleReset = useCallback(() => {
    // Clear city data to free memory
    setSelectedCity(null);
    setCityData(null);
    setOptimalPlacements(null);
    setError(null);
    setAiPlan(null);
    setAiError(null);
  }, []);

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
          <div style={{ flex: '0 1 auto', padding: '0 20px 20px 20px' }}>
            <Suspense fallback={<ComponentLoader label="Metrics Panel" />}>
              <MetricsPanel
                cityData={selectedCity}
                foodOutlets={foodOutletsData}
                nasaPowerData={nasaPowerData}
                aiPlan={aiPlan}
                aiLoading={aiLoading}
                aiError={aiError}
                onGenerateAiPlan={handleGenerateAiPlan}
              />
            </Suspense>
          </div>

          {/* Optimal Placement Panel */}
          <div style={{ flex: '0 1 auto', padding: '0 20px 20px 20px' }}>
            <Suspense fallback={<ComponentLoader label="Placement Panel" />}>
              <OptimalPlacementPanel
                cityData={selectedCity}
                foodOutlets={foodOutletsData}
                climateData={nasaPowerData}
                onPlacementsFound={handlePlacementsFound}
              />
            </Suspense>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="right-panel" style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#f8f9fa'
        }}>
          <Suspense fallback={<ComponentLoader label="Map" fullScreen />}>
            <Map
              cityData={selectedCity}
              foodOutlets={foodOutletsData}
              optimalPlacements={optimalPlacements}
              aiSolutions={aiPlan}
              loading={loading || isPending}
            />
          </Suspense>
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
            Built for NASA Space Apps Challenge 2025
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
