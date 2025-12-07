// Asset configuration for multi-asset lending protocol

// E-Mode Categories
export const EMODE_CATEGORIES = {
    DISABLED: 0,
    STABLECOINS: 1,
    ETH: 2,
    BTC: 3,
} as const;

export const EMODE_CATEGORY_LABELS = {
    [EMODE_CATEGORIES.DISABLED]: 'Disabled',
    [EMODE_CATEGORIES.STABLECOINS]: 'Stablecoins',
    [EMODE_CATEGORIES.ETH]: 'ETH',
    [EMODE_CATEGORIES.BTC]: 'BTC',
} as const;

export const ASSETS = [
    {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        logo: '🔷',
        maxLTV: 75,
        eModeLTV: 90,
        category: EMODE_CATEGORIES.ETH,
        canBeCollateral: true,
        color: '#627EEA'
    },
    {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        logo: '💲',
        maxLTV: 80,
        eModeLTV: 97,
        category: EMODE_CATEGORIES.STABLECOINS,
        canBeCollateral: true,
        color: '#2775CA'
    },
    {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        logo: '💲',
        maxLTV: 80,
        eModeLTV: 97,
        category: EMODE_CATEGORIES.STABLECOINS,
        canBeCollateral: true,
        color: '#26A17B'
    },
    {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        logo: '🅳',
        maxLTV: 80,
        eModeLTV: 97,
        category: EMODE_CATEGORIES.STABLECOINS,
        canBeCollateral: true,
        color: '#F5AC37'
    },
    {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        decimals: 8,
        logo: '₿',
        maxLTV: 75,
        eModeLTV: 90,
        category: EMODE_CATEGORIES.BTC,
        canBeCollateral: true,
        color: '#F7931A'
    },
    {
        symbol: 'LINK',
        name: 'Chainlink',
        decimals: 18,
        logo: '🔗',
        maxLTV: 70,
        eModeLTV: 70,
        category: EMODE_CATEGORIES.DISABLED,
        canBeCollateral: true,
        color: '#2A5ADA'
    },
    {
        symbol: 'UNI',
        name: 'Uniswap',
        decimals: 18,
        logo: '🦄',
        maxLTV: 70,
        eModeLTV: 70,
        category: EMODE_CATEGORIES.DISABLED,
        canBeCollateral: true,
        color: '#FF007A'
    },
    {
        symbol: 'AAVE',
        name: 'Aave Token',
        decimals: 18,
        logo: '👻',
        maxLTV: 70,
        eModeLTV: 70,
        category: EMODE_CATEGORIES.DISABLED,
        canBeCollateral: true,
        color: '#B6509E'
    }
] as const;

export type Asset = typeof ASSETS[number];
export type AssetSymbol = Asset['symbol'];


export function getAssetBySymbol(symbol: string) {
    return ASSETS.find(a => a.symbol === symbol);
}

export function getSupplyAssets() {
    return ASSETS;
}

export function getBorrowAssets() {
    return ASSETS;
}
