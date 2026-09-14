import React from 'react';

export default function Footer({ pipelineState }) {
  return (
    <footer>
      <div className="footer-inner">
        <span>SCAFS.SYS — autonomous audit engine</span>
        <span>{pipelineState ? `pipeline ${pipelineState.pipeline_id}` : 'awaiting contract upload'}</span>
      </div>
    </footer>
  );
}
