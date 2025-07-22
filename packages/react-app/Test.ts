import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { Mento } from '@mento-protocol/mento-sdk';
import { providers, Wallet, utils, Contract } from 'ethers';
import { parseEther, formatEther } from 'viem';

// Pure ethers.js implementation following official Mento SDK examples
export function useEthersSwap() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const recipientAddress = address;

  console.log(walletClient);

 const swap = async (
  ) => {
    if (!address || !walletClient || !publicClient) {
      throw new Error('Wallet not connected');
    }

    console.log('🚀 Starting pure ethers.js swap following official examples...');
    
    // Get token addresses - use Alfajores testnet (44787)
    const chainId = 42220;
    const fromTokenAddress = "0x765DE816845861e75A25fCA122bb6898B8B1282a"
    const toTokenAddress = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
    

    // Create ethers provider
    const provider = new providers.JsonRpcProvider('https://forno.celo.org');
    
    // Create a better signer proxy that properly handles address and signing
    const createProperSigner = (userAddress: string) => {
      // Create a wallet with a private key derived from the user's address
      // This is a deterministic but dummy approach - the actual signing will be done by viem
      const deterministicKey = '0x' + userAddress.slice(2).padStart(64, '0');
      const wallet = new Wallet(deterministicKey, provider);
      
      // Override critical methods to use viem instead
      const signerProxy = Object.create(wallet);
      
      // Override address property
      Object.defineProperty(signerProxy, 'address', {
        value: userAddress,
        writable: false,
        enumerable: true
      });
      
      // Override getAddress method
      signerProxy.getAddress = () => Promise.resolve(userAddress);
      
      // Override sendTransaction to use viem
      signerProxy.sendTransaction = async (transaction: any) => {
        console.log('📤 Sending transaction via viem:', transaction);
        const hash = await walletClient.sendTransaction({
          account: userAddress as `0x${string}`,
          to: transaction.to as `0x${string}`,
          data: transaction.data as `0x${string}`,
          value: transaction.value ? BigInt(transaction.value.toString()) : BigInt(0),
          gas: transaction.gasLimit ? BigInt(transaction.gasLimit.toString()) : undefined,
          gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice.toString()) : undefined
        });
        return { 
          hash, 
          wait: () => publicClient.waitForTransactionReceipt({ hash, confirmations: 1 }) 
        };
      };
      
      // Override populateTransaction to ensure correct from address
      signerProxy.populateTransaction = async (transaction: any) => {
        const populated = await wallet.populateTransaction(transaction);
        populated.from = userAddress;
        return populated;
      };
      
      return signerProxy;
    };
    
    const signer = createProperSigner(address);
    
    console.log('✨ Creating Mento SDK...');
    console.log('Signer address:', signer.address);
    console.log('Expected address:', address);
    
    const mento = await Mento.create(signer);
    
    // Initialize exchanges - this is likely what's missing!
    console.log('🔄 Initializing exchanges...');
    const exchanges = await mento.getExchanges();
    console.log('📊 Available exchanges:', exchanges);
    
    // Debug exchange IDs to find the correct one
    // console.log('📊 Exchange IDs:');
    // exchanges.forEach((exchange, index) => {
    //   console.log(`Exchange ${index}:`, exchange.id);
    //   console.log(`Exchange ${index} assets:`, exchange.assets);
    // });
    
    // if (exchanges.length === 0) {
    //   throw new Error('No exchanges found - cannot perform swaps');
    // }
    
    // Use viem's parseEther to avoid BigNumber version issues
    const amountInWei = parseEther("0.001");
    
    console.log('📊 Getting quote...');
    console.log('Amount in Wei (as string):', amountInWei.toString());
    
    const quoteAmountOut = await mento.getAmountOut(
      fromTokenAddress,
      toTokenAddress,
      amountInWei.toString() // Convert to string to avoid BigNumber issues
    );
    const minAmountOut = "0.00099";
    
    console.log(`💰 Quote raw:`, quoteAmountOut);
    console.log(`💰 Quote: ${formatEther(BigInt(quoteAmountOut.toString()))} USDC for 0.001cUSD.`);
    
    // Apply slippage (1% like in official example)
    const quoteBigInt = BigInt(quoteAmountOut.toString());
    const expectedAmountOut = minAmountOut 
      ? parseEther(minAmountOut).toString()
      : (quoteBigInt * BigInt(99) / BigInt(100)).toString();
    
    console.log(`🎯 Expected amount out with 1% slippage: ${formatEther(BigInt(expectedAmountOut))} USDC.`);
    
    try {
      // First, find the tradable pair like in the official examples
      console.log('🔍 Finding tradable pair for swap...');
      const tradablePair = await mento.findPairForTokens(
        fromTokenAddress,
        toTokenAddress
      );
      console.log('✅ Found tradable pair:', tradablePair);
      
      // Skip allowance step for now to test if the swap works
      console.log('⚠️ Skipping allowance step for now - will handle after finding broker contract');
      
      // Step 2: Perform swap (following official example)
      console.log('🔄 Swapping tokens...');
      console.log('Debug - Swap parameters:', {
        fromTokenAddress,
        toTokenAddress,
        amountInWei: amountInWei.toString(),
        expectedAmountOut
      });
      
      // The issue might be with our signer proxy - let's try a different approach
      console.log('🔍 Trying direct provider approach...');
      
      const mentoWithProvider = await Mento.create(provider);
      console.log('📊 Mento with provider created');
      
      // Try to use the getBroker method to get the broker contract
      const broker = await mento.getBroker();
      console.log('📊 Broker contract:', broker);
      console.log('📊 Broker methods:', Object.getOwnPropertyNames(broker));
      console.log('📊 Broker functions:', Object.getOwnPropertyNames(broker.functions || {}));
      console.log('📊 Broker swapIn method:', typeof broker.swapIn, broker.swapIn);
      
      // Handle token allowance for broker contract
      console.log('🔓 Handling token allowance for broker contract...');
      
      // Create token contract interface
      const tokenInterface = ['function allowance(address owner, address spender) view returns (uint256)', 'function approve(address spender, uint256 amount) returns (bool)'];
      const tokenContract = new Contract(fromTokenAddress, tokenInterface, signer);
      
      const brokerAddress = await broker.getAddress();
      console.log(`The address of the broker`, brokerAddress);
      // Step 1: Check current allowance
      const currentAllowance = await tokenContract.allowance(signer.address, brokerAddress);
      console.log('Current allowance:', currentAllowance.toString());
      console.log('Required amount:', amountInWei.toString());
      
      // Step 2: Approve if needed
      if (BigInt(currentAllowance.toString()) < BigInt(amountInWei.toString())) {
        console.log('🔓 Approving broker contract to spend tokens...');
        
        // Create approval transaction
        const approvalTx = await tokenContract.populateTransaction.approve(
          brokerAddress,
          amountInWei.toString()
        );
        
        console.log('📋 Approval transaction:', approvalTx);
        
        // Send approval transaction using viem
        const approvalHash = await walletClient.sendTransaction({
          account: signer.address as `0x${string}`,
          to: fromTokenAddress as `0x${string}`,
          data: approvalTx.data as `0x${string}`,
          value: BigInt(0)
        });
        
        console.log('📤 Approval transaction hash:', approvalHash);
        console.log('⏳ Waiting for approval confirmation...');
        
        // Wait for approval transaction
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        console.log('✅ Approval confirmed!');
      } else {
        console.log('✅ Sufficient allowance already exists');
      }
      
      // Check if trading is enabled for this pair
      console.log('🔍 Checking if trading is enabled for pair:', tradablePair.id);
      try {
        const tradingEnabled = await mento.isTradingEnabled(tradablePair.id);
        console.log('📊 Trading enabled:', tradingEnabled);
      } catch (error) {
        console.log('⚠️ Could not check trading enabled:', error instanceof Error ? error.message : String(error));
      }
      
      // Try to find the correct exchange for our tokens
      console.log('🔍 Looking for exchange for our tokens...');
      console.log('🔍 From token:', fromTokenAddress);
      console.log('🔍 To token:', toTokenAddress);
      
      let exchangeForTokens;
      try {
        exchangeForTokens = await mento.getExchangeForTokens(fromTokenAddress, toTokenAddress);
        console.log('📊 Exchange for tokens:', exchangeForTokens);
      } catch (error) {
        console.log('⚠️ Could not get exchange for tokens:', error instanceof Error ? error.message : String(error));
      }
      
      // Find the correct exchange from the exchanges array
      console.log('🔍 Checking tradable pair path for multi-hop swaps...');
      console.log('📊 Tradable pair path:', tradablePair.path);
      console.log('📊 Path length:', tradablePair.path.length);
      
      // Handle multi-hop swaps by using the path
      if (tradablePair.path.length === 1) {
        // Direct swap - single exchange
        console.log('🔄 Direct swap - looking for single exchange');
        const correctExchange = exchanges.find(exchange => {
          console.log('🔍 Checking exchange:', exchange.id);
          console.log('🔍 Exchange assets:', exchange.assets);
          const hasTokens = exchange.assets.length === 2 &&
            ((exchange.assets[0] === fromTokenAddress && exchange.assets[1] === toTokenAddress) ||
             (exchange.assets[0] === toTokenAddress && exchange.assets[1] === fromTokenAddress));
          console.log('🔍 Has our tokens:', hasTokens);
          return hasTokens;
        });
        console.log('📊 Found correct exchange:', correctExchange);
        
        if (!correctExchange) {
          throw new Error(`No direct exchange found for tokens ${fromTokenAddress} and ${toTokenAddress}`);
        }
             } else if (tradablePair.path.length === 2) {
         // Multi-hop swap - manual implementation using two sequential swaps
         console.log('🔄 Multi-hop swap detected - implementing manual two-step swap');
         console.log('📊 Path exchanges:', tradablePair.path);
         
         // Get the intermediate token (cUSD in most cases)
         const firstExchange = tradablePair.path[0];
         const secondExchange = tradablePair.path[1];
         
         console.log('📊 First exchange (step 1):', firstExchange);
         console.log('📊 Second exchange (step 2):', secondExchange);
         
         // Find intermediate token by checking which token is common between both exchanges
         let intermediateTokenAddress;
         const firstAssets = firstExchange.assets;
         const secondAssets = secondExchange.assets;
         
         // Find common asset (intermediate token)
         for (const asset1 of firstAssets) {
           for (const asset2 of secondAssets) {
             if (asset1 === asset2 && asset1 !== fromTokenAddress && asset1 !== toTokenAddress) {
               intermediateTokenAddress = asset1;
               break;
             }
           }
           if (intermediateTokenAddress) break;
         }
         
         if (!intermediateTokenAddress) {
           throw new Error('Could not determine intermediate token for multi-hop swap');
         }
         
         console.log('🔗 Intermediate token:', intermediateTokenAddress);
         console.log('🔄 Route: ', `cUSD → Intermediate → USDC`);
         
         // Determine which exchange to use for each step
         // Step 1: fromToken → intermediateToken
         // Step 2: intermediateToken → toToken
         
         let step1Exchange, step2Exchange;
         
         // Find exchange that contains fromToken and intermediateToken
         for (const exchange of [firstExchange, secondExchange]) {
           const hasFromToken = exchange.assets.includes(fromTokenAddress);
           const hasIntermediateToken = exchange.assets.includes(intermediateTokenAddress);
           if (hasFromToken && hasIntermediateToken) {
             step1Exchange = exchange;
             break;
           }
         }
         
         // Find exchange that contains intermediateToken and toToken  
         for (const exchange of [firstExchange, secondExchange]) {
           const hasIntermediateToken = exchange.assets.includes(intermediateTokenAddress);
           const hasToToken = exchange.assets.includes(toTokenAddress);
           if (hasIntermediateToken && hasToToken) {
             step2Exchange = exchange;
             break;
           }
         }
         
         if (!step1Exchange || !step2Exchange) {
           throw new Error('Could not find appropriate exchanges for multi-hop swap');
         }
         
         console.log('📊 Step 1 exchange:', step1Exchange);
         console.log('📊 Step 2 exchange:', step2Exchange);
         
         // Step 1: Swap fromToken to intermediate token
         console.log('📍 Step 1: Swapping to intermediate token...');
         
         // Get quote for first step using broker contract instead of Mento SDK
         const step1Quote = await broker.functions.getAmountOut(
           step1Exchange.providerAddr,
           step1Exchange.id,
           fromTokenAddress,
           intermediateTokenAddress,
           amountInWei.toString()
         );
         console.log('💰 Step 1 quote:', step1Quote.toString());
         
         // Apply slippage to step1 (1% slippage)  
         const step1MinAmount = (BigInt(step1Quote.toString()) * BigInt(99)) / BigInt(100);
         console.log('💰 Step 1 min amount with slippage:', step1MinAmount.toString());
         
         // Execute first swap
         const step1TxRequest = await broker.populateTransaction.swapIn(
           step1Exchange.providerAddr,
           step1Exchange.id,
           fromTokenAddress,
           intermediateTokenAddress,
           amountInWei.toString(),
           step1MinAmount.toString()
         );
         
         console.log('📋 Step 1 transaction request:', step1TxRequest);
         
         const step1Hash = await walletClient.sendTransaction({
           account: signer.address as `0x${string}`,
           to: brokerAddress as `0x${string}`,
           data: step1TxRequest.data as `0x${string}`,
           gas: step1TxRequest.gasLimit ? BigInt(step1TxRequest.gasLimit.toString()) : undefined,
           gasPrice: step1TxRequest.gasPrice ? BigInt(step1TxRequest.gasPrice.toString()) : undefined,
           value: BigInt(0)
         });
         
         console.log('📤 Step 1 transaction hash:', step1Hash);
         
         // Wait for step 1 to complete
         await publicClient.waitForTransactionReceipt({ hash: step1Hash });
         console.log('✅ Step 1 complete - received intermediate tokens');
         
         // Step 2: Approve intermediate token for broker (if needed)
         console.log('🔓 Checking intermediate token allowance...');
         const intermediateTokenContract = new Contract(
           intermediateTokenAddress,
           ['function allowance(address owner, address spender) view returns (uint256)', 'function approve(address spender, uint256 amount) returns (bool)'],
           signer
         );
         
         const intermediateAllowance = await intermediateTokenContract.allowance(signer.address, brokerAddress);
         console.log('Intermediate allowance:', intermediateAllowance.toString());
         console.log('Required for step 2:', step1Quote.toString());
         
         if (BigInt(intermediateAllowance.toString()) < BigInt(step1Quote.toString())) {
           console.log('🔓 Approving intermediate token...');
           const approvalTx = await intermediateTokenContract.populateTransaction.approve(
             brokerAddress,
             step1Quote.toString()
           );
           
           const approvalHash = await walletClient.sendTransaction({
             account: signer.address as `0x${string}`,
             to: intermediateTokenAddress as `0x${string}`,
             data: approvalTx.data as `0x${string}`,
             value: BigInt(0)
           });
           
           await publicClient.waitForTransactionReceipt({ hash: approvalHash });
           console.log('✅ Intermediate token approved');
         }
         
         // Step 2: Swap intermediate token to target token
         console.log('📍 Step 2: Swapping intermediate to target token...');
         
         // Get quote for second step
         const step2Quote = await broker.functions.getAmountOut(
           step2Exchange.providerAddr,
           step2Exchange.id,
           intermediateTokenAddress,
           toTokenAddress,
           step1Quote.toString()
         );
         console.log('💰 Step 2 quote:', step2Quote.toString());
         
         // Apply slippage to step2 (1% slippage)
         const step2MinAmount = (BigInt(step2Quote.toString()) * BigInt(99)) / BigInt(100);
         console.log('💰 Step 2 min amount with slippage:', step2MinAmount.toString());
         
         const step2TxRequest = await broker.populateTransaction.swapIn(
           step2Exchange.providerAddr,
           step2Exchange.id,
           intermediateTokenAddress,
           toTokenAddress,
           step1Quote.toString(),
           step2MinAmount.toString()
         );
         
         console.log('📋 Step 2 transaction request:', step2TxRequest);
         
         const step2Hash = await walletClient.sendTransaction({
           account: signer.address as `0x${string}`,
           to: brokerAddress as `0x${string}`,
           data: step2TxRequest.data as `0x${string}`,
           gas: step2TxRequest.gasLimit ? BigInt(step2TxRequest.gasLimit.toString()) : undefined,
           gasPrice: step2TxRequest.gasPrice ? BigInt(step2TxRequest.gasPrice.toString()) : undefined,
           value: BigInt(0)
         });
         
         console.log('📤 Step 2 transaction hash:', step2Hash);
         
         // Wait for step 2 to complete
         await publicClient.waitForTransactionReceipt({ hash: step2Hash });
         console.log('✅ Step 2 complete - multi-hop swap finished!');

      
         
         // Handle remittance if recipient address is provided and different from sender
         if (recipientAddress && recipientAddress !== signer.address) {
           console.log('🔄 Transferring received tokens to recipient...');
           
           const outputTokenContract = new Contract(toTokenAddress, ['function transfer(address to, uint256 amount) returns (bool)'], signer);
           
           const transferTx = await outputTokenContract.populateTransaction.transfer(
             recipientAddress,
             step2Quote.toString()
           );
           
           const transferHash = await walletClient.sendTransaction({
             account: signer.address as `0x${string}`,
             to: toTokenAddress as `0x${string}`,
             data: transferTx.data as `0x${string}`,
             value: BigInt(0)
           });
           
           await publicClient.waitForTransactionReceipt({ hash: transferHash });
           console.log('✅ Transfer to recipient confirmed!');
           
           return {
             success: true,
             hash: step2Hash,
             transferHash,
             amountOut: formatEther(BigInt(step2Quote.toString())),
             recipient: recipientAddress,
             message: `Successfully sent ${formatEther(BigInt(step2Quote.toString()))} USDC to ${recipientAddress}!`
           };
         } else {
           return {
             success: true,
             hash: step2Hash,
             amountOut: formatEther(BigInt(step2Quote.toString())),
             recipient: signer.address,
             message: `Successfully swapped ${formatEther(BigInt(amountInWei))} cUSD for ${formatEther(BigInt(step2Quote.toString()))} USDC!`
           };
         }
      } else {
        throw new Error(`Unsupported swap path length: ${tradablePair.path.length}`);
      }
      
      // Continue with direct swap logic for single-hop swaps
      const correctExchange = exchanges.find(exchange => {
        console.log('🔍 Checking exchange:', exchange.id);
        console.log('🔍 Exchange assets:', exchange.assets);
        const hasTokens = exchange.assets.length === 2 &&
          ((exchange.assets[0] === fromTokenAddress && exchange.assets[1] === toTokenAddress) ||
           (exchange.assets[0] === toTokenAddress && exchange.assets[1] === fromTokenAddress));
        console.log('🔍 Has our tokens:', hasTokens);
        return hasTokens;
      });
      console.log('📊 Found correct exchange:', correctExchange);
      
      if (!correctExchange) {
        throw new Error(`No exchange found for tokens ${fromTokenAddress} and ${toTokenAddress}`);
      }
      
      // Try different swap approaches
      let swapTxObj;
      
      try {
        // Method 1: Try calling broker directly with the function interface
        console.log('🔄 Trying direct broker function call...');
        console.log('Broker address:', brokerAddress);
        console.log('Exchange ID:', correctExchange.id);
        
        // Now we know the correct signature: swapIn(exchangeProvider, exchangeId, tokenIn, tokenOut, amountIn, amountOutMin)
        console.log('Calling broker.swapIn with correct signature...');
        console.log('Exchange provider:', correctExchange.providerAddr);
        console.log('Exchange ID:', correctExchange.id);
        console.log('Token in:', fromTokenAddress);
        console.log('Token out:', toTokenAddress);
        console.log('Amount in:', amountInWei.toString());
        console.log('Min amount out:', expectedAmountOut);
        console.log('Recipient address:', recipientAddress || 'sender (no remittance)');
        
              // Create the transaction request instead of executing it
      // Note: Broker swapIn always sends output tokens to caller, not custom recipient
      const txRequest = await broker.populateTransaction.swapIn(
        correctExchange.providerAddr,  // exchangeProvider
        correctExchange.id,            // exchangeId  
        fromTokenAddress,              // tokenIn
        toTokenAddress,                // tokenOut
        amountInWei.toString(),        // amountIn
        expectedAmountOut              // amountOutMin
      );
      
      console.log('📋 Transaction request:', txRequest);
      
      // Send the transaction using viem directly
      const hash = await walletClient.sendTransaction({
        account: signer.address as `0x${string}`,
        to: brokerAddress as `0x${string}`,
        data: txRequest.data as `0x${string}`,
        gas: txRequest.gasLimit ? BigInt(txRequest.gasLimit.toString()) : undefined,
        gasPrice: txRequest.gasPrice ? BigInt(txRequest.gasPrice.toString()) : undefined,
        value: BigInt(0)
      });
      
      console.log('📤 Transaction hash:', hash);
      
      // Create a transaction response object
      swapTxObj = {
        hash,
        wait: () => publicClient.waitForTransactionReceipt({ hash })
      };
        console.log('✅ Direct broker function call succeeded!');
      
      // Wait for swap transaction to be mined
      console.log('⏳ Waiting for swap transaction to be mined...');
      await publicClient.waitForTransactionReceipt({ hash });
      console.log('✅ Swap transaction confirmed!');
      
      // Handle remittance if recipient address is provided and different from sender
      if (recipientAddress && recipientAddress !== signer.address) {
        console.log('🔄 Transferring received tokens to recipient...');
        
        // Create token contract for the output token (cNGN)
        const outputTokenContract = new Contract(toTokenAddress, ['function transfer(address to, uint256 amount) returns (bool)'], signer);
        
        // Transfer the received tokens to the recipient
        const transferTx = await outputTokenContract.populateTransaction.transfer(
          recipientAddress,
          expectedAmountOut
        );
        
        console.log('📋 Transfer transaction:', transferTx);
        
        // Send transfer transaction using viem
        const transferHash = await walletClient.sendTransaction({
          account: signer.address as `0x${string}`,
          to: toTokenAddress as `0x${string}`,
          data: transferTx.data as `0x${string}`,
          value: BigInt(0)
        });
        
        console.log('📤 Transfer transaction hash:', transferHash);
        console.log('⏳ Waiting for transfer confirmation...');
        
        // Wait for transfer transaction
        await publicClient.waitForTransactionReceipt({ hash: transferHash });
        console.log('✅ Transfer confirmed!');
        
        return {
          success: true,
          hash,
          transferHash,
          amountOut: formatEther(BigInt(expectedAmountOut)),
          recipient: recipientAddress,
          message: `Successfully sent ${formatEther(BigInt(expectedAmountOut))} USDC to ${recipientAddress}!`
        };
      } else {
        return {
          success: true,
          hash,
          amountOut: formatEther(BigInt(expectedAmountOut)),
          recipient: signer.address,
          message: `Successfully swapped ${formatEther(BigInt(amountInWei))} cUSD for ${formatEther(BigInt(expectedAmountOut))} USDC!`
        };
      }
      } catch (error1) {
        console.log('Method 1 failed:', error1 instanceof Error ? error1.message : String(error1));
        
        try {
          // Method 2: Try alternative broker function call
          console.log('🔄 Trying alternative broker function signature...');
          // Alternative signature with additional parameters
          const deadline = (Math.floor(Date.now() / 1000) + 60 * 20).toString(); // 20 minutes as string
          swapTxObj = await broker.populateTransaction.swapIn(
            correctExchange.providerAddr,
            correctExchange.id,
            fromTokenAddress,
            toTokenAddress,
            amountInWei.toString(),
            expectedAmountOut
          );
          console.log('✅ Alternative broker call succeeded!');
        } catch (error2) {
          console.log('Method 2 failed:', error2 instanceof Error ? error2.message : String(error2));
          // If all methods fail, throw an error with diagnostic info
          // Method 4: List all available functions on the broker
          console.log('🔍 Listing all broker interface functions...');
          const brokerInterface = broker.interface;
          console.log('Broker interface:', brokerInterface);
          console.log('Broker interface functions:', Object.getOwnPropertyNames(brokerInterface));
          console.log('Broker methods:', Object.getOwnPropertyNames(broker));
          // List all available functions by name - handle Map structure
          console.log('📋 Available broker functions:');
          const interfaceAny = brokerInterface as any;
          if (interfaceAny.fragments) {
            interfaceAny.fragments.forEach((fragment: any) => {
              if (fragment.type === 'function') {
                const signature = `${fragment.name}(${fragment.inputs.map((input: any) => `${input.type} ${input.name}`).join(', ')})`;
                console.log(`- ${signature}`);
              }
            });
          }
          // Try to find swap-related functions from fragments
          const swapFunctions: string[] = [];
          const exchangeFunctions: string[] = [];
          if (interfaceAny.fragments) {
            interfaceAny.fragments.forEach((fragment: any) => {
              if (fragment.type === 'function') {
                const name = fragment.name.toLowerCase();
                if (name.includes('swap')) {
                  swapFunctions.push(fragment.name);
                }
                if (name.includes('exchange') || name.includes('trade')) {
                  exchangeFunctions.push(fragment.name);
                }
              }
            });
          }
          console.log('🔄 Swap-related functions:', swapFunctions);
          console.log('💱 Exchange/Trade-related functions:', exchangeFunctions);
          // If all methods fail, throw an error with diagnostic info
          throw new Error(`All swap methods failed. Exchanges: ${exchanges.length}, Available methods: ${Object.getOwnPropertyNames(mento).join(', ')}`);
        }
      }
      
      console.log('📋 Swap transaction object:', swapTxObj);
      
      const swapTx = await signer.sendTransaction(swapTxObj);
      const swapTxReceipt = await swapTx.wait();
      
      console.log('🎉 Swap tx receipt:', swapTxReceipt);
      
      if (swapTxReceipt.status === 1) {
        console.log('🎊 Swap successful!');
        return swapTxReceipt;
      } else {
        throw new Error('Swap transaction reverted');
      }
      
    } catch (error) {
      console.error('❌ Swap failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown',
      });
      throw error;
    }
  };

  return { swap };
} 