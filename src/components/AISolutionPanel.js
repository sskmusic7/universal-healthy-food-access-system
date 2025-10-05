// AISolutionPanel.js - AI-Generated Solution Recommendations
// Displays comprehensive AI recommendations based on NASA data analysis

import React, { useState } from 'react';

function AISolutionPanel({ aiSolution, cityData }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!aiSolution) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>
          🤖 AI Solution Generator
        </h3>
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <p>AI solution recommendations will appear here after analyzing city data.</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            Powered by Google Gemini AI
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'actions', label: 'Priority Actions', icon: '🎯' },
    { id: 'farming', label: 'Urban Farming', icon: '🌱' },
    { id: 'delivery', label: 'Delivery Solutions', icon: '🚚' },
    { id: 'heat', label: 'Heat Mitigation', icon: '🌡️' },
    { id: 'economic', label: 'Economic Impact', icon: '💰' }
  ];

  const renderSummary = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Analysis Summary</h4>
      <p style={{ 
        lineHeight: '1.6', 
        color: '#555',
        backgroundColor: '#f8f9fa',
        padding: '12px',
        borderRadius: '4px',
        margin: '0 0 16px 0'
      }}>
        {aiSolution.summary}
      </p>
      
      {aiSolution.economic_impact && (
        <div style={{
          backgroundColor: '#e8f5e8',
          border: '1px solid #4caf50',
          borderRadius: '4px',
          padding: '12px',
          marginTop: '16px'
        }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Economic Impact</h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <div><strong>Healthcare Savings:</strong> {aiSolution.economic_impact.healthcare_savings}</div>
            <div><strong>Implementation Cost:</strong> {aiSolution.economic_impact.implementation_cost}</div>
            <div><strong>ROI Timeline:</strong> {aiSolution.economic_impact.roi_timeline}</div>
            <div><strong>Beneficiaries:</strong> {aiSolution.economic_impact.beneficiaries}</div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPriorityActions = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Priority Actions</h4>
      {aiSolution.priority_actions?.map((action, index) => (
        <div key={index} style={{
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px',
          backgroundColor: action.priority === 'high' ? '#fff3cd' : 
                          action.priority === 'medium' ? '#d1ecf1' : '#f8f9fa'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h5 style={{ margin: '0', color: '#333' }}>{action.action}</h5>
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold',
              backgroundColor: action.priority === 'high' ? '#dc3545' : 
                              action.priority === 'medium' ? '#ffc107' : '#6c757d',
              color: 'white'
            }}>
              {action.priority.toUpperCase()}
            </span>
          </div>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', lineHeight: '1.4' }}>
            {action.description}
          </p>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            <strong>NASA Evidence:</strong> {action.nasa_evidence}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px' }}>
            <div><strong>Cost:</strong> {action.estimated_cost}</div>
            <div><strong>Timeline:</strong> {action.timeline}</div>
            <div><strong>Impact:</strong> {action.expected_impact}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderUrbanFarming = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Urban Farming Recommendations</h4>
      {aiSolution.urban_farming_recommendations?.map((farm, index) => (
        <div key={index} style={{
          border: '1px solid #4caf50',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px',
          backgroundColor: '#f1f8e9'
        }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>{farm.location_type}</h5>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>{farm.justification}</p>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
            <strong>NASA Evidence:</strong> {farm.nasa_evidence}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
            <div><strong>Crops:</strong> {farm.crop_suggestions?.join(', ')}</div>
            <div><strong>Irrigation:</strong> {farm.irrigation_needs}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDeliverySolutions = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Delivery Solutions</h4>
      {aiSolution.delivery_solutions?.map((solution, index) => (
        <div key={index} style={{
          border: '1px solid #2196f3',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px',
          backgroundColor: '#e3f2fd'
        }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>{solution.solution_type}</h5>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>{solution.description}</p>
          <div style={{ fontSize: '11px', color: '#666' }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>Weather Resilience:</strong> {solution.weather_resilience}
            </div>
            <div>
              <strong>Target Population:</strong> {solution.target_population}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderHeatMitigation = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Heat Mitigation Strategies</h4>
      {aiSolution.heat_mitigation?.map((strategy, index) => (
        <div key={index} style={{
          border: '1px solid #ff9800',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px',
          backgroundColor: '#fff3e0'
        }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#f57c00' }}>{strategy.strategy}</h5>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>{strategy.description}</p>
          <div style={{ fontSize: '11px', color: '#666' }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>Implementation:</strong> {strategy.implementation}
            </div>
            <div>
              <strong>NASA Evidence:</strong> {strategy.nasa_evidence}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderEconomicImpact = () => (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Economic Impact Analysis</h4>
      {aiSolution.economic_impact && (
        <div style={{
          backgroundColor: '#e8f5e8',
          border: '1px solid #4caf50',
          borderRadius: '6px',
          padding: '16px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <h5 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Financial Benefits</h5>
              <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                <div><strong>Annual Healthcare Savings:</strong> {aiSolution.economic_impact.healthcare_savings}</div>
                <div><strong>Total Implementation Cost:</strong> {aiSolution.economic_impact.implementation_cost}</div>
                <div><strong>Return on Investment:</strong> {aiSolution.economic_impact.roi_timeline}</div>
              </div>
            </div>
            <div>
              <h5 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Social Impact</h5>
              <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                <div><strong>Direct Beneficiaries:</strong> {aiSolution.economic_impact.beneficiaries}</div>
                <div><strong>Community Impact:</strong> Improved food access and health outcomes</div>
                <div><strong>Long-term Benefits:</strong> Sustainable urban food systems</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary': return renderSummary();
      case 'actions': return renderPriorityActions();
      case 'farming': return renderUrbanFarming();
      case 'delivery': return renderDeliverySolutions();
      case 'heat': return renderHeatMitigation();
      case 'economic': return renderEconomicImpact();
      default: return renderSummary();
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
        🤖 AI Solution Generator
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

export default AISolutionPanel;
