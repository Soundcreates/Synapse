/**
 * Pricing Migration Utility
 *
 * This utility helps detect and handle datasets created with the old pricing system
 * where prices were stored in ETH instead of credits.
 *
 * OLD SYSTEM: 2 credits → 2 ETH (2000000000000000000 wei)
 * NEW SYSTEM: 2 credits → 0.002 ETH (2000000000000000 wei)
 */

import { ethers } from "ethers";

export const CREDIT_TO_ETH_RATIO = 0.001; // 1 credit = 0.001 ETH

/**
 * Convert credits to wei using the new pricing system
 */
export function creditsToWei(credits: number): bigint {
  const ethAmount = credits * CREDIT_TO_ETH_RATIO;
  return ethers.parseEther(ethAmount.toString());
}

/**
 * Convert wei back to credits using the new pricing system
 */
export function weiToCredits(wei: bigint): number {
  const ethAmount = parseFloat(ethers.formatEther(wei));
  return ethAmount / CREDIT_TO_ETH_RATIO;
}

/**
 * Detect if a price (in wei) was created with the old system
 * Old system: direct conversion (credits → ETH)
 * New system: credits * 0.001 → ETH
 */
export function isOldPricingSystem(priceInWei: bigint): boolean {
  const ethAmount = parseFloat(ethers.formatEther(priceInWei));

  // If the price is >= 0.1 ETH, it's likely from the old system
  // because in the new system, 100 credits = 0.1 ETH (which is quite expensive)
  return ethAmount >= 0.1;
}

/**
 * Convert old pricing to new pricing
 * Assumes the old price was meant to be in credits but was stored as ETH
 */
export function migrateOldPrice(oldPriceInWei: bigint): bigint {
  // Convert the old wei amount back to what the user intended (credits)
  const ethAmount = parseFloat(ethers.formatEther(oldPriceInWei));

  // Treat the ETH amount as the intended credits amount
  const intendedCredits = ethAmount;

  // Convert to the new pricing system
  return creditsToWei(intendedCredits);
}

/**
 * Format price for display in the UI
 */
export function formatPriceDisplay(priceInCredits: number): {
  credits: string;
  eth: string;
  isExpensive: boolean;
} {
  const ethCost = priceInCredits * CREDIT_TO_ETH_RATIO;

  return {
    credits: priceInCredits.toString(),
    eth: ethCost.toFixed(4),
    isExpensive: ethCost > 0.05, // More than 0.05 ETH is considered expensive
  };
}

/**
 * Check if user has sufficient funds for a purchase
 */
export function checkSufficientFunds(
  userBalanceInWei: bigint,
  priceInCredits: number,
  estimatedGasInWei: bigint = ethers.parseEther("0.001") // Default gas estimate
): {
  hasSufficientFunds: boolean;
  requiredWei: bigint;
  shortfallWei: bigint;
} {
  const priceInWei = creditsToWei(priceInCredits);
  const totalRequiredWei = priceInWei + estimatedGasInWei;

  const hasSufficientFunds = userBalanceInWei >= totalRequiredWei;
  const shortfallWei = hasSufficientFunds
    ? 0n
    : totalRequiredWei - userBalanceInWei;

  return {
    hasSufficientFunds,
    requiredWei: totalRequiredWei,
    shortfallWei,
  };
}

/**
 * Get user-friendly error message for insufficient funds
 */
export function getInsufficientFundsMessage(
  priceInCredits: number,
  userBalanceInWei: bigint
): string {
  const { requiredWei, shortfallWei } = checkSufficientFunds(
    userBalanceInWei,
    priceInCredits
  );

  const requiredEth = parseFloat(ethers.formatEther(requiredWei));
  const shortfallEth = parseFloat(ethers.formatEther(shortfallWei));
  const userBalanceEth = parseFloat(ethers.formatEther(userBalanceInWei));

  return `Insufficient funds. You need ${requiredEth.toFixed(
    4
  )} ETH (${priceInCredits} credits + gas) but only have ${userBalanceEth.toFixed(
    4
  )} ETH. You need ${shortfallEth.toFixed(4)} more ETH.`;
}

export default {
  creditsToWei,
  weiToCredits,
  isOldPricingSystem,
  migrateOldPrice,
  formatPriceDisplay,
  checkSufficientFunds,
  getInsufficientFundsMessage,
  CREDIT_TO_ETH_RATIO,
};
