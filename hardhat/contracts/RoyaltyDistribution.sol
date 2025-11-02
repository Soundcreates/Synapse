
//SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SynTK.sol";

// Interface to interact with DataRegistry
interface IDataRegistry {
    function getContributors(uint256 _poolId) external view returns(address[] memory);
    function getContributorShare(uint256 _poolId, address _contributor) external view returns(uint256);
    function getDataPool(uint256 _poolId) external view returns(
        address creator,
        string memory ipfsHash,
        string memory metadataHash,
        uint256 pricePerAccess,
        uint256 totalContributors,
        bool isActive
    );
}

contract RoyaltyDistribution is Ownable, ReentrancyGuard {

    IDataRegistry public dataRegistry;
    SynTK public token;

    mapping(address => uint256) public pendingRoyalties;

    // Events
    event RoyaltyDistributed(uint256 indexed poolId, address indexed contributor, uint256 amount);
    event RoyaltyClaimed(address indexed contributor, uint256 amount);

    constructor(address _tokenAddr) Ownable(msg.sender) {
        token = SynTK(_tokenAddr);
    }

    // Setting dataregistry
    function setDataRegistry(address _dataRegistry) external onlyOwner {
        dataRegistry = IDataRegistry(_dataRegistry);
    }

    // Core function to distribute royalties
    function distributeRoyalties(uint256 _poolId, uint256 _totalAmount) external {
        // Checks
        require(address(dataRegistry) != address(0), "Data registry hasn't been set yet");
        require(_totalAmount > 0, "Amount must be greater than zero");

        // Getting pool data
        (address creator, , , , uint256 totalContributors, bool isActive) = dataRegistry.getDataPool(_poolId);
        require(isActive, "Pool is not active");
        require(creator != address(0), "Invalid pool");

        uint256 creatorShare = (_totalAmount * 60) / 100;  // 60% to creator
        uint256 contributorShare = (_totalAmount * 40) / 100;  // 40% to contributors

        // Transfer tokens to creator directly
        if (creatorShare > 0) {
            require(token.transfer(creator, creatorShare), "Creator payment failed");
            emit RoyaltyDistributed(_poolId, creator, creatorShare);
        }

        // Adding to pending royalties for contributors
        if (totalContributors > 0 && contributorShare > 0) {
            address[] memory contributors = dataRegistry.getContributors(_poolId);
            uint256 sharePerContributor = contributorShare / totalContributors;
            
            for (uint256 i = 0; i < contributors.length; i++) {
                pendingRoyalties[contributors[i]] += sharePerContributor;
                emit RoyaltyDistributed(_poolId, contributors[i], sharePerContributor);
            }
        }
    }

    function claimRoyalties() external nonReentrant {
        uint256 amount = pendingRoyalties[msg.sender];
        require(amount > 0, "No royalties to claim");

        pendingRoyalties[msg.sender] = 0;
        
        // Transfer tokens from this contract to the claimer
        require(token.transfer(msg.sender, amount), "Token transfer failed");

        emit RoyaltyClaimed(msg.sender, amount);
    }

    // Emergency withdraw function for owner
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Receive function to accept ether
    receive() external payable {}
}
