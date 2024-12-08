// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interface/IWETHHolder.sol";

contract WETHHolder is Ownable, IWETHHolder{
    // Accept native Ether
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    constructor(address _owner) Ownable(_owner){
    }

    // Transfer ERC20 tokens (like WETH) from this contract to another address
    function transferTokens(
        address token,
        address to
    ) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        uint256 amount = IERC20(token).balanceOf(address(this));
        require(amount > 0, "Invalid transfer amount");

        IERC20(token).transfer(to, amount);
        emit TokenWithdrawn(token, to, amount);
    }

    // Withdraw native Ether
    function withdrawEther(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Invalid withdrawal amount");
        require(address(this).balance >= amount, "Insufficient Ether balance");

        to.transfer(amount);
        emit EtherWithdrawn(to, amount);
    }

    // Get the contract's balance of a specific ERC20 token
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
