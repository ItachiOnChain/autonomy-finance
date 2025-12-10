import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { type Abi, formatUnits } from 'viem';
import { ASSETS } from '../config/assets';
import { getContracts, MARKET_CHAIN_ID } from '../config/contracts';
import { MOCK_RATES } from '../config/mockRates';
import { bigIntToNumber } from '../utils/formatters';

// Helper hook to get contracts for the MARKET chain (Story Aeneid)
// This is used for displaying market data, NOT for wallet transactions
function useContractsForMarket() {
    const contracts = getContracts(MARKET_CHAIN_ID);
    return contracts;
}



// Hook to get lending pool contracts for MARKET display
// Uses MARKET_CHAIN_ID (Story Aeneid) to show markets regardless of wallet chain
function useLendingPoolContracts() {
    const contracts = useContractsForMarket();

    if (!contracts) {
        console.error('[useLendingPoolContracts] No contracts found for MARKET_CHAIN_ID', MARKET_CHAIN_ID);
        return {
            LendingPoolABI: undefined,
            ERC20ABI: undefined,
            LENDING_POOL_ADDRESS: undefined,
            contractsFound: false,
        };
    }

    const LENDING_POOL = contracts.LENDING_POOL;
    // Use USDC ABI for generic ERC20 calls
    const ERC20ABI = contracts.USDC?.abi;

    if (!LENDING_POOL || !ERC20ABI) {
        console.error('[useLendingPoolContracts] Missing LENDING_POOL or ERC20 ABI for MARKET_CHAIN_ID', MARKET_CHAIN_ID);
        return {
            LendingPoolABI: undefined,
            ERC20ABI: undefined,
            LENDING_POOL_ADDRESS: undefined,
            contractsFound: false,
        };
    }

    return {
        LendingPoolABI: LENDING_POOL.abi as unknown as Abi,
        ERC20ABI: ERC20ABI as unknown as Abi,
        LENDING_POOL_ADDRESS: LENDING_POOL.address as `0x${string}`,
        contractsFound: true,
    };
}

export function useLendingPool() {
    const { writeContractAsync, isPending } = useWriteContract();
    const { LendingPoolABI, ERC20ABI, LENDING_POOL_ADDRESS, contractsFound } = useLendingPoolContracts();

    // Safe contract access with error handling
    if (!contractsFound || !LendingPoolABI || !ERC20ABI || !LENDING_POOL_ADDRESS) {
        return {
            supply: async () => { throw new Error('Contracts not found'); },
            borrow: async () => { throw new Error('Contracts not found'); },
            repay: async () => { throw new Error('Contracts not found'); },
            withdraw: async () => { throw new Error('Contracts not found'); },
            isPending,
        };
    }

    const supply = async (assetAddress: string, amount: bigint) => {
        return writeContractAsync({
            address: LENDING_POOL_ADDRESS,
            abi: LendingPoolABI,
            functionName: 'supply',
            args: [assetAddress, amount],
        });
    };

    const borrow = async (assetAddress: string, amount: bigint) => {
        return writeContractAsync({
            address: LENDING_POOL_ADDRESS,
            abi: LendingPoolABI,
            functionName: 'borrow',
            args: [assetAddress, amount],
        });
    };

    const repay = async (assetAddress: string, amount: bigint) => {
        return writeContractAsync({
            address: LENDING_POOL_ADDRESS,
            abi: LendingPoolABI,
            functionName: 'repay',
            args: [assetAddress, amount],
        });
    };

    const withdraw = async (assetAddress: string, amount: bigint) => {
        return writeContractAsync({
            address: LENDING_POOL_ADDRESS,
            abi: LendingPoolABI,
            functionName: 'withdraw',
            args: [assetAddress, amount],
        });
    };

    return {
        supply,
        borrow,
        repay,
        withdraw,
        isPending,
    };
}

// Hook to approve tokens for lending pool
export function useApprove(assetAddress: string) {
    const { writeContractAsync, isPending } = useWriteContract();
    const { ERC20ABI, LENDING_POOL_ADDRESS } = useLendingPoolContracts();

    const approve = async (amount: bigint) => {
        if (!ERC20ABI || !LENDING_POOL_ADDRESS) {
            throw new Error('Contracts not found');
        }

        return writeContractAsync({
            address: assetAddress as `0x${string}`,
            abi: ERC20ABI,
            functionName: 'approve',
            args: [LENDING_POOL_ADDRESS, amount],
        });
    };

    return {
        approve,
        isPending,
    };
}

