//SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";


import "./RoyaltyDistribution.sol";

contract DataRegistry is Ownable, ReentrancyGuard, Pausable {
    struct DataPool {
        address creator;
        string ipfsHash;
        string metadataHash;
        uint256 pricePerAccess;
        uint256 totalContributors;
        bool isActive;
        mapping(address => uint256) contributorShares;
        address[] contributors;
    }

    RoyaltyDistribution public royaltyDistributor;

    mapping(uint256 => DataPool) public dataPools;
    mapping(address => uint256[]) public creatorPools;
    uint256 public nextPoolId;

    event DataPoolCreated(uint256 indexed poolId, address indexed creator, string ipfsHash);
    event DataPurchased(uint256 indexed poolId, address indexed buyer, uint256 amount);
    event ContributionAdded(uint256 indexed poolId, address indexed contributor, uint256 share);
    event ContributorAssigned(uint256 indexed poolId, address indexed contributor, uint256 totalContributors); // Fixed event name and types

    constructor(address _royaltyDistribution) {
        royaltyDistributor = RoyaltyDistribution(_royaltyDistribution);
    }

    function createDataPool(
        string memory _ipfsHash,
        string memory _metaDataHash,
        uint256 _pricePerAccess
    ) external returns(uint256) {
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");
        require(_pricePerAccess > 0, "Price must be greater than zero");

        uint256 poolId = nextPoolId++;
        DataPool storage pool = dataPools[poolId];
        pool.creator = msg.sender;
        pool.ipfsHash = _ipfsHash;
        pool.metadataHash = _metaDataHash;
        pool.pricePerAccess = _pricePerAccess; // Fixed: missing assignment
        pool.isActive = true;

        creatorPools[msg.sender].push(poolId);

        emit DataPoolCreated(poolId, msg.sender, _ipfsHash);

        return poolId;
    }

    function assignContributors(uint256 _poolId, address[] memory _contributorsList) external { 
        DataPool storage pool = dataPools[_poolId];
        require(_contributorsList.length > 0, "No contributors are assigned, reverting");
        require(pool.isActive, "The data pool isn't active at this moment");

        for(uint256 i = 0; i < _contributorsList.length; i++){
            pool.totalContributors++;
            pool.contributors.push(_contributorsList[i]);
            emit ContributorAssigned(_poolId, _contributorsList[i], pool.totalContributors); 
        }
    }

    function purchaseDataAccess(uint256 _poolId) external payable nonReentrant {
        DataPool storage pool = dataPools[_poolId];
        require(pool.isActive, "Pool is not active");
        require(msg.value >= pool.pricePerAccess, "Please provide the specified amount");

        _distributeRoyalties(_poolId, msg.value);

        emit DataPurchased(_poolId, msg.sender, msg.value);
    }

    function _distributeRoyalties(uint256 _poolId, uint256 _amount) internal {
        royaltyDistributor.distributeRoyalties(_poolId, _amount);
    }

    function getDataPool(uint256 _poolId) external view returns(
        address creator,
        string memory ipfsHash,
        string memory metadataHash,
        uint256 pricePerAccess,
        uint256 totalContributors,
        bool isActive
    ) {
        DataPool storage pool = dataPools[_poolId];
        return (
            pool.creator,
            pool.ipfsHash,
            pool.metadataHash,
            pool.pricePerAccess,
            pool.totalContributors,
            pool.isActive
        );
    }

    function getContributorShare(uint256 _poolId, address _contributor) external view returns(uint256) {
        return dataPools[_poolId].contributorShares[_contributor];
    }

    function getContributors(uint256 _poolId) external view returns(address[] memory) {
        return dataPools[_poolId].contributors;
    }
}