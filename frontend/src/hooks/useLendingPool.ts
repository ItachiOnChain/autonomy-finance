import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { parseUnits, type Abi } from 'viem';
import { CONTRACTS } from '../config/contracts';
import { bigIntToNumber } from '../utils/formatters';

const LendingPoolABI = CONTRACTS.LENDING_POOL.abi as unknown as Abi;
const ERC20ABI = CONTRACTS.USDC.abi as unknown as Abi; // Using USDC ABI for generic ERC20 calls

const LENDING_POOL_ADDRESS = CONTRACTS.LENDING_POOL.address as `0x${string}`;

export function useLendingPool() {
    const { writeContractAsync, isPending } = useWriteContract();

    // Supply function
    const supply = async (assetAddress: string, amount: string, decimals: number) => {
        const amountWei = parseUnits(amount, decimals);
        return await writeContractAsync({
            address: LENDING_POOL_ADDRESS,
            abi: LendingPoolABI,
            functionName: 'supply',
            args: [assetAddress, amountWei],
        });
    };

    // Withdraw function
    const withdraw = async (assetAddress: string, amount: string, decimals: number) => {
        const amountWei = parseUnits(amount, decimals);
        return await writeContractAsync({
            address: LENDING_POOL_ADDRESS,
            abi: LendingPoolABI,
            functionName: 'withdraw',
            args: [assetAddress, amountWei],
        });
    };

    // Borrow function
    const borrow = async (assetAddress: string, amount: string, decimals: number) => {
        const amountWei = parseUnits(amount, decimals);
        return await writeContractAsync({
            address: LENDING_POOL_ADDRESS,
            abi: LendingPoolABI,
            functionName: 'borrow',
            args: [assetAddress, amountWei],
        });
    };

    // Repay function
    const repay = async (assetAddress: string, amount: string, decimals: number) => {
        const amountWei = parseUnits(amount, decimals);
        return await writeContractAsync({
            address: LENDING_POOL_ADDRESS,
            abi: LendingPoolABI,
            functionName: 'repay',
            args: [assetAddress, amountWei],
        });
    };

    // Approve function
    const approve = async (assetAddress: string, amount: string, decimals: number) => {
        const amountWei = parseUnits(amount, decimals);
        return await writeContractAsync({
            address: assetAddress as `0x${string}`,
            abi: ERC20ABI,
            functionName: 'approve',
            args: [LENDING_POOL_ADDRESS, amountWei],
        });
    };

    // Mint function (dev only)
    const mint = async (assetAddress: string, amount: string, decimals: number) => {
        const amountWei = parseUnits(amount, decimals);
        return await writeContractAsync({
            address: assetAddress as `0x${string}`,
            abi: ERC20ABI,
            functionName: 'publicMint',
            args: [amountWei],
        });
    };

    return {
        supply,
        withdraw,
        borrow,
        repay,
        approve,
        mint,
        isPending,
        lendingPoolAddress: LENDING_POOL_ADDRESS,
    };
}

// Hook to get token balance
export function useTokenBalance(tokenAddress: string) {
    const { address: userAddress } = useAccount();

    const { data: balance, refetch } = useReadContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });

    return {
        balance: balance ? BigInt(balance.toString()) : 0n,
        refetch,
    };
}

// Hook to get token allowance
export function useTokenAllowance(tokenAddress: string) {
    const { address: userAddress } = useAccount();

    const { data: allowance, refetch } = useReadContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: userAddress ? [userAddress, LENDING_POOL_ADDRESS] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });

    return {
        allowance: allowance ? BigInt(allowance.toString()) : 0n,
        refetch,
    };
}

