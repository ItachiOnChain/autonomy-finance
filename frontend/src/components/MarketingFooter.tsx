import React from 'react';

export const MarketingFooter: React.FC = () => {
    return (
        <footer className="mt-0 py-16 border-t border-white/10 bg-black/90 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 font-mono">

                {/* BRAND */}
                <div>
                    <div className="font-bold text-primary tracking-[0.2em] mb-4 drop-shadow-[0_0_8px_#8AE06C]">
                        AUTONOMY FINANCE
                    </div>
                    <p className="text-sm text-white/60">Self-repaying credit powered by Story Protocol.</p>
                </div>

                {/* PROTOCOL */}
                <div>
                    <div className="font-bold text-primary tracking-[0.2em] mb-4">PROTOCOL</div>
                    <ul className="space-y-2 text-white/70 text-sm">
                        <li><a href="#" className="hover:text-primary">Documentation</a></li>
                        <li><a href="#" className="hover:text-primary">GitHub</a></li>
                        <li><a href="#" className="hover:text-primary">Audits</a></li>
                    </ul>
                </div>

                {/* COMMUNITY */}
                <div>
                    <div className="font-bold text-primary tracking-[0.2em] mb-4">COMMUNITY</div>
                    <ul className="space-y-2 text-white/70 text-sm">
                        <li><a href="#" className="hover:text-primary">Discord</a></li>
                        <li><a href="#" className="hover:text-primary">Twitter</a></li>
                        <li><a href="#" className="hover:text-primary">Mirror</a></li>
                    </ul>
                </div>

                {/* LEGAL */}
                <div>
                    <div className="font-bold text-primary tracking-[0.2em] mb-4">LEGAL</div>
                    <ul className="space-y-2 text-white/70 text-sm">
                        <li><a href="#" className="hover:text-primary">Terms</a></li>
                        <li><a href="#" className="hover:text-primary">Privacy</a></li>
                    </ul>
                </div>

            </div>
        </footer>
    );
};
