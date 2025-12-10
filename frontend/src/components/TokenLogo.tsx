import React, { useState } from 'react';
import { getTokenLogo, FALLBACK_LOGO } from '../constants/tokenLogos';

interface TokenLogoProps {
    symbol: string;
    size?: number; // Size in pixels (default: 32)
    className?: string;
    alt?: string;
}

export const TokenLogo: React.FC<TokenLogoProps> = ({
    symbol,
    size = 32,
    className = '',
    alt
}) => {
    const [imgError, setImgError] = useState(false);
    const logoUrl = getTokenLogo(symbol);

    return (
        <img
            src={imgError ? FALLBACK_LOGO : logoUrl}
            alt={alt || `${symbol} logo`}
            width={size}
            height={size}
            className={`rounded-full ${className}`}
            onError={() => setImgError(true)}
            style={{ objectFit: 'cover' }}
        />
    );
};
