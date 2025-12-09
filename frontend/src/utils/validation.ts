// Form validation utilities

import { MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from "../constants/pinata";

export interface ValidationError {
    field: string;
    message: string;
}

/**
 * Validate IP title
 * @param title - Title to validate
 * @returns Error message or null if valid
 */
export function validateTitle(title: string): string | null {
    if (!title || title.trim().length === 0) {
        return "Title is required";
    }
    if (title.length > 100) {
        return "Title must be 100 characters or less";
    }
    return null;
}

/**
 * Validate IP description
 * @param description - Description to validate
 * @returns Error message or null if valid
 */
export function validateDescription(description: string): string | null {
    if (!description || description.trim().length === 0) {
        return "Description is required";
    }
    if (description.length > 5000) {
        return "Description must be 5000 characters or less";
    }
    return null;
}

/**
 * Validate royalty percentage
 * @param royaltyPercent - Royalty percentage (0-100)
 * @returns Error message or null if valid
 */
export function validateRoyalty(royaltyPercent: number): string | null {
    if (royaltyPercent < 0 || royaltyPercent > 100) {
        return "Royalty must be between 0% and 100%";
    }
    return null;
}

/**
 * Validate file upload
 * @param file - File to validate
 * @param ipType - Type of IP asset
 * @returns Error message or null if valid
 */
export function validateFile(file: File | null, ipType: string): string | null {
    if (!file) {
        return "File is required";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
        return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check file type
    const supportedTypes = SUPPORTED_FILE_TYPES[ipType as keyof typeof SUPPORTED_FILE_TYPES];
    if (supportedTypes) {
        const isSupported = (supportedTypes as readonly string[]).includes(file.type);
        if (!isSupported) {
            return `File type ${file.type} is not supported for ${ipType}`;
        }
    }

    return null;
}

/**
 * Validate entire form
 * @param formData - Form data to validate
 * @returns Array of validation errors
 */
export function validateForm(formData: {
    title: string;
    description: string;
    royaltyPercent: number;
    file: File | null;
    ipType: string;
}): ValidationError[] {
    const errors: ValidationError[] = [];

    const titleError = validateTitle(formData.title);
    if (titleError) errors.push({ field: 'title', message: titleError });

    const descError = validateDescription(formData.description);
    if (descError) errors.push({ field: 'description', message: descError });

    const royaltyError = validateRoyalty(formData.royaltyPercent);
    if (royaltyError) errors.push({ field: 'royaltyPercent', message: royaltyError });

    const fileError = validateFile(formData.file, formData.ipType);
    if (fileError) errors.push({ field: 'file', message: fileError });

    return errors;
}
