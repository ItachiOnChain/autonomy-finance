// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIPManager {
    // Legacy Events
    event IPAccepted(address indexed user, address indexed ipAsset);
    event IPReturned(address indexed user, address indexed ipAsset);
    event RoyaltiesCollected(address indexed ipAsset, uint256 amount);
    
    // New Events
    event IPALocked(bytes32 indexed ipaId, address indexed owner, uint256 collateralValue);
    event IPAUnlocked(bytes32 indexed ipaId, address indexed owner);
    event IPACollateralValueUpdated(bytes32 indexed ipaId, uint256 oldValue, uint256 newValue);
    event RoyaltyDeposited(bytes32 indexed ipaId, address indexed token, uint256 amount);
    event RoyaltyWithdrawn(bytes32 indexed ipaId, address indexed token, uint256 amount, address indexed recipient);
    
    // Legacy Functions
    function acceptIP(address user, address ipAsset) external;
    function returnIP(address user) external;
    function collectRoyalties(address ipAsset) external returns (uint256);
    function getRoyaltyBalance(address ipAsset) external view returns (uint256);
    function withdrawRoyalties(address ipAsset, uint256 amount) external returns (uint256);
    function getLockedIP(address user) external view returns (address);
    function isIPLocked(address user) external view returns (bool);
    
    // New Functions
    function lockIPA(bytes32 ipaId, address owner, uint256 collateralValue) external;
    function unlockIPA(bytes32 ipaId) external;
    function updateIPACollateralValue(bytes32 ipaId, uint256 newValue) external;
    function getIPACollateralValue(bytes32 ipaId) external view returns (uint256);
    function getIPAOwner(bytes32 ipaId) external view returns (address);
    function isIPALocked(bytes32 ipaId) external view returns (bool);
    function depositRoyalties(bytes32 ipaId, address token, uint256 amount) external;
    function withdrawRoyalties(bytes32 ipaId, address token, uint256 amount) external returns (uint256);
    function getRoyaltyBalance(bytes32 ipaId, address token) external view returns (uint256);
}
