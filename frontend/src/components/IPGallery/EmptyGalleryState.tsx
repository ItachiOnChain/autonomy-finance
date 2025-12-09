// Empty Gallery State Component

import { Link } from "react-router-dom";

export function EmptyGalleryState() {
    return (
        <div className="text-center py-16">
            <div className="text-6xl mb-6">🎨</div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">
                NO IP ASSETS YET
            </h3>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
                You haven't minted any IP assets yet. Create your first IP asset to get started!
            </p>
            <Link
                to="/ip-mint"
                className="
          inline-block px-8 py-4 rounded-lg font-bold tracking-wide
          bg-[#8AE06C]/20 border border-[#8AE06C]/40 text-[#8AE06C]
          hover:bg-[#8AE06C]/30 hover:border-[#8AE06C]
          hover:shadow-[0_0_28px_rgba(138,224,108,1)]
          transition
        "
            >
                + CREATE YOUR FIRST IP
            </Link>
        </div>
    );
}
