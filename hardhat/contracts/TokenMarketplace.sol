// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TokenMarketplace {
    IToken public token; 
    address public owner;

    // Defining the token price (u get the math gng)
    uint256 public constant TOKEN_PRICE = 1e14;

    constructor(address _owner) {
        owner = _owner;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Not the owner, access revoked!");
        _;
    }

    // Events
    event TokenPurchased(uint256 tokenAmount, address purchaser);
    event Withdrawn(uint256 amount);

    // Set the token contract
    function setToken(address _token) external onlyOwner {
        token = IToken(_token);
    }

    // Buy tokens with ETH
    function buyTokens(uint256 _tokenAmount, address _receiver) external payable {
        uint256 cost = _tokenAmount * TOKEN_PRICE;

        require(msg.value == cost, "Incorrect ETH sent");
        require(token.balanceOf(address(this)) >= _tokenAmount, "Not enough tokens in contract");

        // Transfer tokens to buyer
        bool success = token.transfer(_receiver, _tokenAmount);
        require(success, "Token transfer failed");

        emit TokenPurchased(_tokenAmount, _receiver);
    }

    // Withdraw all ETH from the contract
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");

        (bool sent, ) = payable(owner).call{value: balance}("");
        require(sent, "Withdraw failed");

        emit Withdrawn(balance);
    }

    // Allow the contract to receive ETH
    receive() external payable {}
}
