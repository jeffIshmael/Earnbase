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
        uint256[] taskIds;
        address smartAddress;
        address normalAddress;
        uint256 totalEarned;
        mapping(uint256 => uint256) taskEarnings; // taskId => amount earned
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
        address[] participants;
        mapping(address => uint256) participantEarnings; // participant => amount earned
    }

    Payment[] public payments;
    Task[] public tasks;
    
    // Mappings to track testers
    mapping(address => Tester) public testers;
    mapping(address => bool) public isTester;
    address[] public testerAddresses;

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
    event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 totalAmount, uint256 maxReward);


    // ────────────────────────────────
    // Admin Functions
    // ────────────────────────────────

   // function to record a payment
   function addPayment(address _receiver, uint256 _amount, uint256 _taskId) internal {
        require(_taskId < tasks.length, "Task does not exist");
        require(_amount > 0, "Amount must be greater than 0");
        
        // Create payment record
        Payment memory newPayment = Payment({
            id: payments.length,
            taskId: _taskId,
            receiver: _receiver,
            amount: _amount,
            timestamp: block.timestamp
        });
        
        payments.push(newPayment);
        
        // Update task paid amount
        tasks[_taskId].paidAmount += _amount;
        
        // Track participant in task
        Task storage task = tasks[_taskId];
        if (task.participantEarnings[_receiver] == 0) {
            // First time participating in this task
            task.participants.push(_receiver);
            task.totalTesters++;
        }
        task.participantEarnings[_receiver] += _amount;
        
        // Track tester earnings
        if (isTester[_receiver]) {
            Tester storage tester = testers[_receiver];
            if (tester.taskEarnings[_taskId] == 0) {
                // First time earning from this task
                tester.taskIds.push(_taskId);
            }
            tester.taskEarnings[_taskId] += _amount;
            tester.totalEarned += _amount;
        }
   }

    // Function to check whether a user has done (participated in) a specific task
    function userHasDoneTask(address _testerAddress, uint256 _taskId) internal view returns (bool) {
        require(_taskId < tasks.length, "Task does not exist");

        Task storage task = tasks[_taskId];

        // If participantEarnings for this tester > 0, it means they participated
        if (task.participantEarnings[_testerAddress] > 0) {
            return true;
        }

        return false;
    }

   // function to award the tester( sends cUSD to the tester's wallet)
   function makePayment(address _testerAddress, uint256 _amount, uint256 _taskId) external whenNotPaused onlyAuthorised {
        require(_testerAddress != address(0), "Invalid tester address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_taskId < tasks.length, "Task does not exist");
        require(cUSDToken.balanceOf(address(this)) >= _amount, "Insufficient funds in the contract");

        // Check if task has enough remaining funds
        Task storage task = tasks[_taskId];
        // check the task balance
        uint256 remainingBalance = task.totalAmount - task.paidAmount;
        require(remainingBalance >= _amount,"Insufficient funds for the task.");
        require(task.paidAmount + _amount <= task.totalAmount, "Exceeds task budget.");

        // ensure user does not participate again
        bool hasParticipated = userHasDoneTask(_testerAddress, _taskId);
        require(!hasParticipated, "User has already done the task.");

        // Transfer cUSD to tester
        bool sent = cUSDToken.transfer(_testerAddress, _amount);
        require(sent, "Payment transfer failed");
        
        // Record the payment
        addPayment(_testerAddress, _amount, _taskId);
        
        emit PaymentAwarded(_testerAddress, _amount, block.timestamp);
   }

   // function to create a task
   function createTask(uint256 _totalAmount, uint256 _maxReward) external whenNotPaused {
        require(_totalAmount > 0, "Total amount must be greater than 0");
        require(_maxReward > 0, "Max reward must be greater than 0");
        require(_maxReward <= _totalAmount, "Max reward cannot exceed total amount");

        bool success = cUSDToken.transferFrom(msg.sender, address(this), _totalAmount);
        require(success, "Transfer failed");
        
        uint256 taskId = tasks.length;
        tasks.push();
        Task storage newTask = tasks[taskId];
        
        newTask.id = taskId;
        newTask.creator = msg.sender;
        newTask.totalTesters = 0;
        newTask.totalAmount = _totalAmount;
        newTask.paidAmount = 0;
        totalTasks++;
        
        emit TaskCreated(taskId, msg.sender, _totalAmount, _maxReward);
   }
   
   // function to get basic task details
   function getTask(uint256 _taskId) external view returns (
        uint256 id,
        address creator,
        uint256 totalTestersCount,
        uint256 totalAmount,
        uint256 paidAmount
   ) {
        require(_taskId < tasks.length, "Task does not exist");
        Task storage task = tasks[_taskId];
        return (
            task.id,
            task.creator,
            task.totalTesters,
            task.totalAmount,
            task.paidAmount
        );
   }
   
   // function to get detailed task information
   function getTaskDetails(uint256 _taskId) external view returns (
        uint256 id,
        address creator,
        uint256 participantCount,
        uint256 totalAmount,
        uint256 paidAmount,
        address[] memory participants,
        uint256[] memory participantAmounts
   ) {
        require(_taskId < tasks.length, "Task does not exist");
        
        Task storage task = tasks[_taskId];
        uint256 participantCountLocal = task.participants.length;
        
        address[] memory addresses = new address[](participantCountLocal);
        uint256[] memory amounts = new uint256[](participantCountLocal);
        
        for (uint256 i = 0; i < participantCountLocal; i++) {
            addresses[i] = task.participants[i];
            amounts[i] = task.participantEarnings[task.participants[i]];
        }
        
        return (
            task.id,
            task.creator,
            participantCountLocal,
            task.totalAmount,
            task.paidAmount,
            addresses,
            amounts
        );
   }
   
   // function to get total number of tasks
   function getTotalTasks() external view returns (uint256) {
        return totalTasks;
   }
   
   // function to get payments for a specific task
   function getTaskPayments(uint256 _taskId) external view returns (Payment[] memory) {
        require(_taskId < tasks.length, "Task does not exist");
        
        uint256 paymentCount = 0;
        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].taskId == _taskId) {
                paymentCount++;
            }
        }
        
        Payment[] memory taskPayments = new Payment[](paymentCount);
        uint256 index = 0;
        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].taskId == _taskId) {
                taskPayments[index] = payments[i];
                index++;
            }
        }
        
        return taskPayments;
   }
   
   // function to get task statistics
   function getTaskStats(uint256 _taskId) external view returns (
        uint256 totalAmount,
        uint256 paidAmount,
        uint256 remainingAmount,
        uint256 paymentCount
   ) {
        require(_taskId < tasks.length, "Task does not exist");
        
        Task storage task = tasks[_taskId];
        uint256 taskPaymentCount = 0;
        
        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].taskId == _taskId) {
                taskPaymentCount++;
            }
        }
        
        return (
            task.totalAmount,
            task.paidAmount,
            task.totalAmount - task.paidAmount,
            taskPaymentCount
        );
   }

    // function to update the smartAddress
   function updateSmartWallet(address _smartWallet, address _normalAddress) external onlyAuthorised {
        require(_smartWallet != address(0), "Invalid smart wallet address");
        require(_normalAddress != address(0), "Invalid normal address");
        require(isTester[_normalAddress], "Address not registered as tester");

        // Update the smart wallet address for the tester
        testers[_normalAddress].smartAddress = _smartWallet;
        
        emit SmartWalletUpdated(_normalAddress, _smartWallet);
    }



    function depositCUSD(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        bool success = cUSDToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed.");
        emit Deposited(msg.sender, amount);
    }
    
    // function to deposit funds for a specific task
    function depositForTask(uint256 _taskId, uint256 amount) external whenNotPaused {
        require(_taskId < tasks.length, "Task does not exist");
        require(amount > 0, "Amount must be greater than 0");
        
        Task storage task = tasks[_taskId];
        require(msg.sender == task.creator, "Only task creator can deposit");
        
        bool success = cUSDToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
        
        task.totalAmount += amount;
        
        emit Deposited(msg.sender, amount);
    }
    
    // function to close a task (only creator can close)
    function closeTask(uint256 _taskId) external whenNotPaused {
        require(_taskId < tasks.length, "Task does not exist");
        
        Task storage task = tasks[_taskId];
        require(msg.sender == task.creator, "Only task creator can close task");
        require(task.paidAmount <= task.totalAmount, "Task has pending payments");
        
        // Calculate remaining balance to refund
        uint256 remainingBalance = task.totalAmount - task.paidAmount;
        
        // Refund remaining balance to creator if there's any
        if (remainingBalance > 0) {
            bool success = cUSDToken.transfer(task.creator, remainingBalance);
            require(success, "Refund transfer failed");
        }

        task.totalAmount = 0;
        
        emit TaskCreated(_taskId, task.creator, 0, 0); 
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

    // get testers payments
    
    // function to get tester information
    function getTesterInfo(address _testerAddress) external view returns (
        uint256 id,
        uint256[] memory taskIds,
        address smartAddress,
        address normalAddress,
        uint256 totalEarned
    ) {
        require(isTester[_testerAddress], "Address not registered as tester");
        Tester storage tester = testers[_testerAddress];
        return (
            tester.id,
            tester.taskIds,
            tester.smartAddress,
            tester.normalAddress,
            tester.totalEarned
        );
    }
    
    // function to get tester's earnings from a specific task
    function getTesterTaskEarnings(address _testerAddress, uint256 _taskId) external view returns (uint256) {
        require(isTester[_testerAddress], "Address not registered as tester");
        require(_taskId < tasks.length, "Task does not exist");
        return testers[_testerAddress].taskEarnings[_taskId];
    }
    
    // function to get task participants and their earnings
    function getTaskParticipants(uint256 _taskId) external view returns (
        address[] memory participantAddresses,
        uint256[] memory participantAmounts
    ) {
        require(_taskId < tasks.length, "Task does not exist");
        
        Task storage task = tasks[_taskId];
        uint256 participantCount = task.participants.length;
        
        address[] memory addresses = new address[](participantCount);
        uint256[] memory amounts = new uint256[](participantCount);
        
        for (uint256 i = 0; i < participantCount; i++) {
            addresses[i] = task.participants[i];
            amounts[i] = task.participantEarnings[task.participants[i]];
        }
        
        return (addresses, amounts);
    }
    
    // function to get all testers
    function getAllTesters() external view returns (address[] memory) {
        return testerAddresses;
    }
    
    // function to add a new tester
    function addTester(address _testerAddress) external onlyAuthorised {
        require(_testerAddress != address(0), "Invalid address");
        require(!isTester[_testerAddress], "Already a tester");
        
        testers[_testerAddress].id = totalTesters;
        testers[_testerAddress].smartAddress = address(0);
        testers[_testerAddress].normalAddress = _testerAddress;
        testers[_testerAddress].totalEarned = 0;
        
        isTester[_testerAddress] = true;
        testerAddresses.push(_testerAddress);
        totalTesters++;
        
        emit TesterAdded(_testerAddress, totalTesters - 1);
    }
    
    // function to get all payments for a specific tester
    function getTesterPayments(address _testerAddress) external view returns (Payment[] memory) {
        require(isTester[_testerAddress], "Address not registered as tester");
        
        uint256 paymentCount = 0;
        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].receiver == _testerAddress) {
                paymentCount++;
            }
        }
        
        Payment[] memory testerPayments = new Payment[](paymentCount);
        uint256 index = 0;
        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].receiver == _testerAddress) {
                testerPayments[index] = payments[i];
                index++;
            }
        }
        
        return testerPayments;
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

