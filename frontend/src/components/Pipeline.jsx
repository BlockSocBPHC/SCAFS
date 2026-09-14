import React from 'react';

const renderNode = (stepNum, label, currentStep, isComplete) => {
  const isDone = isComplete || currentStep > stepNum;
  const isRunning = !isComplete && currentStep === stepNum;
  
  let circleContent;
  if (isDone) {
    circleContent = <div style={{ width: '18px', height: '18px', background: 'var(--navy)', borderRadius: '50%' }}></div>;
  } else if (isRunning) {
    circleContent = <div className="spinner"></div>;
  } else {
    circleContent = <div style={{ width: '18px', height: '18px', background: 'transparent', border: '2px solid var(--line-soft)', borderRadius: '50%' }}></div>;
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
      <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {circleContent}
      </div>
      <div style={{ fontSize: '12px', fontWeight: isRunning ? '600' : '500', color: isRunning ? 'var(--navy)' : 'var(--ink-faint)', marginTop: '6px' }}>{label}</div>
    </div>
  );
};

export default function Pipeline({ onRunAudit, onLoadDemo, loading, pipelineState, currentStep }) {
  const isDone = !!pipelineState;

  return (
    <div style={{ marginBottom: '0px' }}>
      <div className="pipeline">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em', color: 'var(--ink)' }}>SCAFS - Smart Contract Auditor & Fixer System</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn" 
            onClick={onLoadDemo} 
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', background: 'transparent' }}
          >
            Load demo
          </button>
          <button 
            className="runbtn" 
            onClick={onRunAudit} 
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Running...' : 'Run audit'}
          </button>
        </div>
      </div>

      {(loading || isDone) && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', margin: '30px 0 10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', width: '500px' }}>
            {renderNode(1, "Auditor", currentStep, isDone)}
            <div style={{ flex: 1, height: '2px', background: 'var(--line-soft)', marginTop: '11px', marginLeft: '-15px', marginRight: '-15px' }}></div>
            {renderNode(2, "Fixer", currentStep, isDone)}
            <div style={{ flex: 1, height: '2px', background: 'var(--line-soft)', marginTop: '11px', marginLeft: '-15px', marginRight: '-15px' }}></div>
            {renderNode(3, "Verifier", currentStep, isDone)}
            <div style={{ flex: 1, height: '2px', background: 'var(--line-soft)', marginTop: '11px', marginLeft: '-15px', marginRight: '-15px' }}></div>
            {renderNode(4, "Report", currentStep, isDone)}
          </div>
        </div>
      )}
    </div>
  );
}
