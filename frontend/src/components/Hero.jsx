import React, { useEffect, useRef } from 'react';
import Deliverables from './Deliverables';

export default function Hero({ pipelineState, loading, fileName, logs = [] }) {
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (loading) {
    return (
      <div className="hero">
        <div className="eyebrow"><span className="pulse"></span>engine running - analyzing {fileName}...</div>
        <h1 className="title">Analyzing {fileName}...</h1>
        <p className="subtitle">Running autonomous audit agents on backend (Z3 + LLM). Please wait.</p>
        
        {logs.length > 0 && (
          <div className="no-scrollbar" style={{
            marginTop: '30px', 
            background: 'var(--surface)', 
            border: '1px solid var(--line)', 
            borderRadius: '6px', 
            padding: '16px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            color: 'var(--ink-soft)',
            maxHeight: '220px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{ 
                color: log.includes('CRITICAL') || log.includes('rejected') || log.includes('Failed') ? 'var(--red)' : 
                       log.includes('Verification passed') ? 'var(--green)' : 'inherit'
              }}>
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    );
  }

  if (!pipelineState) return null;

  const latestReport = pipelineState.audit_reports?.[pipelineState.audit_reports.length - 1];
  const findingsCount = latestReport?.findings?.length || 0;
  const resolvedCount = pipelineState.verification?.findings_resolved?.length || 0;
  const regressedCount = pipelineState.verification?.findings_regressed?.length || 0;
  const finalCompStatus = pipelineState.verification?.final_compilation_status?.toLowerCase() || 'unknown';


  return (
    <div className="hero">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '40px' }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow"><span className="pulse"></span>engine completed - pipeline {pipelineState.pipeline_id}</div>
          <h1 className="title">Audit report for {fileName}</h1>
          <p className="subtitle">EVM / Solidity ^0.8.0. {findingsCount} issues were identified across static analysis and multi-pass LLM review, patched automatically, and confirmed with formal verification.</p>
          
          <div className="scoreboard" style={{ marginTop: '30px' }}>
            <div className="score"><div className="num">{findingsCount}</div><div className="lbl">Findings</div></div>
            <div className="score"><div className={`num ${resolvedCount === findingsCount && findingsCount > 0 ? 'ok' : ''}`}>{resolvedCount}</div><div className="lbl">Resolved</div></div>
            <div className="score"><div className="num" style={{ color: 'var(--red)' }}>{findingsCount - resolvedCount}</div><div className="lbl">Unresolved</div></div>
            <div className="score"><div className="num" style={{ color: 'var(--amber)' }}>{regressedCount}</div><div className="lbl">Regressions</div></div>
            <div className="score" style={{ gridColumn: 'span 2' }}>
              <div className="num" style={{ color: finalCompStatus === 'pass' ? 'var(--green)' : 'var(--red)' }}>{finalCompStatus === 'pass' ? 'Pass' : 'Fail'}</div>
              <div className="lbl">Final compilation</div>
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, width: '400px' }}>
          <Deliverables pipelineState={pipelineState} fileName={fileName} />
        </div>
      </div>
    </div>
  );
}