// Hook to get asset data
export function useAssetData(assetAddress: string) {
    // Total supplied
    const { data: totalSupplied, refetch: refetchTotalSupplied } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getTotalSupply',
        args: [assetAddress],
    });

    // Total borrowed
    const { data: totalBorrowed, refetch: refetchTotalBorrowed } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getTotalBorrowed',
        args: [assetAddress],
    });

    // Available liquidity
    const { data: availableLiquidity, refetch: refetchAvailableLiquidity } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getAvailableLiquidity',
        args: [assetAddress],
    });

    // Utilization rate
    const { data: utilizationRate, refetch: refetchUtilizationRate } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getUtilizationRate',
        args: [assetAddress],
    });

    // Supply APR
    const { data: supplyAPR, refetch: refetchSupplyAPR } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getSupplyAPR',
        args: [assetAddress],
    });

    // Borrow APR
    const { data: borrowAPR, refetch: refetchBorrowAPR } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getBorrowAPR',
        args: [assetAddress],
    });

    // Refetch all asset data
    const refetch = async () => {
        await Promise.all([
            refetchTotalSupplied(),
            refetchTotalBorrowed(),
            refetchAvailableLiquidity(),
            refetchUtilizationRate(),
            refetchSupplyAPR(),
            refetchBorrowAPR(),
        ]);
    };

    return {
        totalSupplied: totalSupplied ? BigInt(totalSupplied.toString()) : 0n,
        totalBorrowed: totalBorrowed ? BigInt(totalBorrowed.toString()) : 0n,
        availableLiquidity: availableLiquidity ? BigInt(availableLiquidity.toString()) : 0n,
        utilizationRate: utilizationRate ? Number(utilizationRate) / 100 : 0, // Convert from basis points
        supplyAPR: supplyAPR ? Number(supplyAPR) / 100 : 0, // Convert from basis points
        borrowAPR: borrowAPR ? Number(borrowAPR) / 100 : 0, // Convert from basis points
        refetch,
    };
}

// Hook to get user position
export function useUserPosition(assetAddress: string) {
    const { address: userAddress } = useAccount();

    const { data: position, refetch, error } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getUserPosition',
        args: userAddress ? [userAddress, assetAddress] : undefined,
        query: {
            enabled: !!userAddress && !!assetAddress,
        },
    });

    if (error) console.error('Error fetching position:', error);
    // Removed console.log that was causing excessive logging during render

    return {
        supplied: position && typeof position === 'object' && 'supplied' in position ? BigInt((position as any).supplied.toString()) : 0n,
        borrowed: position && typeof position === 'object' && 'borrowed' in position ? BigInt((position as any).borrowed.toString()) : 0n,
        refetch,
    };
}

// Hook to get user health factor
export function useUserHealthFactor() {
    const { address: userAddress } = useAccount();

    const { data: healthFactor, error, refetch } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getUserHealthFactor',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });

    if (error) console.error('Error fetching HF:', error);

    // Health factor is returned with 18 decimals (1e18 = 1.0)
    // Use safe conversion to prevent exponential notation
    const hf = healthFactor ? bigIntToNumber(BigInt(healthFactor.toString()), 18) : Infinity;

    return {
        healthFactor: hf,
        isHealthy: hf > 1.5,
        isAtRisk: hf > 1.0 && hf <= 1.5,
        isLiquidatable: hf <= 1.0 && hf !== Infinity,
        refetch,
    };
}

// Hook to get user total collateral and debt values
export function useUserTotalValues() {
    const { address: userAddress } = useAccount();

    const { data: collateralValue, refetch: refetchCollateral } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getUserTotalCollateralValue',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });

    const { data: debtValue, refetch: refetchDebt } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getUserTotalDebtValue',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });

    const collateralBigInt = collateralValue ? BigInt(collateralValue.toString()) : 0n;
    const debtBigInt = debtValue ? BigInt(debtValue.toString()) : 0n;

    // Calculate LTV safely
    const ltv = collateralBigInt > 0n
        ? (bigIntToNumber(debtBigInt, 18) / bigIntToNumber(collateralBigInt, 18)) * 100
        : 0;

    const refetch = async () => {
        await Promise.all([refetchCollateral(), refetchDebt()]);
    };

    return {
        totalCollateralValue: collateralBigInt,
        totalDebtValue: debtBigInt,
        ltv,
        refetch,
    };
}
