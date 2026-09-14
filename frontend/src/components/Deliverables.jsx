import React, { useState } from 'react';

export default function Deliverables({ pipelineState, fileName }) {
  const [copiedSol, setCopiedSol] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!pipelineState) return null;
  const safeFileName = fileName ? fileName.replace('.sol', '') : 'Contract';

  const handleCopySol = () => {
    navigator.clipboard.writeText(pipelineState.source?.current || '');
    setCopiedSol(true);
    setTimeout(() => setCopiedSol(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(pipelineState, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div>
      <div className="deliver">
        <div className="dcard">
          <h3>Fixed contract</h3>
          <div className="fn">{safeFileName}_fixed.sol</div>
          <div className="dactions">
            <button className="btn primary" onClick={() => {
              const blob = new Blob([pipelineState.source?.current || ''], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${safeFileName}_fixed.sol`;
              a.click();
              URL.revokeObjectURL(url);
            }}>Download .sol</button>
            <button 
              className="btn" 
              onClick={handleCopySol}
              style={copiedSol ? { background: '#1A2B4C', color: '#fff', borderColor: '#1A2B4C' } : {}}
            >
              {copiedSol ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="dcard">
          <h3>Audit report</h3>
          <div className="fn">{safeFileName}_scafs_report.json</div>
          <div className="dactions">
            <button className="btn primary" onClick={() => {
              const blob = new Blob([JSON.stringify(pipelineState, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${safeFileName}_scafs_report.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}>Download JSON</button>
            <button 
              className="btn" 
              onClick={handleCopyJson}
              style={copiedJson ? { background: '#1A2B4C', color: '#fff', borderColor: '#1A2B4C' } : {}}
            >
              {copiedJson ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
