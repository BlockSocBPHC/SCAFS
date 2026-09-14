// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VaultStakingProtocol
 * @dev INTENTIONALLY VULNERABLE CONTRACT FOR SCAFS DEMO
 */
contract VaultStakingProtocol {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public rewards;
    address public owner;
    uint256 public feeRate = 100; // basis points

    constructor() {
        owner = msg.sender;
    }

    // VULNERABILITY 1: Missing Access Control (onlyOwner)
    // Anyone can change the fee rate of the protocol
    function setFeeRate(uint256 newRate) public {
        require(newRate <= 500, "Fee too high");
        feeRate = newRate;
    }

    // VULNERABILITY 2: Reentrancy (State update after external call)
    // An attacker can re-enter this function and drain the vault
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // External call BEFORE state update
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] -= amount;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // VULNERABILITY 3: tx.origin Phishing
    // An attacker can trick the owner into interacting with a malicious contract
    function emergencyDrain(address payable to) public {
        require(tx.origin == owner, "Not authorized");
        to.transfer(address(this).balance);
    }

    // VULNERABILITY 4: Unchecked return value (Silent failure)
    function transferReward(address to, uint256 amount) public {
        require(rewards[msg.sender] >= amount, "Not enough rewards");
        rewards[msg.sender] -= amount;
        
        // Simulating a low-level call where return value isn't checked
        to.call{value: amount}(""); 
    }
}
