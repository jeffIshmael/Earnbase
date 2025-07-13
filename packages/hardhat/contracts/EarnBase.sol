/**
 * @title EarnBase - chamapay's beta stage rewards management smart contract
 * @author Jeff Muchiri
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract EarnBase is Ownable, ReentrancyGuard, Pausable {
    IERC20 public cUSDToken;
    address public agent;
    uint256 public totalTesters;

    constructor() Ownable(msg.sender) {
        cUSDToken = IERC20(0x765DE816845861e75A25fCA122bb6898B8B1282a); // Mainnet
        agent = 0x1C059486B99d6A2D9372827b70084fbfD014E978;
        // For Alfajores, use: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
    }

    struct Tester {
        uint256 id;
        uint256 unclaimedAmount;
        uint256 claimedAmount;
    }

    struct Payment {
        uint256 id;
        address receiver;
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => Tester) public testers;
    mapping(address => bool) public isTester;
    Payment[] public payments;

    // Events
    event TesterAdded(address indexed tester, uint256 indexed testerId);
    event RewardClaimed(address indexed tester, uint256 amount, uint256 totalClaimed, uint256 totalUnclaimed);
    event Deposited(address indexed depositor, uint256 amount);
    event AgentSet(address indexed agent);
    event AmountWithdrawn(address indexed to, uint256 amount);

    // ────────────────────────────────
    // Admin Functions
    // ────────────────────────────────

    function addTesters(address[] memory testerAddresses) external onlyAuthorised {
        for (uint256 i = 0; i < testerAddresses.length; i++) {
            address tester = testerAddresses[i];
            require(tester != address(0), "Invalid address.");
            require(!isTester[tester], "Already added.");

            testers[tester] = Tester(totalTesters, 0, 0);
            isTester[tester] = true;
            emit TesterAdded(tester, totalTesters);
            totalTesters++;
        }
    }

    function depositCUSD(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        bool success = cUSDToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed.");
        emit Deposited(msg.sender, amount);
    }

    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(cUSDToken.transfer(to, amount), "Withdraw failed.");
        emit AmountWithdrawn(to, amount);
    }

    function setAgent(address _agent) external onlyOwner {
        require(_agent != address(0), "Invalid address");
        agent = _agent;
        emit AgentSet(_agent);
    }

    function pauseContract() external onlyOwner {
        _pause();
    }

    function unpauseContract() external onlyOwner {
        _unpause();
    }

    // ────────────────────────────────
    // Tester Interaction
    // ────────────────────────────────

    function claimRewards(uint256 amount) external nonReentrant whenNotPaused onlyTester {
        Tester storage tester = testers[msg.sender];
        require(amount > 0, "Amount must be > 0");
        require(amount <= tester.unclaimedAmount, "Exceeds unclaimed balance");
        require(cUSDToken.balanceOf(address(this)) >= amount, "Contract underfunded");

        tester.unclaimedAmount -= amount;
        tester.claimedAmount += amount;

        bool success = cUSDToken.transfer(msg.sender, amount);
        require(success, "Transfer failed");

        payments.push(Payment(payments.length, msg.sender, amount, block.timestamp));

        emit RewardClaimed(msg.sender, amount, tester.claimedAmount, tester.unclaimedAmount);
    }

    function getTestersRewards(address _tester) external view returns (uint256 claimed, uint256 unclaimed) {
        require(_tester != address(0), "Invalid address.");
        require(isTester[_tester], "Not a tester.");
        Tester memory t = testers[_tester];
        return (t.claimedAmount, t.unclaimedAmount);
    }

    function isATester(address _tester) external view returns (bool) {
        return isTester[_tester];
    }

    function addRewards(address tester, uint256 amount) external onlyAuthorised {
        require(tester != address(0), "Invalid address");
        require(isTester[tester], "Not a tester");
        testers[tester].unclaimedAmount += amount;
    }

    // ────────────────────────────────
    // Modifiers
    // ────────────────────────────────

    modifier onlyTester() {
        require(isTester[msg.sender], "Not a tester.");
        _;
    }

    modifier onlyAuthorised() {
        require(msg.sender == owner() || msg.sender == agent, "Not authorised.");
        _;
    }
}