// Hook to check allowance
export function useAllowance(assetAddress: string) {
    const { address: userAddress } = useAccount();
    const { ERC20ABI, LENDING_POOL_ADDRESS } = useLendingPoolContracts();

    const { data: allowance, refetch } = useReadContract({
        address: assetAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [userAddress, LENDING_POOL_ADDRESS],
        query: {
            enabled: !!userAddress && !!ERC20ABI && !!LENDING_POOL_ADDRESS,
        },
    });

    return {
        allowance: allowance ? BigInt(allowance.toString()) : 0n,
        refetch,
    };
}

// Hook to get token balance
export function useTokenBalance(assetAddress: string) {
    const { address: userAddress } = useAccount();
    const contracts = useContractsForMarket();
    const ERC20ABI = contracts?.USDC?.abi as unknown as Abi;

    const { data: balance, refetch } = useReadContract({
        address: assetAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [userAddress],
        query: {
            enabled: !!userAddress && !!ERC20ABI && !!assetAddress,
        },
    });

    return {
        balance: balance ? BigInt(balance.toString()) : 0n,
        refetch,
    };
}



// Hook to get asset data - uses MARKET_CHAIN_ID for displaying markets
export function useAssetData(assetAddress: string) {
    const contracts = useContractsForMarket();
    const { LendingPoolABI, LENDING_POOL_ADDRESS, contractsFound } = useLendingPoolContracts();

    if (!contractsFound || !LendingPoolABI || !LENDING_POOL_ADDRESS) {
        return {
            totalSupplied: 0n,
            totalBorrowed: 0n,
            availableLiquidity: 0n,
            utilizationRate: 0,
            supplyAPR: 0,
            borrowAPR: 0,
            refetch: async () => { },
        };
    }

    // Get total supplied
    const { data: totalSuppliedData, refetch: refetchSupply } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getTotalSupply',
        args: [assetAddress],
        query: {
            enabled: !!assetAddress,
        },
    });

    // Get total borrowed
    const { data: totalBorrowedData, refetch: refetchBorrowed } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getTotalBorrowed',
        args: [assetAddress],
        query: {
            enabled: !!assetAddress,
        },
    });

    // Get available liquidity
    const { data: availableLiquidityData, refetch: refetchLiquidity } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getAvailableLiquidity',
        args: [assetAddress],
        query: {
            enabled: !!assetAddress,
        },
    });

    // Get utilization rate
    const { data: utilizationRateData, refetch: refetchUtilization } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getUtilizationRate',
        args: [assetAddress],
        query: {
            enabled: !!assetAddress,
        },
    });

    // Parse data
    const totalSupplied = totalSuppliedData ? BigInt(totalSuppliedData.toString()) : 0n;
    const totalBorrowed = totalBorrowedData ? BigInt(totalBorrowedData.toString()) : 0n;
    const availableLiquidity = availableLiquidityData ? BigInt(availableLiquidityData.toString()) : 0n;
    const utilizationRate = utilizationRateData ? Number(utilizationRateData) / 100 : 0; // Basis points to percentage

    // Get APRs from contract
    const { data: supplyAPRData } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getSupplyAPR',
        args: [assetAddress],
        query: {
            enabled: !!assetAddress,
        },
    });

    const { data: borrowAPRData } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getBorrowAPR',
        args: [assetAddress],
        query: {
            enabled: !!assetAddress,
        },
    });

    // Convert APRs from basis points to percentages (10000 = 100%)
    const contractSupplyAPR = supplyAPRData ? Number(supplyAPRData) / 100 : 0;
    const contractBorrowAPR = borrowAPRData ? Number(borrowAPRData) / 100 : 0;

    // Find asset symbol for Story market rates
    const assetSymbol = ASSETS.find(a => {
        const assetConfig = (contracts as any)?.[a.symbol];
        return assetConfig?.address?.toLowerCase() === assetAddress.toLowerCase();
    })?.symbol;

    // Use Story Aeneid market rates when contract returns 0 (no borrowing activity yet)
    // These are baseline rates for the newly deployed protocol
    const storyRate = assetSymbol ? MOCK_RATES[assetSymbol as keyof typeof MOCK_RATES] : undefined;
    const finalSupplyAPR = (contractSupplyAPR === 0 && storyRate) ? (storyRate as any).supplyAPY : contractSupplyAPR;
    const finalBorrowAPR = ((contractBorrowAPR === 0 || contractBorrowAPR === 2) && storyRate) ? (storyRate as any).borrowAPR : contractBorrowAPR;

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development' && assetSymbol) {
        console.log('[AutonomyFinance][AssetPage] Story reserve state', {
            chainId: MARKET_CHAIN_ID,
            assetSymbol,
            poolAddress: LENDING_POOL_ADDRESS,
            tokenAddress: assetAddress,
            rawReserveData: {
                totalSuppliedData,
                totalBorrowedData,
                availableLiquidityData,
                utilizationRateData
            },
            parsed: {
                totalSupplied,
                totalBorrowed,
                availableLiquidity,
                utilizationRate
            }
        });

        if (availableLiquidity === 0n) {
            console.warn('[AutonomyFinance][AssetPage] Missing or invalid reserve data (or 0 liquidity)', {
                assetSymbol,
                chainId: MARKET_CHAIN_ID
            });
        }

        console.log('[AutonomyFinance] Story Aeneid rates', {

            assetSymbol,
            chainId: MARKET_CHAIN_ID,
            contractSupplyAPR,
            contractBorrowAPR,
            storySupplyAPY: storyRate?.supplyAPY,
            storyBorrowAPR: storyRate?.borrowAPR,
            finalSupplyAPR,
            finalBorrowAPR,
            usingStoryRates: contractBorrowAPR === 0 && !!storyRate
        });
    }

    // Log liquidity state
    if (process.env.NODE_ENV === 'development' && assetSymbol) {
        console.log('[AutonomyFinance] Story Aeneid liquidity', {
            chainId: MARKET_CHAIN_ID,
            assetSymbol,
            assetAddress,
            availableLiquidity: availableLiquidity.toString(),
            totalSupplied: totalSupplied.toString(),
            totalBorrowed: totalBorrowed.toString(),
            utilizationRate: `${utilizationRate}%`
        });
    }

    // Refetch all data
    const refetch = async () => {
        await Promise.all([
            refetchSupply(),
            refetchBorrowed(),
            refetchLiquidity(),
            refetchUtilization()
        ]);
    };

    return {
        totalSupplied,
        totalBorrowed,
        availableLiquidity,
        utilizationRate,
        supplyAPR: finalSupplyAPR,
        borrowAPR: finalBorrowAPR,
        refetch,
    };
}

