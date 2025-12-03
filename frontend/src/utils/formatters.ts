import { formatUnits } from 'viem';

/**
 * Format a token amount from wei to human-readable format
 * @param value - The value in wei (bigint)
 * @param decimals - Token decimals (e.g., 18 for ETH, 6 for USDC)
 * @param maxDecimals - Maximum decimal places to show (default: 4)
 * @returns Formatted string with commas and limited decimals
 */
export function formatTokenAmount(
    value: bigint | undefined,
    decimals: number,
    maxDecimals: number = 4
): string {
    if (value === undefined || value === null) return '0.00';

    try {
        // Convert from wei to decimal string
        const formatted = formatUnits(value, decimals);
        const num = Number(formatted);

        // Handle very small numbers
        if (num === 0) return '0.00';
        if (num < 0.0001 && num > 0) return '< 0.0001';

        // Format with commas and limited decimals
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: maxDecimals,
        }).format(num);
    } catch (error) {
        console.error('Error formatting token amount:', error);
        return '0.00';
    }
}

/**
 * Format health factor for display
 * @param healthFactor - The health factor value
 * @returns Formatted string (e.g., "2.45", "∞", or "N/A")
 */
export function formatHealthFactor(healthFactor: number | undefined): string {
    if (healthFactor === undefined || healthFactor === null) return 'N/A';
    if (healthFactor === Infinity || healthFactor > 1000000) return '∞';
    if (healthFactor === 0) return 'N/A';

    return healthFactor.toFixed(2);
}

/**
 * Format a percentage value
 * @param value - The percentage value (e.g., 2.5 for 2.5%)
 * @param decimals - Decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | undefined, decimals: number = 2): string {
    if (value === undefined || value === null) return '0.00%';

    return `${value.toFixed(decimals)}%`;
}

/**
 * Format a USD value
 * @param value - The value in wei (bigint, assuming 18 decimals)
 * @param decimals - Decimals (default: 18)
 * @returns Formatted USD string with $ prefix
 */
export function formatUSD(value: bigint | undefined, decimals: number = 18): string {
    if (value === undefined || value === null) return '$0.00';

    try {
        const formatted = formatUnits(value, decimals);
        const num = Number(formatted);

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    } catch (error) {
        console.error('Error formatting USD:', error);
        return '$0.00';
    }
}

/**
 * Safely convert BigInt to number for calculations
 * Use only when you're sure the value won't overflow
 * @param value - BigInt value
 * @param decimals - Decimals to normalize
 * @returns Number value
 */
export function bigIntToNumber(value: bigint | undefined, decimals: number): number {
    if (value === undefined || value === null) return 0;

    try {
        const formatted = formatUnits(value, decimals);
        return Number(formatted);
    } catch (error) {
        console.error('Error converting BigInt to number:', error);
        return 0;
    }
}
