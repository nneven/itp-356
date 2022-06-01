//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/**
 * You MUST implement the logic in a separate file
 * You MUST name the contract Shop
 */
abstract contract IShop {
    event ItemAdded(bytes32 sku);
    event ItemEdited(bytes32 sku);
    event ItemDisabled(bytes32 sku);
    event ItemEnabled(bytes32 sku);
    event ItemRestocked(bytes32 sku, uint256 amount);
    event ItemBought(bytes32 sku, uint256 amount, address buyer);

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
    ) external virtual;

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
    ) external virtual;

    /**
     * @dev Disables an item so it cannot be purchased
     *
     * Emits: ItemDisabled
     */
    function disableItem(bytes32 sku) external virtual;

    /**
     * @dev Enables an item so it can be purchased
     *
     * Emits: ItemEnabled
     */
    function enableItem(bytes32 sku) external virtual;

    /**
     * @dev Restocks an item
     *
     * Emits: ItemRestocked
     */
    function restockItem(bytes32 sku, uint256 amount) external virtual;

    /**
     * @dev Administrator can withdraw shop proceeds
     */
    function withdraw() external virtual;

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
    ) external payable virtual;

    /**
     * @dev Returns information regarding an item
     */
    function getItem(bytes32 sku)
        external
        view
        virtual
        returns (
            string memory name,
            string memory imageUrl,
            string memory description,
            uint256 amount,
            uint256 price,
            uint256 points,
            bool disabled
        );

    /**
     * @dev Returns membership point information for a user
     */
    function getPoints(address user) external view virtual returns (uint256);

    function generateSku(string memory name) public pure returns (bytes32) {
        return keccak256(abi.encode(name));
    }
}