// Hook to get user position for an asset
export function useUserPosition(assetAddress: string) {
    const { address: userAddress } = useAccount();
    const { LendingPoolABI, LENDING_POOL_ADDRESS, contractsFound } = useLendingPoolContracts();

    if (!contractsFound || !LendingPoolABI || !LENDING_POOL_ADDRESS || !userAddress) {
        return {
            supplied: 0n,
            borrowed: 0n,
            collateral: 0n, // Maps to lastUpdateTimestamp in struct but kept for backward compat interface
            refetch: async () => { },
        };
    }

    const { data: positionData, refetch } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getUserPosition',
        args: [userAddress, assetAddress],
        query: {
            enabled: !!userAddress && !!assetAddress,
        },
    });

    // Handle both Array (old viem/wagmi) and Object (new viem) return types
    const positionDataAny = positionData as any;

    let supplied = 0n;
    let borrowed = 0n;
    let lastUpdateTimestamp = 0n; // This was mapped to 'collateral' in original code

    if (positionDataAny) {
        if (Array.isArray(positionDataAny)) {
            supplied = BigInt(positionDataAny[0].toString());
            borrowed = BigInt(positionDataAny[1].toString());
            lastUpdateTimestamp = BigInt(positionDataAny[2].toString());
        } else if (typeof positionDataAny === 'object') {
            // Try accessing by name if returned as object
            supplied = positionDataAny.supplied ? BigInt(positionDataAny.supplied.toString()) : 0n;
            borrowed = positionDataAny.borrowed ? BigInt(positionDataAny.borrowed.toString()) : 0n;
            lastUpdateTimestamp = positionDataAny.lastUpdateTimestamp ? BigInt(positionDataAny.lastUpdateTimestamp.toString()) : 0n;
        }
    }

    return {
        supplied,
        borrowed,
        collateral: lastUpdateTimestamp, // Keeping property name as 'collateral' to match component expectation, though it is timestamp
        refetch,
    };
}

// Hook to get user's total health factor
export function useHealthFactor() {
    const { address: userAddress } = useAccount();
    const { LendingPoolABI, LENDING_POOL_ADDRESS, contractsFound } = useLendingPoolContracts();

    if (!contractsFound || !LendingPoolABI || !LENDING_POOL_ADDRESS || !userAddress) {
        return {
            healthFactor: 0,
            refetch: async () => { },
        };
    }

    const { data: healthFactorData, refetch } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getUserHealthFactor',
        args: [userAddress],
        query: {
            enabled: !!userAddress,
        },
    });

    // Health factor is returned in 18 decimals (1e18 = 1.0)
    const healthFactor = healthFactorData ? Number(formatUnits(BigInt(healthFactorData.toString()), 18)) : 0;

    return {
        healthFactor,
        refetch,
    };
}

