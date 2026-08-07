// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Test only: pulls Chainlink's VRF coordinator mock into the compilation so the
// test suite can deploy it as an artifact.
import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";
