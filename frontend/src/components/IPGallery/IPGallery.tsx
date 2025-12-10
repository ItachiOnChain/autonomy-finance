// IP Gallery Component

import { useIPGallery } from "../../hooks/useIPGallery";
import { IPGalleryCard } from "./IPGalleryCard";
import { EmptyGalleryState } from "./EmptyGalleryState";

export function IPGallery() {
    const { gallery, isLoading } = useIPGallery();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="w-10 h-10 border-4 border-[#8AE06C]/20 border-t-[#8AE06C] rounded-full animate-spin" />
            </div>
        );
    }

    if (gallery.length === 0) {
        return <EmptyGalleryState />;
    }

    return (
        <div
            className="
                grid 
                grid-cols-1 
                sm:grid-cols-2 
                lg:grid-cols-3 
                xl:grid-cols-4 
                gap-4 sm:gap-6 
                p-2 sm:p-0
            "
        >
            {gallery.map((ip) => (
                <IPGalleryCard key={ip.ipId} ipAsset={ip} />
            ))}
        </div>
    );
}