// Hook to get user's total collateral and debt in USD
export function useUserTotals() {
    const { address: userAddress } = useAccount();
    const { LendingPoolABI, LENDING_POOL_ADDRESS, contractsFound } = useLendingPoolContracts();

    if (!contractsFound || !LendingPoolABI || !LENDING_POOL_ADDRESS || !userAddress) {
        return {
            totalCollateralUSD: 0,
            totalDebtUSD: 0,
            availableBorrowsUSD: 0,
            refetch: async () => { },
        };
    }

    // Fetch Collateral Value (borrow capacity)
    const { data: collateralData, refetch: refetchCollateral } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getUserTotalCollateralValue',
        args: [userAddress],
        query: { enabled: !!userAddress },
    });

    // Fetch Total Debt
    const { data: debtData, refetch: refetchDebt } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getUserTotalDebtValue',
        args: [userAddress],
        query: { enabled: !!userAddress },
    });

    // Parse and format (assuming 8 decimals for Oracle USD prices, check PriceOracle)
    // The contract returns values in USD with 18 decimals usually if Oracle uses 18?
    // Wait, PriceOracle usually returns 8 decimals (Chainlink).
    // Let's check LendingPool code: 
    // uint256 assetValue = (position.supplied * price * ltv) / (10**decimals * BASIS_POINTS);
    // If price is 8 decimals, assetValue is 8 decimals.
    // So we use 8 decimals for formatting.

    const totalCollateralUSD = collateralData ? bigIntToNumber(BigInt(collateralData.toString()), 8) : 0;
    const totalDebtUSD = debtData ? bigIntToNumber(BigInt(debtData.toString()), 8) : 0;

    // Available borrows = Capacity - Debt
    // Ensure we don't show negative if something is weird
    const availableBorrowsUSD = Math.max(0, totalCollateralUSD - totalDebtUSD);

    const refetch = async () => {
        await Promise.all([refetchCollateral(), refetchDebt()]);
    };

    return {
        totalCollateralUSD, // This is actually Borrow Capacity
        totalDebtUSD,
        availableBorrowsUSD,
        refetch,
    };
}

// Hook to get E-Mode category for user
export function useUserEMode() {
    const { address: userAddress } = useAccount();
    const { LendingPoolABI, LENDING_POOL_ADDRESS, contractsFound } = useLendingPoolContracts();

    if (!contractsFound || !LendingPoolABI || !LENDING_POOL_ADDRESS || !userAddress) {
        return {
            eModeCategory: 0,
            refetch: async () => { },
        };
    }

    const { data: eModeData, refetch } = useReadContract({
        address: LENDING_POOL_ADDRESS,
        abi: LendingPoolABI,
        functionName: 'getUserEMode',
        args: [userAddress],
        query: {
            enabled: !!userAddress,
        },
    });

    const eModeCategory = eModeData ? Number(eModeData) : 0;

    return {
        eModeCategory,
        refetch,
    };
}

// Hook to set E-Mode category
export function useSetEMode() {
    const { writeContractAsync, isPending } = useWriteContract();
    const { LendingPoolABI, LENDING_POOL_ADDRESS } = useLendingPoolContracts();

    const setEMode = async (categoryId: number) => {
        if (!LendingPoolABI || !LENDING_POOL_ADDRESS) {
            throw new Error('Contracts not found');
        }

        return writeContractAsync({
            address: LENDING_POOL_ADDRESS,
            abi: LendingPoolABI,
            functionName: 'setUserEMode',
            args: [categoryId],
        });
    };

    return {
        setEMode,
        isPending,
    };
}

// Hook to get all user positions across all assets
export function useAllUserPositions() {
    const contracts = useContractsForMarket();

    const positions = ASSETS.map(asset => {
        const assetAddress = (contracts as any)?.[asset.symbol]?.address as string;
        const position = useUserPosition(assetAddress);

        return {
            asset,
            assetAddress,
            ...position,
        };
    }).filter(p => p.assetAddress); // Filter out assets not found in config

    return positions;
}

// Hook to get market summary (all assets)
export function useMarketSummary() {
    const contracts = useContractsForMarket();

    const markets = ASSETS.map(asset => {
        const assetAddress = (contracts as any)?.[asset.symbol]?.address as string;
        const data = useAssetData(assetAddress);

        return {
            asset,
            assetAddress,
            ...data,
        };
    }).filter(m => m.assetAddress); // Filter out assets not found in config

    // Calculate total market size
    const totalSuppliedUSD = markets.reduce((sum, m) => {
        const valueUSD = bigIntToNumber(m.totalSupplied, m.asset.decimals) * 1; // Simplified, would need price oracle
        return sum + valueUSD;
    }, 0);

    const totalBorrowedUSD = markets.reduce((sum, m) => {
        const valueUSD = bigIntToNumber(m.totalBorrowed, m.asset.decimals) * 1; // Simplified, would need price oracle
        return sum + valueUSD;
    }, 0);

    return {
        markets,
        totalSuppliedUSD,
        totalBorrowedUSD,
    };
}
