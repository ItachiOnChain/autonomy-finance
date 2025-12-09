// IP Gallery Component

import { useIPGallery } from "../../hooks/useIPGallery";
import { IPGalleryCard } from "./IPGalleryCard";
import { EmptyGalleryState } from "./EmptyGalleryState";

export function IPGallery() {
    const { gallery, isLoading } = useIPGallery();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-[#8AE06C]/20 border-t-[#8AE06C] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (gallery.length === 0) {
        return <EmptyGalleryState />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((ip) => (
                <IPGalleryCard key={ip.ipId} ipAsset={ip} />
            ))}
        </div>
    );
}
