// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MockERC20.sol";

contract MockUSDC is MockERC20 {
    // Initial supply of 1,000,000 USDC (with 6 decimals)
    constructor() MockERC20("USD Coin", "USDC", 6, 1000000 * 10**6) {}
}
