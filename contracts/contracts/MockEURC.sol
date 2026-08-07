// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MockERC20.sol";

contract MockEURC is MockERC20 {
    // Initial supply of 1,000,000 EURC (with 6 decimals)
    constructor() MockERC20("Euro Coin", "EURC", 6, 1000000 * 10**6) {}
}
