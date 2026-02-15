import { parseAbiItem } from 'viem';

// EIP-712 Domain for Celo Mainnet USDC
export const CELO_USDC_PERMIT_DOMAIN = {
    name: 'USD Coin',
    version: '2',
    chainId: 42220, // Celo Mainnet
    verifyingContract: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' as `0x${string}`
};

// EIP-2612 Permit Types
export const PERMIT_TYPES = {
    Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ]
} as const;

// ERC20 Permit ABI (EIP-2612)
export const ERC20_PERMIT_ABI = [
    {
        name: 'permit',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'v', type: 'uint8' },
            { name: 'r', type: 'bytes32' },
            { name: 's', type: 'bytes32' }
        ],
        outputs: []
    },
    {
        name: 'nonces',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'transferFrom',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'Transfer',
        type: 'event',
        inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'value', type: 'uint256', indexed: false }
        ]
    }
] as const;
