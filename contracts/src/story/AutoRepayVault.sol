// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IRoyaltyToken is IERC20 {
    function mintRoyalties(address to, uint256 amount) external;
}

interface ILendingPool {
    function getDebt(address borrower) external view returns (uint256);

    function repayWithToken(
        address borrower,
        address token,
        uint256 amount
    ) external;
}

/**
 * @title AutoRepayVault
 * @notice Manages IP locking and automatic royalty routing for debt repayment
 * @dev Fully on-chain implementation - no backend dependencies for critical logic
 */
contract AutoRepayVault is Ownable, ReentrancyGuard {
    IRoyaltyToken public royaltyToken;
    ILendingPool public lendingPool;
    address public royaltySimulator;

    // IP lock status and ownership
    mapping(address => bool) public ipLocked;
    mapping(address => address) public ipOwner;
    mapping(address => uint256) public ipDebt;

    // Events
    event IPLocked(
        address indexed ipId,
        address indexed owner,
        uint256 debt,
        uint256 timestamp
    );
    event IPUnlocked(
        address indexed ipId,
        address indexed owner,
        uint256 timestamp
    );
    event RoyaltiesAutoRepaid(
        address indexed ipId,
        uint256 royaltiesUsed,
        uint256 debtRepaid,
        uint256 remainingDebt,
        uint256 timestamp
    );
    event DebtFullyRepaid(
        address indexed ipId,
        uint256 excessRoyalties,
        uint256 timestamp
    );
    event RoyaltySimulatorUpdated(
        address indexed oldSimulator,
        address indexed newSimulator
    );

    constructor(
        address _royaltyToken,
        address _lendingPool
    ) Ownable(msg.sender) {
        require(_royaltyToken != address(0), "Invalid royalty token");
        require(_lendingPool != address(0), "Invalid lending pool");
        royaltyToken = IRoyaltyToken(_royaltyToken);
        lendingPool = ILendingPool(_lendingPool);
    }

    /**
     * @notice Set the royalty simulator address (only owner)
     * @param _simulator Address of the royalty simulator contract
     */
    function setRoyaltySimulator(address _simulator) external onlyOwner {
        require(_simulator != address(0), "Invalid simulator");
        address oldSimulator = royaltySimulator;
        royaltySimulator = _simulator;
        emit RoyaltySimulatorUpdated(oldSimulator, _simulator);
    }

    /**
     * @notice Lock IP for auto-repay (only IP owner)
     * @param ipId The IP identifier (address format)
     */
    function lockIP(address ipId) external nonReentrant {
        require(ipId != address(0), "Invalid IP ID");
        require(
            ipOwner[ipId] == address(0) || ipOwner[ipId] == msg.sender,
            "Not IP owner"
        );
        require(!ipLocked[ipId], "Already locked");

        // Register owner on first lock
        if (ipOwner[ipId] == address(0)) {
            ipOwner[ipId] = msg.sender;
        }

        // Get current debt from lending pool
        uint256 debt = lendingPool.getDebt(msg.sender);
        ipDebt[ipId] = debt;
        ipLocked[ipId] = true;

        emit IPLocked(ipId, msg.sender, debt, block.timestamp);
    }

    /**
     * @notice Unlock IP (only when debt = 0)
     * @param ipId The IP identifier
     */
    function unlockIP(address ipId) external nonReentrant {
        require(ipOwner[ipId] == msg.sender, "Not IP owner");
        require(ipLocked[ipId], "Not locked");

        uint256 debt = lendingPool.getDebt(msg.sender);
        require(debt == 0, "Outstanding debt exists");

        ipLocked[ipId] = false;
        ipDebt[ipId] = 0;

        emit IPUnlocked(ipId, msg.sender, block.timestamp);
    }

    /**
     * @notice Process royalties - auto-repay if locked
     * @dev Called by RoyaltySimulator. Tokens must be minted to this contract BEFORE calling this.
     * @param ipId The IP that earned royalties
     * @param amount Amount of royalty tokens minted/received
     */
    function routeRoyalties(
        address ipId,
        uint256 amount
    ) external nonReentrant {
        require(msg.sender == royaltySimulator, "Only simulator can route");

        if (!ipLocked[ipId]) {
            // Should not happen if simulator logic is correct (simulator only calls this if locked)
            return;
        }

        // Locked - auto-repay debt
        address owner = ipOwner[ipId];
        require(owner != address(0), "IP not registered");

        uint256 currentDebt = lendingPool.getDebt(owner);

        // Calculate repayment amount
        uint256 repayAmount = amount > currentDebt ? currentDebt : amount;

        if (repayAmount > 0) {
            // Approve lending pool to take tokens
            royaltyToken.approve(address(lendingPool), repayAmount);

            // Repay debt
            lendingPool.repayWithToken(
                owner,
                address(royaltyToken),
                repayAmount
            );
        }

        // Update tracked debt
        uint256 newDebt = currentDebt > repayAmount
            ? currentDebt - repayAmount
            : 0;
        ipDebt[ipId] = newDebt;

        emit RoyaltiesAutoRepaid(
            ipId,
            amount,
            repayAmount,
            newDebt,
            block.timestamp
        );

        // If excess royalties, return to IP
        if (amount > repayAmount) {
            uint256 excess = amount - repayAmount;
            require(
                royaltyToken.transfer(ipId, excess),
                "Transfer excess to IP failed"
            );
            emit DebtFullyRepaid(ipId, excess, block.timestamp);
        }
    }

    /**
     * @notice Claim existing royalties and apply to debt
     * @param ipId The IP identifier
     */
    function claimAndRepay(address ipId) external nonReentrant {
        require(ipOwner[ipId] == msg.sender, "Not IP owner");
        require(ipLocked[ipId], "IP not locked");

        uint256 royaltyBalance = royaltyToken.balanceOf(ipId);
        require(royaltyBalance > 0, "No royalties to claim");

        // Transfer royalties from IP to this contract
        require(
            royaltyToken.transferFrom(ipId, address(this), royaltyBalance),
            "Transfer from IP failed"
        );

        // Route through auto-repay logic
        uint256 currentDebt = lendingPool.getDebt(msg.sender);
        uint256 repayAmount = royaltyBalance > currentDebt
            ? currentDebt
            : royaltyBalance;

        if (repayAmount > 0) {
            royaltyToken.approve(address(lendingPool), repayAmount);
            lendingPool.repayWithToken(
                msg.sender,
                address(royaltyToken),
                repayAmount
            );
        }

        uint256 newDebt = currentDebt > repayAmount
            ? currentDebt - repayAmount
            : 0;
        ipDebt[ipId] = newDebt;

        emit RoyaltiesAutoRepaid(
            ipId,
            royaltyBalance,
            repayAmount,
            newDebt,
            block.timestamp
        );

        // Return excess to IP
        if (royaltyBalance > repayAmount) {
            uint256 excess = royaltyBalance - repayAmount;
            require(
                royaltyToken.transfer(ipId, excess),
                "Transfer excess to IP failed"
            );
            emit DebtFullyRepaid(ipId, excess, block.timestamp);
        }
    }

    /**
     * @notice Check if IP is locked
     * @param ipId The IP identifier
     * @return bool True if locked
     */
    function isIPLocked(address ipId) external view returns (bool) {
        return ipLocked[ipId];
    }

    /**
     * @notice Get IP debt
     * @param ipId The IP identifier
     * @return uint256 Current debt amount
     */
    function getIPDebt(address ipId) external view returns (uint256) {
        return ipDebt[ipId];
    }

    /**
     * @notice Get IP owner
     * @param ipId The IP identifier
     * @return address Owner address
     */
    function getIPOwner(address ipId) external view returns (address) {
        return ipOwner[ipId];
    }
}
