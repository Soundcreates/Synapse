//SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;



interface IToken {
  function transfer(address to, uint256 amount)external returns (bool);
}

contract TokenMarketplace{
  IToken public tokens;
  address public owner;

  constructor(address _owner){
    owner = _owner;
  }

  modifier onlyOwner {
    require(msg.sender == owner, "Not the owner, access revoked!");
    _;
  }

  function setToken(address _token) external onlyOwner{
    tokens = IToken(_token);
  }

  function BuyTokens(uint _amount, address _receiver) external{
    tokens.transfer(_receiver, _amount);
  }
}