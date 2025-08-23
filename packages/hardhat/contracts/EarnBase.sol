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
    uint256 public totalTasks;

    constructor() Ownable(msg.sender) {
        cUSDToken = IERC20(0x765DE816845861e75A25fCA122bb6898B8B1282a); // Mainnet
        agent = 0x1C059486B99d6A2D9372827b70084fbfD014E978;
        // For Alfajores, 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
    }

    struct Tester {
        uint256 id;
        uint256[] taskId;
        address smartAddress;
    }

    struct Payment {
        uint256 id;
        uint256 taskId;
        address receiver;
        uint256 amount;
        uint256 timestamp;
    }

    struct Task {
        uint256 id;
        address creator;
        uint256 totalTesters;
        uint256 totalAmount;
        uint256 paidAmount;
    }

    Payment[] public payments;

    // Events
    event TesterAdded(address indexed tester, uint256 indexed testerId);
    event PaymentAwarded(address testerAddress, uint256 amount, uint256 timestamp);
    event RewardClaimed(address indexed tester, uint256 amount, uint256 totalClaimed, uint256 totalUnclaimed);
    event Deposited(address indexed depositor, uint256 amount);
    event AgentSet(address indexed agent);
    event AmountWithdrawn(address indexed to, uint256 amount);
    event SmartWalletUpdated(address indexed tester, address indexed newSmartWallet);
    event AmountSent(address indexed to, uint256 amount, uint256 timestamp);
    event RewardsAwarded(address indexed tester, uint256 amount);


    // ────────────────────────────────
    // Admin Functions
    // ────────────────────────────────

   function makePayment(address _testerAddress, uint256 _amount) external whenNotPaused onlyAuthorised {
        // make sure the address is one of the testers
        // make sure that the contract has the amount
        require(cUSDToken.balanceOf(address(this)) >= _amount, "Insufficient funds in the contract.");
        bool sent = cUSDToken.transfer(_testerAddress, _amount);
        require(sent,"Not able to send payment.");
        emit PaymentAwarded(_testerAddress, _amount, block.timestamp);
   }

   function addTesters(address[] memory newTesters) external onlyAuthorised {
    for (uint256 i = 0; i < newTesters.length; i++) {
        address tester = newTesters[i];
        require(tester != address(0), "Invalid address.");
        require(!isTester[tester], "Already added.");

        testers[tester] = Tester(totalTesters, 0, 0, address(0));
        isTester[tester] = true;
        testerAddresses.push(tester);
        emit TesterAdded(tester, totalTesters);
        totalTesters++;
    }
}

   // function to add a single tester
   function addTester(address tester) external onlyAuthorised {
    require(tester != address(0), "Invalid address.");
    require(!isTester[tester], "Already added.");

    testers[tester] = Tester(totalTesters, 0, 0, address(0));
    isTester[tester] = true;
    testerAddresses.push(tester);
    emit TesterAdded(tester, totalTesters);
    totalTesters++;
    }

   // function to remove one tester
   function removeTester(address tester) external onlyAuthorised {
    require(isTester[tester], "Not a tester");

    // Remove from mappings
    delete isTester[tester];
    delete testers[tester];

    // Remove from array
    for (uint256 i = 0; i < testerAddresses.length; i++) {
        if (testerAddresses[i] == tester) {
            testerAddresses[i] = testerAddresses[testerAddresses.length - 1]; // swap with last
            testerAddresses.pop(); // remove last
            totalTesters--; // optional: reflect real count
            break;
        }
    }
    }

    // fuction to update the smartAddress
   function updateSmartWallet(address _smartWallet, address _normalAddress) external onlyAuthorised {
    require(_smartWallet != address(0), "Invalid smart wallet address");
    require(_normalAddress != address(0), "Invalid normal address");
    require(isTester[_normalAddress], "Address not registered as tester");

    testers[_normalAddress].smartWallet = _smartWallet;
    emit SmartWalletUpdated(_normalAddress, _smartWallet);
    }

    // function to send amount to the testers (used during the beta phase)
    function sendAmount(uint256 _amount) external whenNotPaused onlyAuthorised {
    require(_amount > 0, "Amount must be > 0");
    require(testerAddresses.length > 0, "No testers");

    uint256 totalRequired = _amount * testerAddresses.length;
    require(totalRequired > 0, "Amount too small per tester");

    require(cUSDToken.balanceOf(address(this)) >= totalRequired, "Insufficient funds");

    for (uint256 i = 0; i < testerAddresses.length; i++) {
        address tester = testerAddresses[i];
        bool sent = cUSDToken.transfer(tester,_amount);
        require(sent,"Unable to send.");
        emit AmountSent(tester, _amount, block.timestamp);
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

    function claimRewards(uint256 amount, address _userNormalAddresss) external nonReentrant whenNotPaused onlyTester {
        Tester storage tester = testers[_userNormalAddresss];
        require(amount > 0, "Amount must be > 0");
        require(amount <= tester.unclaimedAmount, "Exceeds unclaimed balance");
        require(cUSDToken.balanceOf(address(this)) >= amount, "Contract underfunded");

        bool success = cUSDToken.transfer(_userNormalAddresss, amount);
        require(success, "Transfer failed");
        tester.unclaimedAmount -= amount;
        tester.claimedAmount += amount;

        payments.push(Payment(payments.length, _userNormalAddresss, amount, block.timestamp));

        emit RewardClaimed(_userNormalAddresss, amount, tester.claimedAmount, tester.unclaimedAmount);
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
        require(isTester[tester], "Not a tester.");
        testers[tester].unclaimedAmount += amount;
        emit RewardsAwarded(tester, amount);
    }

    // function to get all testers
    function getAllTesterDetails() external view returns (Tester[] memory) {
    uint256 count = testerAddresses.length;
    Tester[] memory details = new Tester[](count);
    for (uint256 i = 0; i < count; i++) {
        details[i] = testers[testerAddresses[i]];
    }
    return details;
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
