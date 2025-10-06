// OptimalPlacementPanel.js - UI component for optimal intervention placement recommendations
// Integrates soil analysis and comprehensive placement optimization

import React, { useState } from 'react';
import { OptimalPlacementEngine } from '../optimization/OptimalPlacementEngine';
import { assessSoilQuality } from '../utils/soilDataIntegration';

function OptimalPlacementPanel(props = {}) {
  const { cityData = null, foodOutlets = [], climateData = null, onPlacementsFound = () => {} } = props;
  const [placements, setPlacements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(['all']);
  const [showDetails, setShowDetails] = useState({});

  // Intervention type options
  const interventionOptions = [
    { value: 'all', label: 'All Types', icon: '🎯' },
    { value: 'FARMERS_MARKET', label: 'Farmers Market', icon: '🌾' },
    { value: 'SUPERMARKET', label: 'Supermarket', icon: '🏪' },
    { value: 'URBAN_FARM', label: 'Urban Farm', icon: '🌱' },
    { value: 'COMMUNITY_GARDEN', label: 'Community Garden', icon: '🥬' },
    { value: 'FOOD_HUB', label: 'Food Hub', icon: '📦' },
    { value: 'MOBILE_MARKET', label: 'Mobile Market', icon: '🚐' },
    { value: 'COMMUNITY_KITCHEN', label: 'Community Kitchen', icon: '👨‍🍳' },
    { value: 'FOOD_PANTRY', label: 'Food Pantry', icon: '🥫' },
    { value: 'VERTICAL_FARM', label: 'Vertical Farm', icon: '🏢' },
    { value: 'AQUAPONICS', label: 'Aquaponics', icon: '🐟' }
  ];

  // Run optimization analysis
  async function runOptimization() {
    if (!cityData || !foodOutlets) {
      console.warn('Missing required data for optimization');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Starting optimal placement analysis...');

      // Initialize placement engine
      const engine = new OptimalPlacementEngine(
        cityData,
        foodOutlets,
        climateData,
        null // demographic data would go here
      );

      // Find optimal placements
      const results = await engine.findOptimalPlacements({
        gridResolution: 0.01, // ~1km cells
        maxSuggestions: 10,
        interventionTypes: selectedTypes[0] === 'all' ? 'all' : selectedTypes,
        priorityFactors: {
          equityWeight: 0.35,
          minCoverage: 0.75,
          maxClusterDistance: 2000
        }
      });

      setPlacements(results);

      // Notify parent component
      if (onPlacementsFound) {
        onPlacementsFound(results);
      }

      console.log('✅ Optimization complete:', results);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setLoading(false);
    }
  }

  // Check soil for a specific placement
  async function checkSoil(placement) {
    try {
      const soilData = await assessSoilQuality(placement.location, 100);
      console.log('Soil assessment for location:', soilData);

      // Update placement with soil data
      placement.soilAssessment = soilData;
      setPlacements({ ...placements }); // Trigger re-render

      return soilData;
    } catch (error) {
      console.error('Soil assessment failed:', error);
    }
  }

  // Toggle detail view for a placement
  function toggleDetails(index) {
    setShowDetails({
      ...showDetails,
      [index]: !showDetails[index]
    });
  }

  // Get priority badge color
  function getPriorityColor(priority) {
    const colors = {
      CRITICAL: '#dc2626',
      HIGH: '#f97316',
      MEDIUM: '#fbbf24',
      LOW: '#84cc16'
    };
    return colors[priority] || '#6b7280';
  }

  // Format currency
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  }

  if (!cityData) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Select a city to analyze optimal intervention placements
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '4px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '16px',
          margin: 0,
          color: '#2c3e50',
          fontWeight: '600'
        }}>
          🎯 Optimal Placement Analysis
        </h3>

        <button
          onClick={runOptimization}
          disabled={loading}
          style={{
            padding: '6px 12px',
            backgroundColor: loading ? '#6b7280' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {/* Intervention Type Selector */}
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '8px'
        }}>
          Select Intervention Types:
        </label>

        <select
          value={selectedTypes[0]}
          onChange={(e) => setSelectedTypes([e.target.value])}
          style={{
            width: '100%',
            padding: '6px',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
            fontSize: '13px'
          }}
        >
          {interventionOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {placements && (
        <div>
          {/* Summary Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              padding: '8px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <div style={{ color: '#0c4a6e', fontWeight: '500' }}>
                Population Served
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0369a1' }}>
                {placements.impact?.totalPopulationServed?.toLocaleString() || 0}
              </div>
            </div>

            <div style={{
              padding: '8px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #22c55e',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <div style={{ color: '#14532d', fontWeight: '500' }}>
                Food Desert Reduction
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#15803d' }}>
                {Math.round((placements.impact?.foodDesertReduction || 0) * 100)}%
              </div>
            </div>
          </div>

          {/* Placement List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {placements.placements?.map((placement, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '12px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}
              >
                {/* Placement Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '20px' }}>
                      {placement.icon || '📍'}
                    </span>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        {placement.name || placement.type}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#6b7280'
                      }}>
                        Score: {Math.round((placement.score || 0) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: getPriorityColor(placement.priority),
                      color: 'white',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {placement.priority}
                    </span>

                    <button
                      onClick={() => toggleDetails(index)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'white',
                        border: '1px solid #dee2e6',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      {showDetails[index] ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  <div>
                    📊 {placement.expectedImpact?.populationServed?.toLocaleString() || 0} people
                  </div>
                  <div>
                    💰 {formatCurrency(placement.implementation?.setupCost || 0)}
                  </div>
                  <div>
                    ⏱️ {placement.implementation?.timeframe || 'N/A'}
                  </div>
                </div>

                {/* Justification */}
                {placement.justification && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px',
                    backgroundColor: 'white',
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#495057'
                  }}>
                    <strong>Why here:</strong> {placement.justification}
                  </div>
                )}

                {/* Detailed View */}
                {showDetails[index] && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #dee2e6'
                  }}>
                    {/* Implementation Requirements */}
                    <div style={{ marginBottom: '12px' }}>
                      <h5 style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        marginBottom: '6px'
                      }}>
                        Implementation Requirements:
                      </h5>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '20px',
                        fontSize: '11px',
                        color: '#6b7280'
                      }}>
                        {placement.implementation?.requirements?.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Partners */}
                    {placement.implementation?.partners && (
                      <div style={{ marginBottom: '12px' }}>
                        <h5 style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          marginBottom: '6px'
                        }}>
                          Suggested Partners:
                        </h5>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '4px'
                        }}>
                          {placement.implementation.partners.map((partner, i) => (
                            <span
                              key={i}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#e7f3ff',
                                border: '1px solid #0ea5e9',
                                borderRadius: '3px',
                                fontSize: '10px'
                              }}
                            >
                              {partner}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Soil Check Button */}
                    {['URBAN_FARM', 'COMMUNITY_GARDEN', 'VERTICAL_FARM'].includes(placement.type) && (
                      <button
                        onClick={() => checkSoil(placement)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          marginTop: '8px'
                        }}
                      >
                        🧪 Check Soil Quality
                      </button>
                    )}

                    {/* Soil Assessment Results */}
                    {placement.soilAssessment && (
                      <div style={{
                        marginTop: '12px',
                        padding: '8px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fbbf24',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>
                        <strong>Soil Quality:</strong> {placement.soilAssessment.suitability.category}
                        <br />
                        <strong>pH:</strong> {placement.soilAssessment.soilProperties.pH}
                        <br />
                        <strong>Contamination:</strong> {placement.soilAssessment.contamination.risk}
                        <br />
                        <strong>Recommendations:</strong>
                        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                          {placement.soilAssessment.recommendations?.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total Investment Needed */}
          {placements.impact?.totalInvestmentNeeded && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#78350f'
              }}>
                Total Investment Needed
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#92400e'
              }}>
                {formatCurrency(placements.impact.totalInvestmentNeeded)}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#92400e',
                marginTop: '4px'
              }}>
                {placements.impact.totalJobsCreated} jobs created
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!placements && !loading && (
        <div style={{
          padding: '16px',
          backgroundColor: '#e7f3ff',
          border: '1px solid #0ea5e9',
          borderRadius: '4px',
          fontSize: '12px',
          lineHeight: '1.6',
          color: '#0c4a6e'
        }}>
          <strong>How it works:</strong>
          <br />
          • Analyzes vacant lots, parking lots, and underutilized spaces
          <br />
          • Evaluates soil quality, climate suitability, and contamination
          <br />
          • Considers population density, vulnerability, and equity
          <br />
          • Suggests optimal locations for maximum impact
          <br />
          • Provides implementation costs and requirements
        </div>
      )}
    </div>
  );
}

export default OptimalPlacementPanel;