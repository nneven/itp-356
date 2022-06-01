//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IDeBay {
    event AuctionStarted(bytes32 auctionId);
    event Bid(bytes32 auctionId, address bidder, uint256 bid);
    event AuctionEnded(bytes32 auctionId, address winner, uint256 winningBid);

    /**
     * @dev Starts an auction, emits event AuctionStarted
     * Must check if auction already exists
     */
    function startAuction(
        string calldata name,
        string calldata imgUrl,
        string calldata description,
        uint256 floor, // Minimum bid price
        uint256 deadline // To be compared with block.timestamp
    ) external;

    /**
     * @dev Bids on an auction using external funds, emits event Bid
     * Must check if auction exists && auction hasn't ended && bid isn't too low
     */
    function bid(bytes32 auctionId) external payable;

    /**
     * @dev Bids on an auction using existing funds, emits event Bid
     * Must check if auction exists && auction hasn't ended && bid isn't too low
     */
    function bid(bytes32 auctionId, uint256 amount) external;

    /**
     * @dev Settles an auction, emits event AuctionEnded
     * Must check if auction has already ended
     */
    function settle(bytes32 auctionId) external;

    /**
     * @dev Users can deposit more funds into the contract to be used for future bids
     */
    function deposit() external payable;

    /**
     * @dev Users can withdraw funds that were previously deposited
     */
    function withdraw() external;
}

contract DeBay is Ownable, Pausable, IDeBay {
    struct Auction {
        string name;
        address initiator;
        address topBidder;
        string imageUrl;
        string description;
        uint256 floor;
        uint256 deadline;
        bool isAlive;
    }
    mapping(bytes32 => Auction) private _auctions;
    mapping(address => uint256) private _deposits;

    /**
     * @dev Starts an auction, emits event AuctionStarted
     * Must check if auction already exists
     */
    function startAuction(
        string calldata name,
        string calldata imgUrl,
        string calldata description,
        uint256 floor,
        uint256 deadline
    ) external override {
        bytes32 auctionId = getAuctionId(
            _msgSender(),
            deadline,
            name,
            imgUrl,
            description
        );
        Auction storage a = _auctions[auctionId];
        require(
            !a.isAlive && a.initiator == address(0),
            "Auction already exists"
        );
        a.name = name;
        a.initiator = _msgSender();
        a.imageUrl = imgUrl;
        a.description = description;
        a.floor = floor;
        a.deadline = deadline;
        a.isAlive = true;
        emit AuctionStarted(auctionId);
    }

    /**
     * @dev Bids on an auction using external funds, emits event Bid
     * Must check if auction exists && auction hasn't ended && bid isn't too low
     */
    function bid(bytes32 auctionId) external payable override {
        Auction storage a = _auctions[auctionId];
        require(a.initiator != address(0), "Auction does not exist");
        require(a.isAlive, "Auction already ended");
        require(msg.value > a.floor, "Bid is too low");
        require(a.deadline > block.timestamp, "Deadline has passed");
        require(a.initiator != _msgSender(), "Cannot be auction owner");
        _deposits[a.topBidder] += a.floor;
        a.floor = msg.value;
        a.topBidder = _msgSender();
        emit Bid(auctionId, _msgSender(), msg.value);
    }

    /**
     * @dev Bids on an auction using external funds, emits event Bid
     * Must check if auction exists && auction hasn't ended && bid isn't too low
     */
    function bid(bytes32 auctionId, uint256 amount) external override {
        Auction storage a = _auctions[auctionId];
        require(a.initiator != address(0), "Auction does not exist");
        require(a.isAlive, "Auction already ended");
        require(amount > a.floor, "Bid is too low");
        require(a.deadline > block.timestamp, "Deadline has passed");
        require(a.initiator != _msgSender(), "Cannot be auction owner");
        require(_deposits[_msgSender()] > amount, "Not enough funds deposited");
        _deposits[a.topBidder] += a.floor;
        a.floor = amount;
        a.topBidder = _msgSender();
        _deposits[_msgSender()] -= amount;
        emit Bid(auctionId, _msgSender(), amount);
    }

    /**
     * @dev Settles an auction, emits event AuctionEnded
     * Must check if auction has already ended
     */
    function settle(bytes32 auctionId) external override {
        Auction storage a = _auctions[auctionId];
        require(a.isAlive, "Auction already ended");
        require(a.deadline < block.timestamp, "Deadline not passed");
        require(a.initiator == _msgSender(), "Must be auction owner");
        a.isAlive = false;
        payable(a.initiator).transfer(a.floor);
        emit AuctionEnded(auctionId, a.topBidder, a.floor);
    }

    /**
     * @dev Users can deposit more funds into the contract to be used for future bids
     */
    function deposit() external payable override {
        _deposits[_msgSender()] += msg.value;
    }

    /**
     * @dev Users can withdraw funds that were previously deposited
     */
    function withdraw() external override {
        require(_deposits[_msgSender()] > 0, "No funds to withdraw");
        payable(_msgSender()).transfer(_deposits[_msgSender()]);
    }

    function getAuctionId(
        address initiator,
        uint256 deadline,
        string calldata name,
        string calldata imgUrl,
        string calldata description
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(initiator, deadline, name, imgUrl, description)
            );
    }
}
