//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./IShop.sol";

contract Shop is IShop {
    struct Item {
        string name;
        string imageUrl;
        string description;
        uint256 amount;
        uint256 price;
        uint256 points;
        bool disabled;
    }
    mapping(bytes32 => Item) private _items;
    mapping(address => uint256) private _points;

    /**
     * @dev Adds a new item
     * Must check if item already exists with revert message "Item exists"
     *
     * Emits: ItemAdded, ItemRestocked
     */
    function addItem(
        string calldata name,
        string calldata imageUrl,
        string calldata description,
        uint256 amount,
        uint256 price,
        uint256 points
    ) external override {
        bytes32 sku = generateSku(name);
        Item storage item = _items[sku];
        require(bytes(item.name).length == 0, "Item exists");
        item.name = name;
        item.imageUrl = imageUrl;
        item.description = description;
        item.amount = amount;
        item.price = price;
        item.points = points;
        item.disabled = false;
        emit ItemAdded(sku);
        emit ItemRestocked(sku, amount);
    }

    /**
     * @dev Edits an existing item
     * Must check if item already exists with revert message "Item doesn't exist"
     *
     * This isn't the most efficient way of doing things, I am aware
     *
     * Emits: ItemEdited
     */
    function editItem(
        bytes32 sku,
        string calldata imageUrl,
        string calldata description,
        uint256 price,
        uint256 points
    ) external override {
        Item storage item = _items[sku];
        require(bytes(item.name).length != 0, "Item doesn't exists");
        item.imageUrl = imageUrl;
        item.description = description;
        item.price = price;
        item.points = points;
        emit ItemEdited(sku);
    }

    /**
     * @dev Disables an item so it cannot be purchased
     *
     * Emits: ItemDisabled
     */
    function disableItem(bytes32 sku) external override {
        Item storage item = _items[sku];
        item.disabled = true;
        emit ItemDisabled(sku);
    }

    /**
     * @dev Enables an item so it can be purchased
     *
     * Emits: ItemEnabled
     */
    function enableItem(bytes32 sku) external override {
        Item storage item = _items[sku];
        item.disabled = false;
        emit ItemEnabled(sku);
    }

    /**
     * @dev Restocks an item
     *
     * Emits: ItemRestocked
     */
    function restockItem(bytes32 sku, uint256 amount) external override {
        Item storage item = _items[sku];
        require(bytes(item.name).length != 0, "Item doesn't exists");
        item.amount += amount;
        emit ItemRestocked(sku, amount);
    }

    /**
     * @dev Administrator can withdraw shop proceeds
     */
    function withdraw() external override {
        payable(msg.sender).transfer(address(this).balance);
    }

    /**
     * @dev Shopper can buy an item with Ether or points
     * Must check if item already exists & isn't disabled
     * Shopper cannot mix Ether and points (all Ether or all points)
     *
     * Emits: ItemBought
     */
    function buy(
        bytes32 sku,
        uint256 amount,
        bool usePoints
    ) external payable override {
        Item storage item = _items[sku];
        require(!item.disabled, "Item disabled");  
        require(bytes(item.name).length != 0, "Item doesn't exists");
        require(amount > 0 && item.amount >= amount, "Invalid amount");
        require(usePoints == false || msg.value == 0, "Don't send Ether");
        if (usePoints) {
            require(_points[msg.sender] == item.points * amount, "Not enough points");
            _points[msg.sender] -= item.points * amount;
        } else {
            require(msg.value == item.price * amount, "Bad Ether value");
        }
        item.amount -= amount;
        _points[msg.sender] += item.points * amount;
        emit ItemBought(sku, amount, msg.sender);
    }

    /**
     * @dev Returns information regarding an item
     */
    function getItem(bytes32 sku)
        external
        view
        override
        returns (
            string memory name,
            string memory imageUrl,
            string memory description,
            uint256 amount,
            uint256 price,
            uint256 points,
            bool disabled
        )
    {
        Item storage item = _items[sku];
        return (item.name, item.imageUrl, item.description, item.amount, item.price, item.points, item.disabled);
    }

    /**
     * @dev Returns membership point information for a user
     */
    function getPoints(address user) external view override returns (uint256) {
        return _points[user];
    }

    // function generateSku(string memory name) public pure returns (bytes32) {
    //     return keccak256(abi.encode(name));
    // }
}