// Custom hook for IPFS operations

import { useState, useCallback } from 'react';
import { uploadFileToIPFS, uploadMetadataToIPFS } from '../utils/ipfs';

export function useIPFS() {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const uploadFile = useCallback(async (file: File): Promise<string> => {
        setIsUploading(true);
        setUploadProgress('Uploading file to IPFS...');
        setError(null);

        try {
            const uri = await uploadFileToIPFS(file);
            setUploadProgress('File uploaded successfully');
            return uri;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to upload file';
            setError(message);
            throw err;
        } finally {
            setIsUploading(false);
        }
    }, []);

    const uploadMetadata = useCallback(async (metadata: object): Promise<string> => {
        setIsUploading(true);
        setUploadProgress('Uploading metadata to IPFS...');
        setError(null);

        try {
            const uri = await uploadMetadataToIPFS(metadata);
            setUploadProgress('Metadata uploaded successfully');
            return uri;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to upload metadata';
            setError(message);
            throw err;
        } finally {
            setIsUploading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setIsUploading(false);
        setUploadProgress('');
        setError(null);
    }, []);

    return {
        uploadFile,
        uploadMetadata,
        isUploading,
        uploadProgress,
        error,
        reset
    };
}
