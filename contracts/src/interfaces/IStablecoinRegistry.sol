// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStablecoinRegistry {
    function isAllowed(address token) external view returns (bool);
}
