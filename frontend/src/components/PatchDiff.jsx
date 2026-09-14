import React, { useEffect, useRef } from 'react';

export default function PatchDiff({ highlightedFinding }) {
  const containerRef = useRef(null);

  // Full contract representation showing all 4 vulnerabilities patched side-by-side
  const splitLines = [
    { left: { type: 'context', text: '// SPDX-License-Identifier: MIT' }, right: { type: 'context', text: '// SPDX-License-Identifier: MIT' } },
    { left: { type: 'context', text: 'pragma solidity ^0.8.0;' }, right: { type: 'context', text: 'pragma solidity ^0.8.0;' } },
    { left: { type: 'context', text: '' }, right: { type: 'context', text: '' } },
    { left: { type: 'context', text: 'contract VaultStakingProtocol {' }, right: { type: 'context', text: 'contract VaultStakingProtocol {' } },
    { left: { type: 'context', text: '    mapping(address => uint256) public balances;' }, right: { type: 'context', text: '    mapping(address => uint256) public balances;' } },
    { left: { type: 'context', text: '    address public owner;' }, right: { type: 'context', text: '    address public owner;' } },
    { left: { type: 'context', text: '    uint256 public feeRate;' }, right: { type: 'context', text: '    uint256 public feeRate;' } },
    { left: { type: 'context', text: '' }, right: { type: 'context', text: '' } },
    { left: { type: 'context', text: '    constructor() {' }, right: { type: 'context', text: '    constructor() {' } },
    { left: { type: 'context', text: '        owner = msg.sender;' }, right: { type: 'context', text: '        owner = msg.sender;' } },
    { left: { type: 'context', text: '    }' }, right: { type: 'context', text: '    }' } },
    { left: { type: 'context', text: '' }, right: { type: 'context', text: '' } },
    { left: { type: 'context', text: '    function deposit() external payable {' }, right: { type: 'context', text: '    function deposit() external payable {' } },
    { left: { type: 'context', text: '        balances[msg.sender] += msg.value;' }, right: { type: 'context', text: '        balances[msg.sender] += msg.value;' } },
    { left: { type: 'context', text: '    }' }, right: { type: 'context', text: '    }' } },
    { left: { type: 'context', text: '' }, right: { type: 'context', text: '' } },
    { left: { type: 'context', text: '    function setFeeRate(uint256 _rate) external {' }, right: { type: 'context', text: '    function setFeeRate(uint256 _rate) external {' }, fid: 'f2' },
    { left: { type: 'empty', text: '' }, right: { type: 'added', text: '+       require(msg.sender == owner, "Not owner");' }, fid: 'f2' },
    { left: { type: 'context', text: '        feeRate = _rate;' }, right: { type: 'context', text: '        feeRate = _rate;' }, fid: 'f2' },
    { left: { type: 'context', text: '    }' }, right: { type: 'context', text: '    }' }, fid: 'f2' },
    { left: { type: 'context', text: '' }, right: { type: 'context', text: '' } },
    { left: { type: 'context', text: '    function withdraw(uint256 amount) external {' }, right: { type: 'context', text: '    function withdraw(uint256 amount) external {' }, fid: 'f1' },
    { left: { type: 'context', text: '        require(balances[msg.sender] >= amount, "Insufficient funds");' }, right: { type: 'context', text: '        require(balances[msg.sender] >= amount, "Insufficient funds");' }, fid: 'f1' },
    { left: { type: 'removed', text: '-       (bool success, ) = msg.sender.call{value: amount}("");' }, right: { type: 'added', text: '+       balances[msg.sender] -= amount;' }, fid: 'f1' },
    { left: { type: 'removed', text: '-       require(success, "Transfer failed");' }, right: { type: 'added', text: '+       (bool success, ) = msg.sender.call{value: amount}("");' }, fid: 'f1' },
    { left: { type: 'removed', text: '-       balances[msg.sender] -= amount;' }, right: { type: 'added', text: '+       require(success, "Transfer failed");' }, fid: 'f1' },
    { left: { type: 'context', text: '    }' }, right: { type: 'context', text: '    }' }, fid: 'f1' },
    { left: { type: 'context', text: '' }, right: { type: 'context', text: '' } },
    { left: { type: 'context', text: '    function emergencyDrain() external {' }, right: { type: 'context', text: '    function emergencyDrain() external {' }, fid: 'f3' },
    { left: { type: 'removed', text: '-       require(tx.origin == owner, "Not owner");' }, right: { type: 'added', text: '+       require(msg.sender == owner, "Not owner");' }, fid: 'f3' },
    { left: { type: 'context', text: '        payable(owner).transfer(address(this).balance);' }, right: { type: 'context', text: '        payable(owner).transfer(address(this).balance);' }, fid: 'f3' },
    { left: { type: 'context', text: '    }' }, right: { type: 'context', text: '    }' }, fid: 'f3' },
    { left: { type: 'context', text: '' }, right: { type: 'context', text: '' } },
    { left: { type: 'context', text: '    function transferReward(address to, uint256 rewardAmount) external {' }, right: { type: 'context', text: '    function transferReward(address to, uint256 rewardAmount) external {' }, fid: 'f4' },
    { left: { type: 'context', text: '        require(msg.sender == owner, "Not owner");' }, right: { type: 'context', text: '        require(msg.sender == owner, "Not owner");' }, fid: 'f4' },
    { left: { type: 'removed', text: '-       to.call{value: rewardAmount}("");' }, right: { type: 'added', text: '+       (bool success, ) = to.call{value: rewardAmount}("");' }, fid: 'f4' },
    { left: { type: 'empty', text: '' }, right: { type: 'added', text: '+       require(success, "Reward transfer failed");' }, fid: 'f4' },
    { left: { type: 'context', text: '    }' }, right: { type: 'context', text: '    }' }, fid: 'f4' },
    { left: { type: 'context', text: '}' }, right: { type: 'context', text: '}' } }
  ];

  const getStyle = (type) => {
    if (type === 'added') return { bg: '#e6ffec', color: '#055d20' };
    if (type === 'removed') return { bg: '#ffebe9', color: '#a11818' };
    if (type === 'empty') return { bg: 'transparent', color: 'transparent' };
    return { bg: 'transparent', color: 'var(--ink)' };
  };

  useEffect(() => {
    if (highlightedFinding) {
      const el = document.getElementById('diff-highlight-' + highlightedFinding);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedFinding]);

  let leftLineNum = 1;
  let rightLineNum = 1;

  let currentFid = null;

  return (
    <div className="section">
      <div className="section-head" style={{ marginBottom: '16px' }}>
        <h2>Patch Diff</h2>
      </div>
      
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', border: '1px solid var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#1A2B68', borderBottom: '1px solid var(--line)', color: '#fff' }}>
          <div style={{ width: '50%', padding: '10px 16px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>VaultStakingProtocol.sol (Before)</div>
          <div style={{ width: '50%', padding: '10px 16px' }}>VaultStakingProtocol.sol (After)</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: '8px 0' }}>
          {splitLines.map((row, idx) => {
            const leftStyle = getStyle(row.left.type);
            const rightStyle = getStyle(row.right.type);
            
            const leftLineStr = (row.left.type === 'context' || row.left.type === 'removed') ? leftLineNum++ : '';
            const rightLineStr = (row.right.type === 'context' || row.right.type === 'added') ? rightLineNum++ : '';
            
            const isHighlighted = highlightedFinding === row.fid;
            const attachId = row.fid && row.fid !== currentFid;
            if (row.fid) currentFid = row.fid;

            return (
              <div 
                key={idx} 
                id={attachId ? 'diff-highlight-' + row.fid : undefined}
                className={isHighlighted ? 'flash-highlight' : ''} 
                style={{ display: 'flex' }}
              >
                <div className="diff-cell" style={{ 
                  width: '50%', 
                  display: 'flex',
                  background: leftStyle.bg, 
                  color: leftStyle.color, 
                  borderRight: '1px solid var(--line-soft)',
                  minHeight: '20px'
                }}>
                  <div style={{ width: '40px', flexShrink: 0, textAlign: 'right', padding: '2px 8px', color: 'var(--ink-faint)', userSelect: 'none', background: 'var(--surface)' }}>{leftLineStr}</div>
                  <div style={{ padding: '2px 16px', whiteSpace: 'pre-wrap' }}>{row.left.text}</div>
                </div>
                <div className="diff-cell" style={{ 
                  width: '50%', 
                  display: 'flex',
                  background: rightStyle.bg, 
                  color: rightStyle.color, 
                  minHeight: '20px'
                }}>
                  <div style={{ width: '40px', flexShrink: 0, textAlign: 'right', padding: '2px 8px', color: 'var(--ink-faint)', userSelect: 'none', background: 'var(--surface)' }}>{rightLineStr}</div>
                  <div style={{ padding: '2px 16px', whiteSpace: 'pre-wrap' }}>{row.right.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
