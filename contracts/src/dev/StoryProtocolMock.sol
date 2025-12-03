// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockIPAssetRegistry
 * @notice Mock Story Protocol IP Asset Registry for local testing
 * @dev Simulates IP minting and ownership tracking
 */
contract MockIPAssetRegistry is Ownable {
    
    // Counter for generating IPA IDs
    uint256 private ipaCounter;
    
    // IPA ID => owner address
    mapping(bytes32 => address) public ipaOwner;
    
    // IPA ID => metadata URI
    mapping(bytes32 => string) public ipaMetadata;
    
    // Events
    event IPMinted(bytes32 indexed ipaId, address indexed owner, string metadata);
    event IPTransferred(bytes32 indexed ipaId, address indexed from, address indexed to);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Mint a new IP Asset
     * @param owner Owner of the IP
     * @param metadata Metadata URI (IPFS hash or JSON)
     * @return ipaId Generated IPA ID
     */
    function mintIP(address owner, string memory metadata) external returns (bytes32) {
        require(owner != address(0), "Invalid owner");
        
        // Generate IPA ID (hash of counter + owner + metadata)
        bytes32 ipaId = keccak256(abi.encodePacked(ipaCounter, owner, metadata, block.timestamp));
        ipaCounter++;
        
        ipaOwner[ipaId] = owner;
        ipaMetadata[ipaId] = metadata;
        
        emit IPMinted(ipaId, owner, metadata);
        
        return ipaId;
    }
    
    /**
     * @notice Transfer IP ownership
     * @param ipaId IPA ID to transfer
     * @param to New owner
     */
    function transferIP(bytes32 ipaId, address to) external {
        require(ipaOwner[ipaId] == msg.sender, "Not IP owner");
        require(to != address(0), "Invalid recipient");
        
        address from = ipaOwner[ipaId];
        ipaOwner[ipaId] = to;
        
        emit IPTransferred(ipaId, from, to);
    }
    
    /**
     * @notice Get IP owner
     * @param ipaId IPA ID
     * @return owner Owner address
     */
    function getIPOwner(bytes32 ipaId) external view returns (address) {
        return ipaOwner[ipaId];
    }
    
    /**
     * @notice Check if IP exists
     * @param ipaId IPA ID
     * @return exists True if IP exists
     */
    function ipExists(bytes32 ipaId) external view returns (bool) {
        return ipaOwner[ipaId] != address(0);
    }
}

/**
 * @title MockRoyaltyVault
 * @notice Mock Story Protocol Royalty Vault for local testing
 * @dev Simulates royalty collection and claiming
 */
contract MockRoyaltyVault is Ownable {
    
    // IPA ID => token => balance
    mapping(bytes32 => mapping(address => uint256)) public royaltyBalances;
    
    // IPA ID => vault address (for compatibility)
    mapping(bytes32 => address) public vaultAddresses;
    
    // Events
    event VaultCreated(bytes32 indexed ipaId, address vaultAddress);
    event RoyaltyPaid(bytes32 indexed ipaId, address indexed token, uint256 amount, address indexed payer);
    event RoyaltyClaimed(bytes32 indexed ipaId, address indexed token, uint256 amount, address indexed claimer);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Create a royalty vault for an IPA
     * @param ipaId IPA ID
     * @return vaultAddress Mock vault address (this contract)
     */
    function createVault(bytes32 ipaId) external returns (address) {
        require(vaultAddresses[ipaId] == address(0), "Vault already exists");
        
        // For simplicity, use this contract as the vault address
        vaultAddresses[ipaId] = address(this);
        
        emit VaultCreated(ipaId, address(this));
        
        return address(this);
    }
    
    /**
     * @notice Pay royalty to an IPA's vault
     * @param ipaId IPA ID
     * @param token Token address
     * @param amount Amount to pay
     */
    function payRoyalty(bytes32 ipaId, address token, uint256 amount) external {
        require(vaultAddresses[ipaId] != address(0), "Vault does not exist");
        require(amount > 0, "Amount must be > 0");
        
        // Transfer tokens to this contract
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Update balance
        royaltyBalances[ipaId][token] += amount;
        
        emit RoyaltyPaid(ipaId, token, amount, msg.sender);
    }
    
    /**
     * @notice Claim royalty from an IPA's vault
     * @param ipaId IPA ID
     * @param claimer Address to receive royalties
     * @param token Token address
     * @return amount Amount claimed
     */
    function claimRoyalty(bytes32 ipaId, address claimer, address token) external returns (uint256) {
        require(claimer != address(0), "Invalid claimer");
        
        uint256 amount = royaltyBalances[ipaId][token];
        require(amount > 0, "No royalties available");
        
        // Update balance
        royaltyBalances[ipaId][token] = 0;
        
        // Transfer tokens to claimer
        IERC20(token).transfer(claimer, amount);
        
        emit RoyaltyClaimed(ipaId, token, amount, claimer);
        
        return amount;
    }
    
    /**
     * @notice Get royalty balance for an IPA
     * @param ipaId IPA ID
     * @param token Token address
     * @return balance Available balance
     */
    function getRoyaltyBalance(bytes32 ipaId, address token) external view returns (uint256) {
        return royaltyBalances[ipaId][token];
    }
    
    /**
     * @notice Get vault address for an IPA
     * @param ipaId IPA ID
     * @return vaultAddress Vault address
     */
    function getVaultAddress(bytes32 ipaId) external view returns (address) {
        return vaultAddresses[ipaId];
    }
}

/**
 * @title MockRoyaltyModule
 * @notice Mock Story Protocol Royalty Module for local testing
 * @dev Simulates royalty policy configuration
 */
contract MockRoyaltyModule is Ownable {
    
    // IPA ID => royalty percentage (in basis points, e.g., 1000 = 10%)
    mapping(bytes32 => uint256) public royaltyPolicies;
    
    // Events
    event RoyaltyPolicyConfigured(bytes32 indexed ipaId, uint256 percentage);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Configure royalty policy for an IPA
     * @param ipaId IPA ID
     * @param percentage Royalty percentage in basis points
     */
    function configureRoyaltyPolicy(bytes32 ipaId, uint256 percentage) external {
        require(percentage <= 10000, "Invalid percentage");
        
        royaltyPolicies[ipaId] = percentage;
        
        emit RoyaltyPolicyConfigured(ipaId, percentage);
    }
    
    /**
     * @notice Get royalty policy for an IPA
     * @param ipaId IPA ID
     * @return percentage Royalty percentage
     */
    function getRoyaltyPolicy(bytes32 ipaId) external view returns (uint256) {
        return royaltyPolicies[ipaId];
    }
}
