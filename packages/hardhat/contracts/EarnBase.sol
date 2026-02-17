// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

interface IERC8004Reputation {
    function recordContribution(
        address contributor,
        bytes32 context,
        uint256 weight
    ) external;

    function recordAgentAction(
        address agent,
        bytes32 context,
        uint256 score
    ) external;

    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external;
}

contract EarnBaseV2 is Initializable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public USDC;
    IERC8004Reputation public reputationRegistry;
    
    // Agents
    address public authorisedAgent; // Backend operations (payouts, completion)
    address public feedbackAgent;   // Request creation (earnbase feedback agent)

    uint256 public platformFeeBps;

    // 8004 Public Registry Integration
    IERC8004Reputation public publicReputationRegistry;
    uint256 public publicAgentId;

    enum RequestStatus {
        Pending,
        InProgress,
        Completed,
        Cancelled
    }

    struct FeedbackRequest {
        bytes32 requestId;
        address requester;
        uint256 escrowAmount;
        uint256 participantCount;
        uint256 createdAt;
        RequestStatus status;

        // Proof data
        bytes32 resultsHash;
        bytes32 merkleRoot;

        uint256 avgLatency;
        uint256 completionRate;
        
        // Tags for public registry
        string[] tags;
    }

    mapping(bytes32 => FeedbackRequest) public requests;
    mapping(bytes32 => uint256) public requestPayouts;
    mapping(bytes32 => bool) public fundsWithdrawn;

    /// Fired when request is funded (x402-compatible)
    event FeedbackRequestCreated(
        bytes32 indexed requestId,
        address indexed requester,
        uint256 amount,
        uint256 participantCount
    );

    /// Fired when funds are distributed
    event ContributorPaid(
        bytes32 indexed requestId,
        address indexed contributor,
        uint256 amount
    );

    /// Fired once when agent submits final results
    event FeedbackRequestCompleted(
        bytes32 indexed requestId,
        bytes32 resultsHash,
        bytes32 merkleRoot,
        uint256 participants,
        uint256 completionRate,
        uint256 avgLatencySeconds
    );
    
    event FeedbackRequestCancelled(bytes32 indexed requestId);
    event FundsWithdrawn(bytes32 indexed requestId, address indexed requester, uint256 amount);

    /// ERC-8004 hook events (Selfclaw / 8004Scan)
    event ERC8004ContributorReputation(
        address indexed contributor,
        bytes32 indexed requestId,
        uint256 weight
    );

    event ERC8004AgentReputation(
        address indexed agent,
        bytes32 indexed requestId,
        uint256 score
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _owner,
        address _usdc,
        address _authAgent,
        address _feedbackAgent,
        address _reputation,
        address _publicReputation,
        uint256 _publicId
    ) public initializer {
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        USDC = IERC20(_usdc);
        authorisedAgent = _authAgent;
        feedbackAgent = _feedbackAgent;
        reputationRegistry = IERC8004Reputation(_reputation);
        platformFeeBps = 100; // 1%
        
        if (_publicReputation != address(0)) {
            publicReputationRegistry = IERC8004Reputation(_publicReputation);
            publicAgentId = _publicId;
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    modifier onlyAuthorisedAgent() {
        require(msg.sender == authorisedAgent, "Not authorised agent");
        _;
    }

    modifier onlyFeedbackAgent() {
        require(msg.sender == feedbackAgent, "Not feedback agent");
        _;
    }

    // Called by Earnbase Feedback Agent
    function createRequest(
        bytes32 requestId,
        uint256 amount,
        uint256 participants
    ) external nonReentrant onlyFeedbackAgent {
        require(requests[requestId].createdAt == 0, "Request exists");
        require(amount > 0 && participants > 0, "Invalid params");

        // Transfer funds from requester (Feedback Agent wallet) to this contract
        USDC.safeTransferFrom(msg.sender, address(this), amount);

        // We can't initialize the struct with the dynamic array 'tags' in one go easily
        // correctly in all solidity versions, so we init then set if needed.
        // Or just leave empty for now.
        
        FeedbackRequest storage req = requests[requestId];
        req.requestId = requestId;
        req.requester = msg.sender;
        req.escrowAmount = amount;
        req.participantCount = participants;
        req.createdAt = block.timestamp;
        req.status = RequestStatus.Pending;

        emit FeedbackRequestCreated(
            requestId,
            msg.sender,
            amount,
            participants
        );
    }

    function payoutContributor(
        bytes32 requestId,
        address contributor,
        uint256 amount,
        uint256 reputationWeight
    ) external onlyAuthorisedAgent nonReentrant {
        FeedbackRequest storage req = requests[requestId];
        require(req.status != RequestStatus.Completed && req.status != RequestStatus.Cancelled, "Finalized/Cancelled");
        require(requestPayouts[requestId] + amount <= req.escrowAmount, "Insufficient escrow");

        USDC.safeTransfer(contributor, amount);
        requestPayouts[requestId] += amount;

        emit ContributorPaid(requestId, contributor, amount);

        // ERC-8004 hook
        reputationRegistry.recordContribution(
            contributor,
            requestId,
            reputationWeight
        );

        emit ERC8004ContributorReputation(
            contributor,
            requestId,
            reputationWeight
        );
    }
   
    function completeRequest(
        bytes32 requestId,
        bytes32 resultsHash,
        bytes32 merkleRoot,
        uint256 avgLatencySeconds,
        uint256 completionRate,
        uint256 agentScore,
        string[] calldata tags
    ) external onlyAuthorisedAgent {
        FeedbackRequest storage req = requests[requestId];
        require(req.status != RequestStatus.Completed && req.status != RequestStatus.Cancelled, "Already finalized");

        req.status = RequestStatus.Completed;
        req.resultsHash = resultsHash;
        req.merkleRoot = merkleRoot;
        req.avgLatency = avgLatencySeconds;
        req.completionRate = completionRate;
        req.tags = tags;

        emit FeedbackRequestCompleted(
            requestId,
            resultsHash,
            merkleRoot,
            req.participantCount,
            completionRate,
            avgLatencySeconds
        );

        // Agent reputation
        reputationRegistry.recordAgentAction(
            msg.sender,
            requestId,
            agentScore
        );

        emit ERC8004AgentReputation(
            msg.sender,
            requestId,
            agentScore
        );

        // Public Registry Feedback (Visible on 8004scan)
        if (address(publicReputationRegistry) != address(0) && publicAgentId != 0) {
            int128 feedbackValue = int128(uint128(agentScore));
            
            // Use provided tags if available, else defaults
            string memory tag1 = tags.length > 0 ? tags[0] : "task-completion";
            string memory tag2 = tags.length > 1 ? tags[1] : "verified";
            
            try publicReputationRegistry.giveFeedback(
                publicAgentId,
                feedbackValue,
                0, // decimals
                tag1,
                tag2,
                "", // endpoint
                "", // uri (could be ipfs hash of results)
                merkleRoot // hash
            ) {} catch {
                // Ignore failure
            }
        }
    }

    function cancelRequest(bytes32 requestId) external {
        FeedbackRequest storage req = requests[requestId];
        // Only requester (Feedback Agent) or Owner can cancel
        require(msg.sender == req.requester || msg.sender == owner(), "Not authorized");
        require(req.status == RequestStatus.Pending || req.status == RequestStatus.InProgress, "Cannot cancel");

        req.status = RequestStatus.Cancelled;
        emit FeedbackRequestCancelled(requestId);

        // Auto-refund remaining funds? 
        // We can either auto-refund here or require separate withdrawal.
        // Let's do auto-refund to simplify.
        _withdrawFunds(requestId);
    }

    function withdrawUnusedFunds(bytes32 requestId) external nonReentrant {
        // Anyone can call, but funds go to requester.
        // Useful if auto-refund failed or wasn't triggered.
        FeedbackRequest storage req = requests[requestId];
        require(req.status == RequestStatus.Completed || req.status == RequestStatus.Cancelled, "Not finalized");
        _withdrawFunds(requestId);
    }

    function _withdrawFunds(bytes32 requestId) internal {
        require(!fundsWithdrawn[requestId], "Already withdrawn");
        
        FeedbackRequest storage req = requests[requestId];
        uint256 used = requestPayouts[requestId];
        uint256 remaining = req.escrowAmount > used ? req.escrowAmount - used : 0;

        if (remaining > 0) {
            fundsWithdrawn[requestId] = true;
            USDC.safeTransfer(req.requester, remaining);
            emit FundsWithdrawn(requestId, req.requester, remaining);
        }
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN CONTROLS
    //////////////////////////////////////////////////////////////*/

    function setAuthorisedAgent(address newAgent) external onlyOwner {
        authorisedAgent = newAgent;
    }

    function setFeedbackAgent(address newAgent) external onlyOwner {
        feedbackAgent = newAgent;
    }

    function setReputationRegistry(address registry) external onlyOwner {
        reputationRegistry = IERC8004Reputation(registry);
    }

    function setPlatformFee(uint256 feeBps) external onlyOwner {
        require(feeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = feeBps;
    }

    function setPublicReputationRegistry(address registry) external onlyOwner {
        publicReputationRegistry = IERC8004Reputation(registry);
    }

    function setPublicAgentId(uint256 agentId) external onlyOwner {
        publicAgentId = agentId;
    }
}
