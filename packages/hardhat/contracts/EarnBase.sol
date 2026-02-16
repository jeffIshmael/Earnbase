// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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


contract EarnBaseV2 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable USDC;
    IERC8004Reputation public reputationRegistry;
    address public authorisedAgent;

    uint256 public platformFeeBps = 100; // 1%

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
    }

    mapping(bytes32 => FeedbackRequest) public requests;
    mapping(bytes32 => uint256) public requestPayouts;

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

    modifier onlyAgent() {
        require(msg.sender == authorisedAgent, "Not authorised agent");
        _;
    }

    constructor(
        address _usdc,
        address _agent,
        address _reputation,
        address _publicReputation,
        uint256 _publicId
    ) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        authorisedAgent = _agent;
        reputationRegistry = IERC8004Reputation(_reputation);
        
        if (_publicReputation != address(0)) {
            publicReputationRegistry = IERC8004Reputation(_publicReputation);
            publicAgentId = _publicId;
        }
    }

    function createRequest(
        bytes32 requestId,
        uint256 amount,
        uint256 participants
    ) external nonReentrant {
        require(requests[requestId].createdAt == 0, "Request exists");
        require(amount > 0 && participants > 0, "Invalid params");

        USDC.safeTransferFrom(msg.sender, address(this), amount);

        requests[requestId] = FeedbackRequest({
            requestId: requestId,
            requester: msg.sender,
            escrowAmount: amount,
            participantCount: participants,
            createdAt: block.timestamp,
            status: RequestStatus.Pending,
            resultsHash: bytes32(0),
            merkleRoot: bytes32(0),
            avgLatency: 0,
            completionRate: 0
        });

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
    ) external onlyAgent nonReentrant {
        FeedbackRequest storage req = requests[requestId];
        require(req.status != RequestStatus.Completed, "Finalized");

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

    /*//////////////////////////////////////////////////////////////
                    FINAL RESULT SUBMISSION
    //////////////////////////////////////////////////////////////*/

    function completeRequest(
        bytes32 requestId,
        bytes32 resultsHash,
        bytes32 merkleRoot,
        uint256 avgLatencySeconds,
        uint256 completionRate,
        uint256 agentScore
    ) external onlyAgent {
        FeedbackRequest storage req = requests[requestId];
        require(req.status != RequestStatus.Completed, "Already completed");

        req.status = RequestStatus.Completed;
        req.resultsHash = resultsHash;
        req.merkleRoot = merkleRoot;
        req.avgLatency = avgLatencySeconds;
        req.completionRate = completionRate;

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
            // Convert uint256 score to int128 value (e.g. 500 -> 5.00 if decimals=2)
            // Or just store raw value. Let's assume score is 0-100 (int128 compatible)
            int128 feedbackValue = int128(uint128(agentScore));
            
            try publicReputationRegistry.giveFeedback(
                publicAgentId,
                feedbackValue,
                0, // decimals
                "task-completion", // tag1
                "verified",        // tag2
                "", // endpoint
                "", // uri
                merkleRoot // hash
            ) {} catch {
                // Don't revert if public feedback fails (it's secondary)
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN CONTROLS
    //////////////////////////////////////////////////////////////*/

    function setAgent(address newAgent) external onlyOwner {
        authorisedAgent = newAgent;
    }

    function setReputationRegistry(address registry) external onlyOwner {
        reputationRegistry = IERC8004Reputation(registry);
    }
}
