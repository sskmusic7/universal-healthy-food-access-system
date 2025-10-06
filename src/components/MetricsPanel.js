// MetricsPanel.js - Food Outlet Statistics Display
// Shows classification breakdown and key metrics

import React from 'react';

function MetricsPanel(props = {}) {
  const {
    cityData = null,
    foodOutlets = [],
    nasaPowerData = null,
    aiPlan = null,
    aiLoading = false,
    aiError = null,
    onGenerateAiPlan = () => {}
  } = props;
  if (!cityData || !foodOutlets) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        textAlign: 'center',
        color: '#6c757d'
      }}>
        <p style={{ fontSize: '14px', margin: 0 }}>
          Select a city to view food access metrics
        </p>
      </div>
    );
  }

  // Calculate outlet classifications
  const healthyOutlets = foodOutlets.filter(
    o => o.classification.label === 'Healthy Food Source'
  );
  
  const mixedOutlets = foodOutlets.filter(
    o => o.classification.label === 'Mixed Selection'
  );
  
  const unhealthyOutlets = foodOutlets.filter(
    o => o.classification.label === 'Unhealthy'
  );

  // Calculate food access score
  const totalOutlets = foodOutlets.length;
  const healthyScore = totalOutlets > 0 ? (healthyOutlets.length / totalOutlets) * 100 : 0;
  const mixedScore = totalOutlets > 0 ? (mixedOutlets.length / totalOutlets) * 100 : 0;
  const unhealthyScore = totalOutlets > 0 ? (unhealthyOutlets.length / totalOutlets) * 100 : 0;

  // Calculate average classification score
  const avgScore = foodOutlets.length > 0 
    ? foodOutlets.reduce((sum, outlet) => sum + outlet.classification.score, 0) / foodOutlets.length
    : 0;

  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '4px'
    }}>
      {/* Header */}
      <h3 style={{ 
        fontSize: '16px', 
        margin: '0 0 16px 0',
        color: '#2c3e50',
        fontWeight: '600'
      }}>
        Food Access Analysis
      </h3>

      {/* City Info */}
      <div style={{
        padding: '12px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        marginBottom: '16px'
      }}>
        <h4 style={{ 
          fontSize: '14px', 
          margin: '0 0 8px 0',
          color: '#495057'
        }}>
          {cityData.name}
        </h4>
        <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#6c757d' }}>
          <div>Lat: {cityData.lat.toFixed(4)}</div>
          <div>Lng: {cityData.lng.toFixed(4)}</div>
          <div>Total Outlets: <strong>{totalOutlets}</strong></div>
        </div>
      </div>

      {/* Classification Breakdown */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ 
          fontSize: '14px', 
          margin: '0 0 12px 0',
          color: '#495057'
        }}>
          Outlet Classification
        </h4>
        
        <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px',
            padding: '6px 8px',
            backgroundColor: '#f0f9ff',
            borderRadius: '3px',
            border: '1px solid #0ea5e9'
          }}>
            <span style={{ color: '#0d5e3a', fontWeight: '500' }}>
              ● Healthy Food Sources
            </span>
            <div>
              <strong>{healthyOutlets.length}</strong>
              <span style={{ color: '#6c757d', marginLeft: '4px' }}>
                ({healthyScore.toFixed(1)}%)
              </span>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px',
            padding: '6px 8px',
            backgroundColor: '#fffbeb',
            borderRadius: '3px',
            border: '1px solid #fbbf24'
          }}>
            <span style={{ color: '#fbbf24', fontWeight: '500' }}>
              ● Mixed Selection
            </span>
            <div>
              <strong>{mixedOutlets.length}</strong>
              <span style={{ color: '#6c757d', marginLeft: '4px' }}>
                ({mixedScore.toFixed(1)}%)
              </span>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px',
            padding: '6px 8px',
            backgroundColor: '#fef2f2',
            borderRadius: '3px',
            border: '1px solid #dc2626'
          }}>
            <span style={{ color: '#dc2626', fontWeight: '500' }}>
              ● Unhealthy Options
            </span>
            <div>
              <strong>{unhealthyOutlets.length}</strong>
              <span style={{ color: '#6c757d', marginLeft: '4px' }}>
                ({unhealthyScore.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Food Access Score */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ 
          fontSize: '14px', 
          margin: '0 0 8px 0',
          color: '#495057'
        }}>
          Food Access Score
        </h4>
        
        <div style={{
          padding: '12px',
          backgroundColor: avgScore >= 0.7 ? '#f0f9ff' : avgScore >= 0.4 ? '#fffbeb' : '#fef2f2',
          border: `1px solid ${avgScore >= 0.7 ? '#0ea5e9' : avgScore >= 0.4 ? '#fbbf24' : '#dc2626'}`,
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: avgScore >= 0.7 ? '#0d5e3a' : avgScore >= 0.4 ? '#fbbf24' : '#dc2626',
            marginBottom: '4px'
          }}>
            {(avgScore * 100).toFixed(1)}%
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#6c757d',
            fontWeight: '500'
          }}>
            {avgScore >= 0.7 ? 'Good Access' : avgScore >= 0.4 ? 'Moderate Access' : 'Limited Access'}
          </div>
        </div>
      </div>

      {/* NASA Climate Data */}
      {nasaPowerData && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ 
            fontSize: '14px', 
            margin: '0 0 8px 0',
            color: '#495057'
          }}>
            Climate Data (NASA POWER)
          </h4>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '12px',
            lineHeight: '1.6'
          }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>Solar Irradiance:</strong> {nasaPowerData.data.ALLSKY_SFC_SW_DWN?.mean?.toFixed(2)} kW-hr/m²/day
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>Avg Temperature:</strong> {nasaPowerData.data.T2M?.mean?.toFixed(1)}°C
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>Precipitation:</strong> {nasaPowerData.data.PRECTOTCORR?.mean?.toFixed(1)} mm/day
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: '#6c757d',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid #dee2e6'
            }}>
              Data from NASA POWER API (last 12 months)
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <button
          onClick={onGenerateAiPlan}
          disabled={aiLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: aiLoading ? '#6b7280' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: aiLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            transition: 'background-color 0.2s'
          }}
        >
          {aiLoading ? 'Generating...' : 'Generate AI Solution Map'}
        </button>

        {aiError && (
          <div style={{
            marginBottom: '8px',
            padding: '6px 8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#b91c1c'
          }}>
            {aiError}
          </div>
        )}
        
        <button
          onClick={() => {
            console.log('City Data:', cityData);
            console.log('Food Outlets:', foodOutlets);
            console.log('NASA Power Data:', nasaPowerData);
          }}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: 'white',
            color: '#007bff',
            border: '1px solid #007bff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s'
          }}
        >
          View Raw Data (Console)
        </button>
      </div>

      {/* AI Solution Plan */}
      {aiPlan && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '4px'
        }}>
          <h4 style={{
            fontSize: '14px',
            margin: '0 0 8px 0',
            color: '#0c4a6e'
          }}>
            🤖 AI Strategy Overview
          </h4>

          <div style={{
            fontSize: '12px',
            color: '#0f172a',
            marginBottom: '8px'
          }}>
            {aiPlan.summary}
          </div>

          {aiPlan.recommendations?.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#0369a1',
                marginBottom: '4px'
              }}>
                Priority Sites
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: '18px',
                fontSize: '12px',
                color: '#0f172a'
              }}>
                {aiPlan.recommendations.map((rec, index) => (
                  <li key={index} style={{ marginBottom: '6px' }}>
                    <strong>{rec.title || rec.interventionType}</strong>
                    {rec.priority ? ` (${rec.priority})` : ''}
                    <br />
                    <span style={{ color: '#475569' }}>
                      {rec.rationale}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiPlan.implementationRoadmap?.length > 0 && (
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#0369a1',
                marginBottom: '4px'
              }}>
                Implementation Roadmap
              </div>
              <div style={{ fontSize: '12px', color: '#0f172a', display: 'grid', gap: '6px' }}>
                {aiPlan.implementationRoadmap.map((phase, index) => (
                  <div key={index} style={{
                    backgroundColor: 'white',
                    border: '1px solid #bae6fd',
                    borderRadius: '4px',
                    padding: '6px'
                  }}>
                    <div style={{ fontWeight: '600', color: '#0c4a6e' }}>
                      {phase.phase} — {phase.duration}
                    </div>
                    <div style={{ color: '#475569', marginBottom: '4px' }}>
                      {phase.focus}
                    </div>
                    {phase.milestones && (
                      <ul style={{
                        margin: 0,
                        paddingLeft: '18px',
                        color: '#64748b'
                      }}>
                        {phase.milestones.map((milestone, i) => (
                          <li key={i}>{milestone}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            fontSize: '10px',
            color: '#64748b',
            marginTop: '8px'
          }}>
            Generated {new Date(aiPlan.generatedAt).toLocaleString()}
          </div>
        </div>
      )}

      {/* Instructions */}
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
        <strong>Next Steps:</strong><br/>
        • Click "Generate AI Solution Map" to create urban farming recommendations<br/>
        • Use NASA climate data to identify optimal growing locations<br/>
        • Analyze food desert patterns for intervention planning
      </div>
    </div>
  );
}

export default MetricsPanel;
