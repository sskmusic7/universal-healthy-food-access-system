// Algorithm Analysis Panel
// Displays evidence-based food desert identification and intervention site optimization

import React, { useState } from 'react';

function AlgorithmAnalysisPanel({ algorithmAnalysis, cityData }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!algorithmAnalysis) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>
          🔬 Algorithm Analysis
        </h3>
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <p>Algorithm analysis will appear here after processing city data.</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            Evidence-based food desert identification and intervention site optimization
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'deserts', label: 'Food Deserts', icon: '🏜️' },
    { id: 'interventions', label: 'Intervention Sites', icon: '🎯' },
    { id: 'recommendations', label: 'Recommendations', icon: '💡' },
    { id: 'evidence', label: 'Evidence', icon: '🔍' }
  ];

  const renderOverview = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Analysis Overview</h4>
      
      {/* Data Reliability */}
      <div style={{
        backgroundColor: '#e8f5e8',
        border: '1px solid #4caf50',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Data Reliability</h5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
          <div><strong>Reliability Score:</strong> {algorithmAnalysis.metadata?.dataReliability?.score || 'N/A'}/1.0</div>
          <div><strong>Level:</strong> {algorithmAnalysis.metadata?.dataReliability?.level || 'N/A'}</div>
          <div><strong>Data Sources:</strong> {algorithmAnalysis.metadata?.dataReliability?.factors || 0}</div>
          <div><strong>Algorithm Version:</strong> {algorithmAnalysis.metadata?.algorithmVersion || 'N/A'}</div>
        </div>
      </div>

      {/* Food Desert Summary */}
      {algorithmAnalysis.analysis?.foodDeserts && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#856404' }}>Food Desert Analysis</h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div><strong>Total Areas Analyzed:</strong> {algorithmAnalysis.analysis.foodDeserts.totalAreas || 0}</div>
            <div><strong>Critical Deserts:</strong> {algorithmAnalysis.analysis.foodDeserts.statistics?.criticalDeserts || 0}</div>
            <div><strong>Severe Deserts:</strong> {algorithmAnalysis.analysis.foodDeserts.statistics?.severeDeserts || 0}</div>
            <div><strong>Desert Percentage:</strong> {algorithmAnalysis.analysis.foodDeserts.statistics?.desertPercentage || '0'}%</div>
            <div><strong>Avg Access Score:</strong> {algorithmAnalysis.analysis.foodDeserts.statistics?.averageAccessScore || 'N/A'}</div>
            <div><strong>Critical Percentage:</strong> {algorithmAnalysis.analysis.foodDeserts.statistics?.criticalPercentage || '0'}%</div>
          </div>
        </div>
      )}

      {/* Intervention Sites Summary */}
      {algorithmAnalysis.analysis?.interventionSites && (
        <div style={{
          backgroundColor: '#d1ecf1',
          border: '1px solid #0ea5e9',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#0c4a6e' }}>Intervention Site Analysis</h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '13px' }}>
            {Object.entries(algorithmAnalysis.analysis.interventionSites).map(([type, data]) => (
              <div key={type} style={{ 
                padding: '8px', 
                backgroundColor: 'white', 
                borderRadius: '4px',
                border: '1px solid #0ea5e9'
              }}>
                <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '4px' }}>
                  {type.replace('_', ' ')}
                </div>
                <div>Sites: {data.totalSites}</div>
                <div>Avg Score: {data.averageScore?.toFixed(2) || 'N/A'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFoodDeserts = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Food Desert Identification</h4>
      
      {algorithmAnalysis.analysis?.foodDeserts?.foodDeserts?.map((desert, index) => (
        <div key={index} style={{
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px',
          backgroundColor: desert.classification === 'critical' ? '#ffebee' : '#fff3e0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h5 style={{ margin: '0', color: '#333' }}>
              {desert.classification === 'critical' ? '🔴 Critical' : '🟠 Severe'} Food Desert
            </h5>
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold',
              backgroundColor: desert.classification === 'critical' ? '#dc3545' : '#fd7e14',
              color: 'white'
            }}>
              Score: {desert.accessScore}
            </span>
          </div>
          
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            <strong>Coordinates:</strong> {desert.coordinates.lat.toFixed(4)}, {desert.coordinates.lng.toFixed(4)}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '8px' }}>
            <div><strong>Distance:</strong> {desert.factors.distance}</div>
            <div><strong>Heat Penalty:</strong> {desert.factors.heatPenalty}</div>
            <div><strong>Demand:</strong> {desert.factors.demand}</div>
            <div><strong>Deprivation:</strong> {desert.factors.deprivation}</div>
          </div>
          
          {desert.recommendations?.length > 0 && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              <strong>Recommendations:</strong>
              {desert.recommendations.map((rec, recIndex) => (
                <div key={recIndex} style={{ marginTop: '4px' }}>
                  • {rec.message}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderInterventionSites = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Intervention Site Optimization</h4>
      
      {Object.entries(algorithmAnalysis.analysis?.interventionSites || {}).map(([type, data]) => (
        <div key={type} style={{
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          backgroundColor: '#f8f9fa'
        }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#333', textTransform: 'capitalize' }}>
            {type.replace('_', ' ')} Sites
          </h5>
          
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            <strong>Total Sites:</strong> {data.totalSites} | 
            <strong> Average Score:</strong> {data.averageScore?.toFixed(2) || 'N/A'} | 
            <strong> Top Sites:</strong> {data.topSites?.length || 0}
          </div>
          
          {data.topSites?.slice(0, 3).map((site, index) => (
            <div key={index} style={{
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              padding: '8px',
              marginBottom: '8px',
              backgroundColor: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>Site {index + 1}</span>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  backgroundColor: site.suitability === 'excellent' ? '#d4edda' : 
                                 site.suitability === 'suitable' ? '#fff3cd' : '#f8d7da',
                  color: site.suitability === 'excellent' ? '#155724' : 
                        site.suitability === 'suitable' ? '#856404' : '#721c24'
                }}>
                  {site.suitability} ({site.compositeScore})
                </span>
              </div>
              
              <div style={{ fontSize: '11px', color: '#666' }}>
                <div><strong>Coordinates:</strong> {site.siteId}</div>
                <div><strong>Confidence:</strong> {site.confidence}</div>
              </div>
              
              {site.recommendations?.length > 0 && (
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                  <strong>Actions:</strong> {site.recommendations[0]?.message}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderRecommendations = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Strategic Recommendations</h4>
      
      {algorithmAnalysis.analysis?.recommendations?.categories?.map((rec, index) => (
        <div key={index} style={{
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px',
          backgroundColor: rec.priority === 'critical' ? '#ffebee' : 
                          rec.priority === 'high' ? '#fff3e0' : '#f8f9fa'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h5 style={{ margin: '0', color: '#333' }}>{rec.message}</h5>
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold',
              backgroundColor: rec.priority === 'critical' ? '#dc3545' : 
                              rec.priority === 'high' ? '#fd7e14' : '#6c757d',
              color: 'white'
            }}>
              {rec.priority.toUpperCase()}
            </span>
          </div>
          
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            <strong>NASA Evidence:</strong> {rec.nasaEvidence}
          </div>
          
          <div style={{ fontSize: '11px' }}>
            <strong>Recommended Actions:</strong>
            {rec.actions?.map((action, actionIndex) => (
              <div key={actionIndex} style={{ marginTop: '4px' }}>
                • {action}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderEvidence = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Evidence & Methodology</h4>
      
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#495057' }}>Algorithm Methodology</h5>
        <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
          <p><strong>Food Desert Identification:</strong> Multi-factor scoring combining distance to healthy food outlets, heat exposure penalties (NASA LST), population demand (NASA SEDAC), and socioeconomic factors.</p>
          <p><strong>Intervention Site Optimization:</strong> Evidence-based scoring using NASA Earth observation data for vegetation suitability (NDVI), solar irradiance (POWER), water availability (Precipitation), and population density (SEDAC).</p>
          <p><strong>Data Integration:</strong> Transparent combination of NASA satellite data with local food outlet and demographic information for comprehensive urban planning support.</p>
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#e8f5e8',
        border: '1px solid #4caf50',
        borderRadius: '6px',
        padding: '12px'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Data Sources & Reliability</h5>
        <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
          <p><strong>NASA Earth Observation Data:</strong> MODIS LST, SEDAC Population, GPM Precipitation, MODIS NDVI, Black Marble Nighttime Lights, POWER Solar</p>
          <p><strong>OpenStreetMap Data:</strong> Food outlet locations and classifications</p>
          <p><strong>Reliability Assessment:</strong> Each analysis includes confidence levels and data quality indicators for transparent decision-making.</p>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'deserts': return renderFoodDeserts();
      case 'interventions': return renderInterventionSites();
      case 'recommendations': return renderRecommendations();
      case 'evidence': return renderEvidence();
      default: return renderOverview();
    }
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '16px'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>
        🔬 Algorithm Analysis
      </h3>
      
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginBottom: '16px',
        borderBottom: '1px solid #e0e0e0',
        paddingBottom: '8px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: activeTab === tab.id ? '#007bff' : '#f8f9fa',
              color: activeTab === tab.id ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}

export default AlgorithmAnalysisPanel;


