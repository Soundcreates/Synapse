//SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract DataRegistry is Ownable, ReentrancyGuard, Pausable{
struct DataPool {
address creator;
string ipfsHash;
string metadataHash;
uint256 pricePerAccess;
uint256 totalContributors;
bool isActive;
mapping(address => uint256) constributorShares;
}

    mapping(uint256 => DataPool) public dataPools;
    mapping(address => uint[]) public creatorPools;
    uint256 public nextPoolId;

    event DataPoolCreated(uint256 indexed poolId, address indexed creator, string ipfsHash);
    event DataPurchased(uint256 indexed poolId, address indexed buyer, uint amount);
    event ContributionAdded(uint indexed poolId, address indexed contributor, uint share);

    function createDataPool(string memory _ipfsHash, string memory _metaDataHash, uint256 _pricePerAccess) external returns(uint256){
        require(bytes(_ipfsHash).length >= 0, "Invalid Ipfs hash");
        require(_pricePerAccess > 0, "Price must be greater than zero");

        uint256 poolId = nextPoolId++;
        DataPool storage pool= dataPools[poolId];
        pool.creator = msg.sender;
        pool.ipfsHash = _ipfsHash;
        pool.metadataHash = _metaDataHash;
        pool.pricePerAccess = _pricePerAccess;
        pool.isActive = true;

        creatorPools[msg.sender].push(poolId);

        emit DataPoolCreated(poolId, msg.sender, _ipfsHash);

    }

    function purchaseDataAccess(uint256 _poolId) external payable nonReentrant {
        DataPool storage pool = dataPools[_poolId];
        require(pool.isActive, "Pool is not active");
        require(msg.value >= pool.pricePerAccess, "Please provide the specified amount");



        _distributeRoyalties(_poolId, msg.value);

        emit DataPurchased(_poolId, msg.sender, msg.value);

    }

    function _distributeRoyalties(uint _poolId, uint _amount) internal{

    }

}
