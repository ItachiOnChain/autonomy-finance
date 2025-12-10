// License Options Component with Royalty Slider

interface LicenseOptionsProps {
    royaltyPercent: number;
    enableCommercialLicense: boolean;
    onRoyaltyChange: (value: number) => void;
    onLicenseToggle: (value: boolean) => void;
    disabled?: boolean;
    error?: string;
}

export function LicenseOptions({
    royaltyPercent,
    enableCommercialLicense,
    onRoyaltyChange,
    onLicenseToggle,
    disabled,
    error
}: LicenseOptionsProps) {
    return (
        <div className="space-y-4">
            {/* Royalty Slider */}
            <div>
                <div>
                    <label className="block text-xs tracking-wider text-white/70 mb-2">
                        ROYALTY PERCENTAGE: {royaltyPercent}%
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={royaltyPercent}
                        onChange={(e) => onRoyaltyChange(parseFloat(e.target.value))}
                        disabled={disabled}
                        style={{
                            background: `linear-gradient(90deg, #8AE06C 0%, #8AE06C ${royaltyPercent}%, rgba(255,255,255,0.1) ${royaltyPercent}%, rgba(255,255,255,0.1) 100%)`
                        }}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer
            ${error ? 'border border-red-500' : ''}
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[#8AE06C]
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(138,224,108,0.8)]
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[#8AE06C]
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer
          `}
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
                    {error && (
                        <p className="text-red-400 text-xs mt-1">{error}</p>
                    )}
                </div>
            </div>

            {/* Commercial License Toggle */}
            <div className="p-4 bg-black/30 border border-white/10 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={enableCommercialLicense}
                        onChange={(e) => onLicenseToggle(e.target.checked)}
                        disabled={disabled}
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-black/40 
              checked:bg-[#8AE06C] checked:border-[#8AE06C]
              focus:ring-2 focus:ring-[#8AE06C]/50 cursor-pointer"
                    />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-white">Enable Commercial License</p>
                        <p className="text-xs text-white/60 mt-1">
                            Allow others to use your IP for commercial purposes with {royaltyPercent}% royalty share.
                        </p>
                    </div>
                </label>
            </div>
        </div>
    );
}
