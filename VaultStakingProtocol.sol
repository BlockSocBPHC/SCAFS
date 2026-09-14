// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VaultStakingProtocol {
    address public owner;
    uint256 public feeRate = 100; // 1% default fee (in basis points)
    
    mapping(address => uint256) public balances;
    mapping(address => uint256) public rewards;
    
    constructor() {
        owner = msg.sender;
    }
    
    function deposit() external payable {
        require(msg.value > 0, "Cannot deposit 0");
        balances[msg.sender] += msg.value;
    }
    
    // [VULNERABILITY: Missing access control]
    function setFeeRate(uint256 newRate) external {
        require(newRate <= 1000, "Fee too high");
        feeRate = newRate;
    }
    
    // [VULNERABILITY: Reentrancy]
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // External call BEFORE state update
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] -= amount;
    }
    
    function calculateReward(address user) public view returns (uint256) {
        return (balances[user] * feeRate) / 10000;
    }
    
    // [VULNERABILITY: tx.origin authentication]
    function emergencyDrain(address payable to) external {
        require(tx.origin == owner, "Only owner can drain");
        to.transfer(address(this).balance);
    }
    
    // [VULNERABILITY: Unchecked low-level call]
    function transferReward(address to, uint256 rewardAmount) external {
        require(rewards[msg.sender] >= rewardAmount, "Insufficient rewards");
        
        rewards[msg.sender] -= rewardAmount;
        
        // Boolean return isn't checked
        to.call{value: rewardAmount}("");
    }
}
