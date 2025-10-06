// Overlap Analysis Panel
// Displays topological overlaps and conflict zones for public consultation

import React, { useState } from 'react';

function OverlapAnalysisPanel({ overlapAnalysis, cityData }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedZone, setSelectedZone] = useState(null);

  if (!overlapAnalysis) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>
          ⚖️ Overlap Analysis
        </h3>
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <p>Overlap analysis will appear here after processing city data.</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            Identifies conflicting planning zones requiring public consultation
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'conflicts', label: 'Conflict Zones', icon: '⚠️' },
    { id: 'public', label: 'Public Report', icon: '👥' },
    { id: 'council', label: 'Council Report', icon: '🏛️' },
    { id: 'map', label: 'Map View', icon: '🗺️' }
  ];

  const renderOverview = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Conflict Zone Summary</h4>
      
      {/* Summary Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>
            {overlapAnalysis.conflictSummary?.totalOverlaps || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Total Overlaps</div>
        </div>
        
        <div style={{
          backgroundColor: '#fff3e0',
          border: '1px solid #ff9800',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
            {overlapAnalysis.conflictSummary?.criticalConflicts || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Critical Conflicts</div>
        </div>
        
        <div style={{
          backgroundColor: '#e8f5e8',
          border: '1px solid #4caf50',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
            {overlapAnalysis.conflictSummary?.multiUseZones || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Multi-Use Zones</div>
        </div>
        
        <div style={{
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
            {overlapAnalysis.conflictSummary?.citizenConsultationRequired || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Need Consultation</div>
        </div>
      </div>

      {/* Conflict Types */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <h5 style={{ margin: '0 0 12px 0', color: '#495057' }}>Conflict Types Detected</h5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
          <div>🌱💧 Urban Farm + Water Scarcity</div>
          <div>🌱🔥 Urban Farm + Heat Barrier</div>
          <div>🏬🚚 Supermarket + Delivery Hub</div>
          <div>🏜️🔥 Food Desert + Heat Barrier</div>
          <div>🏬🌱 Supermarket + Urban Farm</div>
          <div>🏙️⚖️ Strategic Multi-Use Zones</div>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{
        backgroundColor: '#e8f5e8',
        border: '1px solid #4caf50',
        borderRadius: '6px',
        padding: '16px'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Recommended Next Steps</h5>
        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
          <li>Review conflict zones with local council</li>
          <li>Schedule public consultation meetings</li>
          <li>Create online voting platform for citizen input</li>
          <li>Develop final zoning recommendations based on public feedback</li>
        </ul>
      </div>
    </div>
  );

  const renderConflicts = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Detailed Conflict Analysis</h4>
      
      {overlapAnalysis.overlapZones?.map((zone, index) => (
        <div key={index} style={{
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px',
          backgroundColor: zone.conflictLevel === 'critical' ? '#ffebee' : 
                          zone.conflictLevel === 'high' ? '#fff3e0' : '#f8f9fa'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h5 style={{ margin: '0', color: '#333' }}>
              Zone {zone.areaId} - {zone.conflictLevel.toUpperCase()} CONFLICT
            </h5>
            <div style={{ display: 'flex', gap: '4px' }}>
              {zone.overlaps.map((overlap, i) => (
                <span key={i} style={{
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  backgroundColor: overlap.severity === 'critical' ? '#f44336' : 
                                 overlap.severity === 'high' ? '#ff9800' : '#4caf50',
                  color: 'white'
                }}>
                  {overlap.type.replace(/_/g, ' ').toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            <strong>Coordinates:</strong> {zone.coordinates?.lat?.toFixed(4)}, {zone.coordinates?.lng?.toFixed(4)}
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ fontSize: '12px' }}>Conflicts:</strong>
            {zone.overlaps.map((overlap, i) => (
              <div key={i} style={{ 
                fontSize: '11px', 
                marginTop: '4px',
                padding: '4px 8px',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #dee2e6'
              }}>
                <strong>{overlap.type.replace(/_/g, ' ').toUpperCase()}:</strong> {overlap.evidence}
              </div>
            ))}
          </div>
          
          {zone.recommendations?.length > 0 && (
            <div style={{ fontSize: '11px' }}>
              <strong>Recommendations:</strong>
              {zone.recommendations.map((rec, i) => (
                <div key={i} style={{ marginTop: '4px' }}>
                  • {rec.message}
                </div>
              ))}
            </div>
          )}
          
          {zone.citizenInput && (
            <div style={{
              marginTop: '8px',
              padding: '6px 8px',
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#1976d2'
            }}>
              <strong>⚠️ Citizen Input Required:</strong> This zone requires public consultation for final decision
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderPublicReport = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Public Consultation Report</h4>
      
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#495057' }}>Executive Summary</h5>
        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
          <p><strong>Total Conflict Zones:</strong> {overlapAnalysis.publicReport?.summary?.totalConflictZones || 0}</p>
          <p><strong>Critical Zones:</strong> {overlapAnalysis.publicReport?.summary?.criticalZones || 0}</p>
          <p><strong>Zones Requiring Public Input:</strong> {overlapAnalysis.publicReport?.summary?.citizenInputRequired || 0}</p>
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#e8f5e8',
        border: '1px solid #4caf50',
        borderRadius: '6px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>How This Affects You</h5>
        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
          <p>Some areas in your city have multiple good options for food access improvements. This means we need your input to decide which option would work best for your community.</p>
          <p><strong>Examples:</strong></p>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>An area might be great for both a community garden AND a new supermarket</li>
            <li>A location could work well for both a farmers market AND a food delivery hub</li>
            <li>Some zones need both food access improvements AND heat protection</li>
          </ul>
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '6px',
        padding: '16px'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#856404' }}>Next Steps for Citizens</h5>
        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
          <li>Attend public consultation meetings (dates TBA)</li>
          <li>Participate in online voting for your preferred options</li>
          <li>Submit written comments to the planning department</li>
          <li>Join community focus groups for detailed discussions</li>
        </ul>
      </div>
    </div>
  );

  const renderCouncilReport = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Technical Council Report</h4>
      
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#495057' }}>Executive Summary</h5>
        <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
          <p><strong>Total Overlaps:</strong> {overlapAnalysis.councilReport?.executiveSummary?.totalOverlaps || 0}</p>
          <p><strong>Critical Conflicts:</strong> {overlapAnalysis.councilReport?.executiveSummary?.criticalConflicts || 0}</p>
          <p><strong>Multi-Use Zones:</strong> {overlapAnalysis.councilReport?.executiveSummary?.multiUseZones || 0}</p>
          <p><strong>Citizen Consultation Required:</strong> {overlapAnalysis.councilReport?.executiveSummary?.citizenConsultationRequired || 0}</p>
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '6px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>Immediate Actions Required</h5>
        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '12px', lineHeight: '1.6' }}>
          <li>Address critical food desert + heat barrier zones immediately</li>
          <li>Implement emergency food distribution in critical zones</li>
          <li>Begin public consultation process for multi-use zones</li>
        </ul>
      </div>
      
      <div style={{
        backgroundColor: '#e8f5e8',
        border: '1px solid #4caf50',
        borderRadius: '6px',
        padding: '16px'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Long-term Planning Recommendations</h5>
        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '12px', lineHeight: '1.6' }}>
          <li>Establish comprehensive food access master plan</li>
          <li>Implement sustainable water management systems</li>
          <li>Create adaptive zoning framework for future conflicts</li>
        </ul>
      </div>
    </div>
  );

  const renderMapView = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Conflict Zone Map</h4>
      
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🗺️</div>
        <p style={{ margin: '0', color: '#666' }}>Interactive map view coming soon</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
          This will show conflict zones overlaid on the city map with color-coded conflict types
        </p>
      </div>
      
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '6px',
        padding: '12px'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#856404' }}>Map Legend</h5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
          <div>🔴 Critical Conflicts</div>
          <div>🟠 High Priority Conflicts</div>
          <div>🟡 Medium Priority Conflicts</div>
          <div>🟢 Low Priority Conflicts</div>
          <div>🌱💧 Farm + Water Issues</div>
          <div>🏬🚚 Retail + Logistics</div>
          <div>🏙️⚖️ Multi-Use Zones</div>
          <div>👥 Citizen Input Required</div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'conflicts': return renderConflicts();
      case 'public': return renderPublicReport();
      case 'council': return renderCouncilReport();
      case 'map': return renderMapView();
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
        ⚖️ Overlap Analysis
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

export default OverlapAnalysisPanel;


