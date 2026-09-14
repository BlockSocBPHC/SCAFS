import React from 'react';

export default function Verification({ pipelineState }) {
  if (!pipelineState) return null;

  const verif = pipelineState.verification || {};
  const isClean = verif.findings_regressed?.length === 0;

  return (
    <div className="section">
      <div className="section-head">
        <h2>Formal verification</h2>
      </div>
      <div className="verify">
        <div className="vrow">
          <div>
            <div className="vname">Invariant enforcement</div>
            <div className="vdetail">Security properties checked over LLM patches</div>
          </div>
          <div className="vresult" style={{ color: isClean ? 'var(--green)' : 'var(--amber)' }}>
            {isClean ? 'satisfied' : 'violations detected'}
          </div>
        </div>
        <div className="vrow">
          <div>
            <div className="vname">Compilation check</div>
            <div className="vdetail">Solc syntax and compilation validation</div>
          </div>
          <div className="vresult" style={{ color: verif.final_compilation_status?.toUpperCase() === 'PASS' ? 'var(--green)' : 'var(--red)' }}>
            {verif.final_compilation_status?.toLowerCase() || 'pending'}
          </div>
        </div>
        <div className="vrow">
          <div>
            <div className="vname">Differential re-audit</div>
            <div className="vdetail">Re-run across Slither & LLM detectors</div>
          </div>
          <div className="vresult" style={{ color: isClean ? 'var(--green)' : 'var(--red)' }}>
            {isClean ? 'clean' : `${verif.findings_regressed?.length} regressions`}
          </div>
        </div>
      </div>
    </div>
  );
}
