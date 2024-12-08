// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWETHHolder {
    // Events
    event Received(address indexed from, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed to, uint256 amount);
    event EtherWithdrawn(address indexed to, uint256 amount);

    // Functions
    function transferTokens(
        address token,
        address to
    ) external;

    function withdrawEther(address payable to, uint256 amount) external;

    function getTokenBalance(address token) external view returns (uint256);
}
