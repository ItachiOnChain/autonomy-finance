// Custom hook for IP gallery management with localStorage persistence

import { useState, useEffect, useCallback } from 'react';
import type { IPAsset } from '../types/ipAsset';

const STORAGE_KEY = 'autonomy_ip_gallery';

export function useIPGallery() {
    const [gallery, setGallery] = useState<IPAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load gallery from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Convert tokenId and licenseTermsIds back to BigInt
                const gallery = parsed.map((item: any) => ({
                    ...item,
                    tokenId: BigInt(item.tokenId),
                    licenseTermsIds: item.licenseTermsIds?.map((id: string) => BigInt(id))
                }));
                setGallery(gallery);
            }
        } catch (error) {
            console.error('[Gallery] Error loading from localStorage:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save gallery to localStorage whenever it changes
    useEffect(() => {
        if (!isLoading) {
            try {
                // Convert BigInt to string for JSON serialization
                const serializable = gallery.map(item => ({
                    ...item,
                    tokenId: item.tokenId.toString(),
                    licenseTermsIds: item.licenseTermsIds?.map(id => id.toString())
                }));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
            } catch (error) {
                console.error('[Gallery] Error saving to localStorage:', error);
            }
        }
    }, [gallery, isLoading]);

    // Add new IP to gallery (at the beginning for most recent first)
    const addIP = useCallback((newIP: IPAsset) => {
        setGallery(prev => [newIP, ...prev]);
    }, []);

    // Remove IP from gallery
    const removeIP = useCallback((ipId: string) => {
        setGallery(prev => prev.filter(ip => ip.ipId !== ipId));
    }, []);

    // Clear entire gallery
    const clearGallery = useCallback(() => {
        setGallery([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    // Get IP by ID
    const getIP = useCallback((ipId: string): IPAsset | undefined => {
        return gallery.find(ip => ip.ipId === ipId);
    }, [gallery]);

    return {
        gallery,
        isLoading,
        addIP,
        removeIP,
        clearGallery,
        getIP
    };
}
