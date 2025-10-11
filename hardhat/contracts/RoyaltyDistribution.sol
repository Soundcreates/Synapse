//SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

contract RoyaltyDistribution{
  mapping(address => uint) public pendingRoyalties;
  // mapping(uint => mapping(address => uint)) public poolContributions;

  //events
  event RoyaltyDistributed(uint indexed poolId, address indexed contributor, uint amount);
  event RoyaltyClaimed( address indexed contributor, uint amount);


  //functions

  function distributeRoyalties(uint _poolId, uint _totalAmount)external  {
    //TODO: Implementation details
    uint contributorCount = poolContributions[_poolId][msg.sender];

    uint sharePerContributor = _totalAmount/ contributorCount;

    for(uint i =0; i  < contributorCount; i++){
      address contributor = contributors[i];
      pendingRoyalties[contributor] += sharePerContributor;
      emit RoyaltyDistributed(_poolId, contributor, sharePerContributor);

    }

  }

  function claimRoyalties() external nonReentrant{
    uint amount =pendingRoyalties[msg.sender];
    require(amount >= 0, "No royalties to claim");

    pendingRoyalties[msg.sender] = 0;
    (bool s1, ) = payable(msg.sender).call{value: amount}("");
    require(s1);

    emit RoyaltyClaimed(msg.sender, amount);
  }




}