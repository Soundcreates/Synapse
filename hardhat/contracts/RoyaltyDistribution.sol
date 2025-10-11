//SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "./DataRegistry.sol";

contract RoyaltyDistribution{

//setting up interface to interact with Dataregistry
interface IDataRegistry{
function getContributors(uint256 _poolId) external view returns(address[] memory);
function getContributorShare(uint256 _poolId, address _contributor) external view returns(uint256);
function getDataPool(uint _poolId) external view returns {
address creator,
uint totalContributors,
bool isActive,
uint pricePerAccess
}
}

IDataRegistry public dataRegistry;

constructor(){}


mapping(address => uint) public pendingRoyalties;
// mapping(uint => mapping(address => uint)) public poolContributions;

//events
event RoyaltyDistributed(uint indexed poolId, address indexed contributor, uint amount);
event RoyaltyClaimed( address indexed contributor, uint amount);

//functions

//setting dataregistry
function setDataRegistry(address _dataRegistry) external onlyOwner{
  dataRegistry = IDataRegistry(_dataRegistry);
}

//contract core functions from here

function distributeRoyalties(uint \_poolId, uint \_totalAmount)external {
//TODO: Implementation details -status : Done
//checks
require(address(dataRegistry) != address(0), "Data registry hasnt been set yet");


//getting pool creator
  (address creator, , , , uint totalContributors, bool isActive) = dataRegistry.getDataPool(_poolId);
  require(isActive, "Pool is not active");
  require(creator != address(0), "Invalid pool");

    uint creatorShare = (_amount * 60) /100;
    uint sharePerContributor = (_amount * 40) / 100;

  //paying creator
  if(creatorShare >  0) {
    (bool s1, ) = payable(creator).call{value: _amount}("");
    require(s1);
    emit RoyaltyDistributed(_poolId, creator, creatorShare);
  }
    
    //paying the contributors
    if(totalContributors > 0 && contributorShare > 0){
      address[] contributors = dataRegistry.getContributors(_poolId);
      uint contributorShare = sharePerContributor / totalContributors; // a naming mismatch, contributorShare is whats given to each contributor and the share perContributor thingy is the total amount allocated as a whole for contributors (sorry gng)
      for(uint i = 0; i < totalContributors; i++){
        require(pendingRoyalties[contributors[i]] > 0 , "There is no share to distribute to this contributor"]);
        (bool s1, ) = payable(contributors[i]).call{value: contributorShare}("");
        require(s1);
        emit RoyaltiesDistributed(_poolId, contributors[i], contributorShare);
      }
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

//receive function (important) to accept ether
  receive() external payable {}
}
