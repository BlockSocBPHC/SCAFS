import React, { useState, useRef } from 'react';
import './index.css';

import NavBar from './components/NavBar';
import Hero from './components/Hero';
import Pipeline from './components/Pipeline';
import Findings from './components/Findings';
import Verification from './components/Verification';
import Deliverables from './components/Deliverables';
import Footer from './components/Footer';
import PatchDiff from './components/PatchDiff';

import { mockPipeline } from './data/mockPipeline';

function App() {
  const [pipelineState, setPipelineState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState('findings');
  const [highlightedFinding, setHighlightedFinding] = useState(null);
  const [logs, setLogs] = useState([]);
  const fileInputRef = useRef(null);

  const handleRunAudit = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    await uploadFileToBackend(file);
    e.target.value = '';
  };

  const handleLoadDemo = async () => {
    setFileName('VaultStakingProtocol.sol');
    setLoading(true);
    setPipelineState(null);
    setCurrentStep(1); // Auditor
    
    const getTs = () => new Date().toLocaleTimeString('en-US', { hour12: false });
    
    setLogs([
      `[${getTs()}] System initialized. Connecting to Z3 formal verification engine...`,
      `[${getTs()}] Starting AST parsing and static analysis on VaultStakingProtocol.sol`
    ]);

    // Simulate backend processing delay & feedback loop
    setTimeout(() => {
      setCurrentStep(2);
      setLogs(l => [...l, `[${getTs()}] Auditor detected 4 vulnerabilities.`]);
      setLogs(l => [...l, `[${getTs()}] CRITICAL: Reentrancy found in withdraw() function.`]);
      setLogs(l => [...l, `[${getTs()}] Handoff to Fixer agent to generate semantic patches...`]);
    }, 1200); 
    
    setTimeout(() => {
      setCurrentStep(3);
      setLogs(l => [...l, `[${getTs()}] Fixer completed patch generation.`]);
      setLogs(l => [...l, `[${getTs()}] Routing to Verifier for differential re-audit...`]);
    }, 2400); 
    
    setTimeout(() => {
      setCurrentStep(1);
      setLogs(l => [...l, `[${getTs()}] Verifier rejected patch: Regression detected in emergencyDrain().`]);
      setLogs(l => [...l, `[${getTs()}] Kicking pipeline back to Auditor node for context re-evaluation.`]);
    }, 3600); 
    
    setTimeout(() => {
      setCurrentStep(2);
      setLogs(l => [...l, `[${getTs()}] Auditor refined constraint matrix. Handoff to Fixer.`]);
    }, 4800); 
    
    setTimeout(() => {
      setCurrentStep(3);
      setLogs(l => [...l, `[${getTs()}] Verifier running SMT invariant checks on V2 patches...`]);
    }, 6000); 
    
    setTimeout(() => {
      setCurrentStep(4);
      setLogs(l => [...l, `[${getTs()}] Verification passed. Zero regressions detected.`]);
      setLogs(l => [...l, `[${getTs()}] Compiling final report deliverables...`]);
      
      setTimeout(() => {
        setPipelineState(mockPipeline);
        setLoading(false);
      }, 500);
    }, 7200); 
  };

  const uploadFileToBackend = async (file) => {
    setLoading(true);
    setPipelineState(null);
    setCurrentStep(1);
    setLogs([`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Uploading file to backend...`]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://scafs.onrender.com';
      const res = await fetch(`${apiUrl}/api/audit`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setPipelineState(data);
    } catch (err) {
      console.error("Backend error:", err);
      setLogs(l => [...l, `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Failed to connect to backend.`]);
      alert("Failed to connect to backend. Make sure the FastAPI server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="wrap">
        <Pipeline 
          onRunAudit={handleRunAudit} 
          onLoadDemo={handleLoadDemo}
          loading={loading} 
          pipelineState={pipelineState}
          currentStep={currentStep}
        />
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".sol" 
          onChange={handleFileChange} 
        />

        {(pipelineState || loading) ? (
          <>
            <Hero pipelineState={pipelineState} loading={loading} fileName={fileName} logs={logs} />
            {pipelineState && (
              <>
                <div style={{ marginTop: '40px', borderBottom: '1px solid var(--line)', display: 'flex', gap: '32px' }}>
                  <button 
                    onClick={() => setActiveTab('findings')}
                    style={{
                      padding: '0 0 12px 0',
                      fontSize: '15px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: activeTab === 'findings' ? '600' : '500',
                      border: 'none',
                      borderBottom: activeTab === 'findings' ? '2px solid var(--navy)' : '2px solid transparent',
                      marginBottom: '-1px',
                      cursor: 'pointer',
                      background: 'transparent',
                      color: activeTab === 'findings' ? 'var(--navy)' : 'var(--ink-soft)'
                    }}
                  >
                    Findings
                  </button>
                  <button 
                    onClick={() => setActiveTab('verification')}
                    style={{
                      padding: '0 0 12px 0',
                      fontSize: '15px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: activeTab === 'verification' ? '600' : '500',
                      border: 'none',
                      borderBottom: activeTab === 'verification' ? '2px solid var(--navy)' : '2px solid transparent',
                      marginBottom: '-1px',
                      cursor: 'pointer',
                      background: 'transparent',
                      color: activeTab === 'verification' ? 'var(--navy)' : 'var(--ink-soft)'
                    }}
                  >
                    Formal Verification
                  </button>
                  <button 
                    onClick={() => setActiveTab('diff')}
                    style={{
                      padding: '0 0 12px 0',
                      fontSize: '15px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: activeTab === 'diff' ? '600' : '500',
                      border: 'none',
                      borderBottom: activeTab === 'diff' ? '2px solid var(--navy)' : '2px solid transparent',
                      marginBottom: '-1px',
                      cursor: 'pointer',
                      background: 'transparent',
                      color: activeTab === 'diff' ? 'var(--navy)' : 'var(--ink-soft)'
                    }}
                  >
                    Patch Diff
                  </button>
                </div>
                
                <div style={{ marginTop: '20px' }}>
                  {activeTab === 'findings' && <Findings pipelineState={pipelineState} onViewDiff={(fid) => { setActiveTab('diff'); setHighlightedFinding(fid); }} />}
                  {activeTab === 'verification' && <Verification pipelineState={pipelineState} />}
                  {activeTab === 'diff' && <PatchDiff pipelineState={pipelineState} highlightedFinding={highlightedFinding} />}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--ink-faint)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '64px', height: '64px', marginBottom: '20px', color: '#E5E7EB' }}>
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.36 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h7v-4.25l-2.6 2.6c-.4.4-1.04.4-1.44 0-.4-.4-.4-1.04 0-1.44l4.33-4.33c.4-.4 1.04-.4 1.44 0l4.33 4.33c.4.4.4 1.04 0 1.44-.4.4-1.04.4-1.44 0L15 15.75V20h4c3.31 0 6-2.69 6-6 0-2.97-2.17-5.43-5.65-5.96z"/>
            </svg>
            <span style={{ fontSize: '15px' }}>Upload a smart contract to generate a formal audit report.</span>
          </div>
        )}
        
        <Footer pipelineState={pipelineState} />
      </div>
    </>
  );
}

export default App;
