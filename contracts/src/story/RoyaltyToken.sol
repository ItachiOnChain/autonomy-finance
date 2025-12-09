// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RoyaltyToken
 * @notice ERC-20 token representing royalties from Story Protocol IP derivatives
 * @dev Only authorized RoyaltySimulator can mint tokens
 */
contract RoyaltyToken is ERC20, Ownable {
    /// @notice Address of the authorized royalty simulator
    address public royaltySimulator;

    /// @notice Address of the AutoRepayVault contract
    address public autoRepayVault;

    /// @notice Mapping of IP ID to total royalties earned
    mapping(address => uint256) public ipRoyalties;

    /// @notice Emitted when royalties are minted for an IP
    event RoyaltiesMinted(
        address indexed ipId,
        uint256 amount,
        uint256 timestamp
    );

    /// @notice Emitted when royalty simulator is set
    event RoyaltySimulatorSet(address indexed simulator);

    /// @notice Emitted when AutoRepayVault is set
    event AutoRepayVaultSet(address indexed vault);

    constructor() ERC20("Story Royalty Token", "ROYALTY") Ownable(msg.sender) {}

    /**
     * @notice Set the authorized royalty simulator contract (one-time setup)
     * @param _simulator Address of the RoyaltySimulator contract
     */
    function setRoyaltySimulator(address _simulator) external onlyOwner {
        require(_simulator != address(0), "Invalid simulator address");
        require(royaltySimulator == address(0), "Simulator already set");
        royaltySimulator = _simulator;
        emit RoyaltySimulatorSet(_simulator);
    }

    /**
     * @notice Set the AutoRepayVault contract address
     * @param _vault Address of the AutoRepayVault contract
     */
    function setAutoRepayVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Invalid vault address");
        autoRepayVault = _vault;
        emit AutoRepayVaultSet(_vault);
    }

    /**
     * @notice Mint royalty tokens to an IP address
     * @dev Only callable by the authorized RoyaltySimulator
     * @param ipId The Story Protocol IP identifier (address)
     * @param amount Number of tokens to mint (in wei, 18 decimals)
     */
    function mintRoyalties(address ipId, uint256 amount) external {
        require(msg.sender == royaltySimulator, "Only simulator can mint");
        require(ipId != address(0), "Invalid IP ID");
        require(amount > 0, "Amount must be greater than 0");

        // Mint tokens directly to the IP address
        _mint(ipId, amount);

        // Track total royalties for this IP
        ipRoyalties[ipId] += amount;

        emit RoyaltiesMinted(ipId, amount, block.timestamp);
    }

    /**
     * @notice Get the royalty token balance for a specific IP
     * @param ipId The IP identifier
     * @return Current royalty token balance
     */
    function getRoyaltyBalance(address ipId) external view returns (uint256) {
        return balanceOf(ipId);
    }

    /**
     * @notice Get total royalties ever earned by an IP
     * @param ipId The IP identifier
     * @return Total royalties minted for this IP
     */
    function getTotalRoyaltiesEarned(
        address ipId
    ) external view returns (uint256) {
        return ipRoyalties[ipId];
    }

    /**
     * @notice Override transferFrom to allow AutoRepayVault to transfer without approval
     * @dev This is the critical fix that enables auto-repay to work seamlessly
     * @param from Address to transfer from (IP address)
     * @param to Address to transfer to (usually AutoRepayVault)
     * @param value Amount to transfer
     * @return bool Success status
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public virtual override returns (bool) {
        // Allow AutoRepayVault to transfer from any IP without approval
        if (msg.sender == autoRepayVault && autoRepayVault != address(0)) {
            _transfer(from, to, value);
            return true;
        }

        // Normal ERC20 transferFrom logic (requires approval)
        return super.transferFrom(from, to, value);
    }
}
