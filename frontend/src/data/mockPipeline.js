const originalCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VaultStakingProtocol {
    address public owner;
    uint256 public feeRate = 100;
    
    mapping(address => uint256) public balances;
    mapping(address => uint256) public rewards;
    
    constructor() { owner = msg.sender; }
    
    function deposit() external payable {
        require(msg.value > 0, "Cannot deposit 0");
        balances[msg.sender] += msg.value;
    }
    
    function setFeeRate(uint256 newRate) external {
        require(newRate <= 1000, "Fee too high");
        feeRate = newRate;
    }
    
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;
    }
    
    function calculateReward(address user) public view returns (uint256) {
        return (balances[user] * feeRate) / 10000;
    }
    
    function emergencyDrain(address payable to) external {
        require(tx.origin == owner, "Only owner can drain");
        to.transfer(address(this).balance);
    }
    
    function transferReward(address to, uint256 rewardAmount) external {
        require(rewards[msg.sender] >= rewardAmount, "Insufficient rewards");
        rewards[msg.sender] -= rewardAmount;
        to.call{value: rewardAmount}("");
    }
}`;

const patchedCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VaultStakingProtocol {
    address public owner;
    uint256 public feeRate = 100;
    
    mapping(address => uint256) public balances;
    mapping(address => uint256) public rewards;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() { owner = msg.sender; }
    
    function deposit() external payable {
        require(msg.value > 0, "Cannot deposit 0");
        balances[msg.sender] += msg.value;
    }
    
    function setFeeRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Fee too high");
        feeRate = newRate;
    }
    
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount; // CEI pattern applied
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    function calculateReward(address user) public view returns (uint256) {
        return (balances[user] * feeRate) / 10000;
    }
    
    function emergencyDrain(address payable to) external onlyOwner {
        to.transfer(address(this).balance);
    }
    
    function transferReward(address to, uint256 rewardAmount) external {
        require(rewards[msg.sender] >= rewardAmount, "Insufficient rewards");
        rewards[msg.sender] -= rewardAmount;
        (bool success, ) = to.call{value: rewardAmount}("");
        require(success, "Reward transfer failed");
    }
}`;

export const mockPipeline = {
  pipeline_id: "scafs-7a91-4a6b-b82d",
  iteration: 1,
  max_iterations: 3,
  pipeline_status: "DONE",
  source: {
    original: originalCode,
    current: patchedCode
  },
  audit_reports: [
    {
      findings: [
        {
          finding_id: "f1",
          severity: "CRITICAL",
          title: "Reentrancy in withdraw()",
          description: "The external ether transfer runs before the balance mapping is deducted, allowing a malicious contract to recursively call back in and drain funds.",
          affected_function: "VaultStakingProtocol.withdraw(uint256)",
          affected_lines: [27, 28, 31, 32, 34],
          detector_id: "reentrancy-eth",
          vulnerable_code: "(bool success, ) = msg.sender.call{value: amount}(\"\");\nrequire(success, \"Transfer failed\");\nbalances[msg.sender] -= amount;",
          fix_recommendation: "apply checks-effects-interactions: update the balance before the external call."
        },
        {
          finding_id: "f2",
          severity: "HIGH",
          title: "Missing access control in setFeeRate()",
          description: "Any caller can update the protocol fee rate — the function never checks that the sender is the owner.",
          affected_function: "VaultStakingProtocol.setFeeRate(uint256)",
          affected_lines: [20, 21, 22, 23],
          detector_id: "missing-access-control",
          vulnerable_code: "function setFeeRate(uint256 newRate) external {\n    require(newRate <= 1000, \"Fee too high\");\n    feeRate = newRate;\n}",
          fix_recommendation: "add an onlyOwner modifier to setFeeRate()."
        },
        {
          finding_id: "f3",
          severity: "HIGH",
          title: "tx.origin authentication in emergencyDrain()",
          description: "Using tx.origin for authorization lets a phishing contract trick the owner into unintentionally draining funds.",
          affected_function: "VaultStakingProtocol.emergencyDrain(address)",
          affected_lines: [43, 44, 45],
          detector_id: "tx-origin-auth",
          vulnerable_code: "function emergencyDrain(address payable to) external {\n    require(tx.origin == owner, \"Only owner can drain\");\n    to.transfer(address(this).balance);\n}",
          fix_recommendation: "replace tx.origin with msg.sender for sender authentication."
        },
        {
          finding_id: "f4",
          severity: "MEDIUM",
          title: "Unchecked return value in transferReward()",
          description: "The low-level call's boolean return isn't checked, so a failed transfer can silently succeed from the contract's perspective.",
          affected_function: "VaultStakingProtocol.transferReward(address,uint256)",
          affected_lines: [49, 54],
          detector_id: "unchecked-lowlevel-call",
          vulnerable_code: "to.call{value: rewardAmount}(\"\");",
          fix_recommendation: "capture the return value and require(success)."
        }
      ]
    }
  ],
  verification: {
    final_compilation_status: "PASS",
    findings_resolved: ["f1", "f2", "f3", "f4"],
    findings_regressed: []
  }
};
