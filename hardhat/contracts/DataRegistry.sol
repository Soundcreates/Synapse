//SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "./RoyaltyDistribution.sol";

interface IToken{
function balanceOf(address account) external view returns (uint256);
function transfer(address to, uint256 amount) external returns (bool);
function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract DataRegistry is Ownable, ReentrancyGuard, Pausable {

    //creating the token instance
    IToken public token;

struct DataPool {
address creator;
string ipfsHash;
string metadataHash;
uint256 pricePerAccess;
uint256 totalContributors;
bool isActive;
uint256 bankBalance;
mapping(address => uint256) contributorStakes;
address[] contributors;
}

    RoyaltyDistribution public royaltyDistributor;

    mapping(uint256 => DataPool) public dataPools;
    mapping(address => uint256[]) public creatorPools;
    mapping(uint => mapping(address => uint)) pendingStakes;
    uint256 public nextPoolId = 1;


    event DataPoolCreated(uint256 indexed poolId, address indexed creator, string ipfsHash);
    event DataPurchased(uint256 indexed poolId, address indexed buyer, uint256 tokenAmount);
    event ContributionAdded(uint256 indexed poolId, address indexed contributor, uint256 share);
    event ContributorAssigned(uint256 indexed poolId, address indexed contributor, uint256 totalContributors); // Fixed event name and types
    event contributorHasStaked(uint256 indexed poolId, address indexed contributor, uint256 stakedAmount);
    event stakeAccepted(uint256 indexed poolId, address indexed contributor);
    event stakeRejected(address indexed contributor, uint256 stakedAmount);
    event stakeWithdrawn(uint256 indexed poolId, address indexed contributor, uint256 stakedAmount);

    constructor(address payable _royaltyDistribution, address _tokenAddr) Ownable(msg.sender) {
        royaltyDistributor = RoyaltyDistribution(_royaltyDistribution);
        token = IToken(_tokenAddr);
    }

    function createDataPool(
        string memory _ipfsHash,
        string memory _metaDataHash,
        uint256 _pricePerAccess
    ) external returns(uint256) {
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");
        require(_pricePerAccess > 0, "Price must be greater than zero");

        uint256 poolId = nextPoolId++; //this is the incremented value after 0 which is 1 (initial dataset)
        DataPool storage pool = dataPools[poolId];
        pool.creator = msg.sender;
        pool.ipfsHash = _ipfsHash;
        pool.metadataHash = _metaDataHash;
        pool.pricePerAccess = _pricePerAccess; // Fixed: missing assignment
        pool.isActive = true;
        pool.bankBalance = 0;


        creatorPools[msg.sender].push(poolId);

        emit DataPoolCreated(poolId, msg.sender, _ipfsHash);

        return poolId;
    }

    //contributor side
    //stake function
    function contributorStake(uint256 _stakeAmount, uint256 _poolId) external whenNotPaused {
        require(_stakeAmount > 0, "Stake amount should be greater than zero");
        require(dataPools[_poolId].creator != address(0), "Pool does not exist");
        require(dataPools[_poolId].isActive, "Pool is not active");
        require(pendingStakes[_poolId][msg.sender] == 0, "Stake already pending");

        require(token.balanceOf(msg.sender) >= _stakeAmount, "Insufficient funds to stake");
        require(token.transferFrom(msg.sender, address(this), _stakeAmount), "Token transfer failed");

        pendingStakes[_poolId][msg.sender] = _stakeAmount;
        emit contributorHasStaked(_poolId, msg.sender, _stakeAmount);
    }

    function acceptStake(uint256 _poolId, address _contributor) external {
        DataPool storage pool = dataPools[_poolId];
        require(msg.sender == pool.creator, "Only pool creator can accept stakes");
        require(pendingStakes[_poolId][_contributor] > 0, "The specified contributor hasn't staked");

        uint256 stakedAmount = pendingStakes[_poolId][_contributor];

        // Add to contributors array if not already present
        bool isNewContributor = true;
        for(uint256 i = 0; i < pool.contributors.length; i++) {
            if(pool.contributors[i] == _contributor) {
                isNewContributor = false;
                break;
            }
        }

        if(isNewContributor) {
            pool.contributors.push(_contributor);
            pool.totalContributors++;
        }

        pool.contributorStakes[_contributor] += stakedAmount;
        pool.bankBalance += stakedAmount;

        // Clear pending stake
        delete pendingStakes[_poolId][_contributor];

        emit stakeAccepted(_poolId, _contributor);
    }

    function rejectStake(uint256 _poolId, address _contributor) external {
        DataPool storage pool = dataPools[_poolId];
        require(msg.sender == pool.creator, "Only pool creator can reject stakes");
        require(pendingStakes[_poolId][_contributor] > 0, "This specific address hasn't staked for contribution in this dataset");

        uint256 stakedAmount = pendingStakes[_poolId][_contributor];

        // Clear pending stake
        delete pendingStakes[_poolId][_contributor];

        // Return tokens to contributor
        require(token.transfer(_contributor, stakedAmount), "Token transfer failed");

        emit stakeRejected(_contributor, stakedAmount);
    }

    // Allow contributors to withdraw their own pending stakes
    function withdrawStake(uint256 _poolId) external {
        require(pendingStakes[_poolId][msg.sender] > 0, "You don't have any pending stake for this pool");
        
        uint256 stakedAmount = pendingStakes[_poolId][msg.sender];
        
        // Clear pending stake
        delete pendingStakes[_poolId][msg.sender];
        
        // Return tokens to contributor
        require(token.transfer(msg.sender, stakedAmount), "Token transfer failed");
        
        emit stakeWithdrawn(_poolId, msg.sender, stakedAmount);
    }

    function assignContributors(uint256 _poolId, address _contributor) external {
        DataPool storage pool = dataPools[_poolId];
        require(pendingStakes[_poolId][msg.sender] > 0, "Contributor hasnt been accepted yet!");
        require(pool.isActive, "The data pool isn't active at this moment");


            pool.totalContributors++;
            pool.contributors.push(_contributor);
            emit ContributorAssigned(_poolId, _contributor, pool.totalContributors);

    }

    function purchaseDataAccess(uint256 _poolId) external nonReentrant whenNotPaused {
        DataPool storage pool = dataPools[_poolId];
        require(pool.isActive, "Pool is not active");
        require(msg.sender != pool.creator, "Creator cannot purchase their own data");

        // Price is already in token units (with 18 decimals)
        uint256 tokensNeeded = pool.pricePerAccess;

        require(token.balanceOf(msg.sender) >= tokensNeeded, "Insufficient token balance to purchase data access");

        // Transfer tokens from buyer to this contract
        require(token.transferFrom(msg.sender, address(this), tokensNeeded), "Token transfer failed");

        // Transfer tokens to RoyaltyDistribution contract for distribution
        require(token.transfer(address(royaltyDistributor), tokensNeeded), "Transfer to royalty distributor failed");

        _distributeRoyalties(_poolId, tokensNeeded);

        emit DataPurchased(_poolId, msg.sender, tokensNeeded);
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
        return dataPools[_poolId].contributorStakes[_contributor];
    }

    function getContributors(uint256 _poolId) external view returns(address[] memory) {
        return dataPools[_poolId].contributors;
    }

    function getPendingStake(uint256 _poolId, address _contributor) external view returns(uint256) {
        return pendingStakes[_poolId][_contributor];
    }

    function getContributorStake(uint256 _poolId, address _contributor) external view returns(uint256) {
        return dataPools[_poolId].contributorStakes[_contributor];
    }

}
