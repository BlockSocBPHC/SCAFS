import React, { useState } from 'react';

export default function Findings({ pipelineState, onViewDiff }) {
  const [activeFilter, setActiveFilter] = useState('ALL');

  if (!pipelineState) return null;

  const latestReport = pipelineState.audit_reports?.[pipelineState.audit_reports.length - 1];
  const findings = latestReport?.findings || [];
  const resolvedCount = pipelineState.verification?.findings_resolved?.length || 0;

  if (findings.length === 0) {
    return (
      <div className="section">
        <div className="section-head"><h2>Findings</h2><span className="count">0 issues</span></div>
        <p style={{ color: 'var(--ink-soft)' }}>No vulnerabilities were found during the audit.</p>
      </div>
    );
  }

  const availableSevs = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].filter(sev => findings.some(f => f.severity.toUpperCase() === sev));
  const filters = ['ALL', ...availableSevs];
  const filteredFindings = activeFilter === 'ALL' ? findings : findings.filter(f => f.severity.toUpperCase() === activeFilter);

  return (
    <div className="section">
      <div className="section-head">
        <h2>Findings</h2>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600' }}>
          {filters.map((filterVal, idx) => {
            const isActive = activeFilter === filterVal;
            return (
              <React.Fragment key={filterVal}>
                <div 
                  onClick={() => setActiveFilter(filterVal)}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '6px 16px',
                    background: isActive ? 'var(--blue)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--ink-soft)'
                  }}
                >
                  {filterVal}
                </div>
                {idx < filters.length - 1 && !isActive && activeFilter !== filters[idx+1] && (
                  <span style={{ color: 'var(--ink-faint)', opacity: 0.5, userSelect: 'none' }}>|</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Severity breakdown bar */}
      {(() => {
        const sevColors = { CRITICAL: 'var(--red)', HIGH: '#f97316', MEDIUM: 'var(--amber)', LOW: '#84cc16' };
        const total = findings.length;
        const counts = {};
        findings.forEach(f => {
          const s = f.severity.toUpperCase();
          counts[s] = (counts[s] || 0) + 1;
        });
        return (
          <div style={{ display: 'flex', height: '5px', borderRadius: '3px', overflow: 'hidden', marginBottom: '28px', gap: '2px' }}>
            {Object.entries(counts).map(([sev, count]) => (
              <div
                key={sev}
                title={`${sev}: ${count}`}
                style={{ flex: count / total, background: sevColors[sev] || 'var(--ink-faint)', borderRadius: '3px' }}
              />
            ))}
          </div>
        );
      })()}

      {filteredFindings.map((f, idx) => (
        <div className="finding" key={f.finding_id || idx}>
          <div className="frow">
            <div className={`fsev ${f.severity.toLowerCase()}`}>
              <span className="dot"></span>
              <span className="fsev-label">{f.severity.toLowerCase()}</span>
            </div>
            <div className="fbody">
              <div className="ftop">
                <span 
                  className="ftitle" 
                  onClick={() => onViewDiff && onViewDiff(f.finding_id)}
                  style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                  title="Click to view code patch"
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--blue)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}
                >
                  {f.title}
                </span>
                {(() => {
                  const isResolved = pipelineState.verification?.findings_resolved?.includes(f.finding_id);
                  const statusColor = isResolved ? 'var(--green)' : 'var(--red)';
                  return (
                    <span className="fstatus" style={{ color: statusColor }}>
                      <span style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        width: '18px', height: '18px', 
                        borderRadius: '50%', background: statusColor, color: '#fff',
                        fontSize: '12px', fontWeight: 'bold' 
                      }}>
                        {isResolved ? '✓' : '!'}
                      </span>
                      {isResolved ? 'resolved' : 'unresolved'}
                    </span>
                  );
                })()}
              </div>
              <p className="fdesc">{f.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
