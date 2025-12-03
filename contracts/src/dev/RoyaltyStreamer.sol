// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RoyaltyStreamer
 * @notice DEV-ONLY contract for simulating continuous royalty streams on local Anvil
 * @dev This contract should NEVER be deployed to production networks
 */
contract RoyaltyStreamer is Ownable {
    struct Stream {
        address recipient;
        IERC20 token;
        uint256 totalAmount;
        uint256 amountPaid;
        uint256 startTime;
        uint256 endTime;
        bool active;
    }
    
    mapping(address => Stream) public streams; // ipAsset => Stream
    address[] public activeStreams;
    
    event StreamStarted(address indexed ipAsset, address indexed recipient, uint256 totalAmount, uint256 duration);
    event StreamTicked(address indexed ipAsset, uint256 amount);
    event StreamCompleted(address indexed ipAsset);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Start a royalty stream for an IP asset
     * @param ipAsset IP asset address
     * @param recipient Recipient address (IPManager)
     * @param token Token to stream
     * @param totalAmount Total amount to stream
     * @param durationSeconds Duration in seconds
     */
    function startStream(
        address ipAsset,
        address recipient,
        IERC20 token,
        uint256 totalAmount,
        uint256 durationSeconds
    ) external onlyOwner {
        require(!streams[ipAsset].active, "Stream already active");
        require(totalAmount > 0, "Amount must be > 0");
        require(durationSeconds > 0, "Duration must be > 0");
        
        // Transfer tokens to this contract
        require(token.transferFrom(msg.sender, address(this), totalAmount), "Transfer failed");
        
        streams[ipAsset] = Stream({
            recipient: recipient,
            token: token,
            totalAmount: totalAmount,
            amountPaid: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + durationSeconds,
            active: true
        });
        
        activeStreams.push(ipAsset);
        
        emit StreamStarted(ipAsset, recipient, totalAmount, durationSeconds);
    }
    
    /**
     * @notice Process all active streams (call this periodically)
     * @dev Calculates pro-rata payments based on time elapsed
     */
    function triggerStreams() external {
        for (uint256 i = 0; i < activeStreams.length; i++) {
            address ipAsset = activeStreams[i];
            Stream storage stream = streams[ipAsset];
            
            if (!stream.active) continue;
            
            uint256 elapsed = block.timestamp - stream.startTime;
            uint256 duration = stream.endTime - stream.startTime;
            
            // Calculate how much should have been paid by now
            uint256 shouldHavePaid;
            if (block.timestamp >= stream.endTime) {
                shouldHavePaid = stream.totalAmount;
            } else {
                shouldHavePaid = (stream.totalAmount * elapsed) / duration;
            }
            
            // Calculate payment for this tick
            uint256 payment = shouldHavePaid - stream.amountPaid;
            
            if (payment > 0) {
                stream.amountPaid += payment;
                require(stream.token.transfer(stream.recipient, payment), "Transfer failed");
                emit StreamTicked(ipAsset, payment);
            }
            
            // Complete stream if finished
            if (stream.amountPaid >= stream.totalAmount || block.timestamp >= stream.endTime) {
                stream.active = false;
                emit StreamCompleted(ipAsset);
            }
        }
    }
    
    /**
     * @notice Force drain remaining balance for an IP (dev helper)
     * @param ipAsset IP asset address
     */
    function forceDrain(address ipAsset) external onlyOwner {
        Stream storage stream = streams[ipAsset];
        require(stream.active, "Stream not active");
        
        uint256 remaining = stream.totalAmount - stream.amountPaid;
        if (remaining > 0) {
            stream.amountPaid = stream.totalAmount;
            require(stream.token.transfer(stream.recipient, remaining), "Transfer failed");
            emit StreamTicked(ipAsset, remaining);
        }
        
        stream.active = false;
        emit StreamCompleted(ipAsset);
    }
    
    /**
     * @notice Get active stream count
     */
    function getActiveStreamCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < activeStreams.length; i++) {
            if (streams[activeStreams[i]].active) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @notice Get stream info
     */
    function getStreamInfo(address ipAsset) external view returns (
        address recipient,
        uint256 totalAmount,
        uint256 amountPaid,
        uint256 startTime,
        uint256 endTime,
        bool active
    ) {
        Stream memory stream = streams[ipAsset];
        return (
            stream.recipient,
            stream.totalAmount,
            stream.amountPaid,
            stream.startTime,
            stream.endTime,
            stream.active
        );
    }
}
