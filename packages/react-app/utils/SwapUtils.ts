import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { NumberT, parseAmountWithDefault, toWei } from './amount'


export function parseInputExchangeAmount(
  amount: NumberT | null | undefined,
  decimals: number,
  isWei = false
) {
  const parsed = parseAmountWithDefault(amount, 0)
  const parsedWei = isWei ? parsed : toWei(parsed,decimals)
  return BigNumber.max(parsedWei, 0).toFixed(0)
}

export function getMinBuyAmount(
  amountInWei: BigNumber.Value,
  slippage: BigNumber.Value
): BigNumber {
  const slippageFactor = new BigNumber(slippage).div(100).minus(1).times(-1)
  return new BigNumber(amountInWei).times(slippageFactor).decimalPlaces(0)
}

export function getMaxSellAmount(
  amountInWei: BigNumber.Value,
  slippage: BigNumber.Value
): BigNumber {
  const slippageFactor = new BigNumber(slippage).div(100).plus(1)
  return new BigNumber(amountInWei).times(slippageFactor).decimalPlaces(0)
}

export function calcExchangeRate(
  fromAmountWei: NumberT,
  fromDecimals: number,
  toAmountWei: NumberT,
  toDecimals: number
) {
  try {
    const rate = new BigNumber(
      ethers.utils.formatUnits(fromAmountWei.toString(), fromDecimals)
    ).dividedBy(ethers.utils.formatUnits(toAmountWei.toString(), toDecimals))
    if (rate.isFinite()) return rate.toFixed(4, BigNumber.ROUND_DOWN)
    else return '0'
  } catch (error) {
    console.log('Error computing exchange values', error)
    return '0'
  }
}

export function invertExchangeRate(rate: NumberT) {
  try {
    const inverted = new BigNumber(1).dividedBy(rate)
    if (inverted.isFinite()) return inverted.toFixed(4, BigNumber.ROUND_DOWN)
    else return '0'
  } catch (error) {
    console.log('Error inverting exchange values', error)
    return '0'
  }
}