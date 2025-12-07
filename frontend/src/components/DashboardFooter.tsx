import React from 'react';

/**
 * DashboardFooter - Compact footer for app pages (/core, etc.)
 * Minimal design similar to Aave's dashboard footer
 */
export const DashboardFooter: React.FC = () => {
    return (
        <footer className="border-t border-white/10 bg-black/40 backdrop-blur-xl mt-auto">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50 font-mono">

                    {/* Left: Brand */}
                    <div className="flex items-center gap-2">
                        <span className="text-[#8AE06C] font-bold">AUTONOMY</span>
                        <span className="text-white/30">|</span>
                        <span>Story Aeneid Testnet</span>
                    </div>

                    {/* Center: Links */}
                    <div className="flex items-center gap-6">
                        <a
                            href="https://docs.story.foundation"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#8AE06C] transition-colors"
                        >
                            Docs
                        </a>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#8AE06C] transition-colors"
                        >
                            GitHub
                        </a>
                        <a
                            href="https://discord.gg/storyprotocol"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#8AE06C] transition-colors"
                        >
                            Discord
                        </a>
                    </div>

                    {/* Right: Legal */}
                    <div className="flex items-center gap-4">
                        <a
                            href="#"
                            className="hover:text-[#8AE06C] transition-colors"
                        >
                            Terms
                        </a>
                        <a
                            href="#"
                            className="hover:text-[#8AE06C] transition-colors"
                        >
                            Privacy
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
