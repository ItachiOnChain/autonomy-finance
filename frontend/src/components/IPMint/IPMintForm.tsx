// IP Mint Form Component

import { useState } from "react";
import type { IPAssetFormData } from "../../types/ipAsset";
import { IPFileUpload } from "./IPFileUpload";
import { LicenseOptions } from "./LicenseOptions";
import { validateForm } from "../../utils/validation";

interface IPMintFormProps {
    formData: IPAssetFormData;
    onChange: (data: IPAssetFormData) => void;
    onSubmit: (data: IPAssetFormData) => Promise<void>;
    isSubmitting: boolean;
}

export function IPMintForm({ formData, onChange, onSubmit, isSubmitting }: IPMintFormProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: keyof IPAssetFormData, value: any) => {
        onChange({ ...formData, [field]: value });
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        const validationErrors = validateForm({
            title: formData.title,
            description: formData.description,
            royaltyPercent: formData.royaltyPercent,
            file: formData.file,
            ipType: formData.ipType
        });

        if (validationErrors.length > 0) {
            const errorMap: Record<string, string> = {};
            validationErrors.forEach(err => {
                errorMap[err.field] = err.message;
            });
            setErrors(errorMap);
            return;
        }

        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
                <label className="block text-xs tracking-wider text-white/70 mb-2">
                    IP TITLE *
                </label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className={`
            w-full p-3 rounded-lg 
            bg-black/40 border ${errors.title ? 'border-red-500' : 'border-white/20'}
            focus:border-[#8AE06C] focus:shadow-[0_0_12px_#8AE06C]
            outline-none transition text-white
          `}
                    placeholder="e.g. My Exclusive Song"
                    maxLength={100}
                    disabled={isSubmitting}
                />
                {errors.title && (
                    <p className="text-red-400 text-xs mt-1">{errors.title}</p>
                )}
                <p className="text-white/40 text-xs mt-1">{formData.title.length}/100</p>
            </div>

            {/* Description Input */}
            <div>
                <label className="block text-xs tracking-wider text-white/70 mb-2">
                    DESCRIPTION *
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className={`
            w-full p-3 rounded-lg h-32 
            bg-black/40 border ${errors.description ? 'border-red-500' : 'border-white/20'}
            focus:border-[#8AE06C] focus:shadow-[0_0_12px_#8AE06C]
            outline-none transition text-white
          `}
                    placeholder="Describe your IP asset..."
                    maxLength={5000}
                    disabled={isSubmitting}
                />
                {errors.description && (
                    <p className="text-red-400 text-xs mt-1">{errors.description}</p>
                )}
                <p className="text-white/40 text-xs mt-1">{formData.description.length}/5000</p>
            </div>

            {/* IP Type Select */}
            <div>
                <label className="block text-xs tracking-wider text-white/70 mb-2">
                    IP TYPE *
                </label>
                <select
                    value={formData.ipType}
                    onChange={(e) => handleChange('ipType', e.target.value)}
                    className="
            w-full p-3 rounded-lg 
            bg-black/40 border border-white/20
            focus:border-[#8AE06C] focus:shadow-[0_0_12px_#8AE06C]
            outline-none transition text-white
          "
                    disabled={isSubmitting}
                >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="document">Document</option>
                    <option value="other">Other</option>
                </select>
            </div>

            {/* File Upload */}
            <IPFileUpload
                file={formData.file}
                onChange={(file: File | null) => handleChange('file', file)}
                error={errors.file}
                disabled={isSubmitting}
            />

            {/* License Options */}
            <LicenseOptions
                royaltyPercent={formData.royaltyPercent}
                enableCommercialLicense={formData.enableCommercialLicense}
                onRoyaltyChange={(value) => handleChange('royaltyPercent', value)}
                onLicenseToggle={(value) => handleChange('enableCommercialLicense', value)}
                disabled={isSubmitting}
            />

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="
          w-full py-4 rounded-lg font-bold tracking-wide 
          bg-[#8AE06C]/20 border border-[#8AE06C]/40 text-[#8AE06C]
          hover:bg-[#8AE06C]/30 hover:border-[#8AE06C] 
          hover:shadow-[0_0_22px_rgba(138,224,108,0.8)]
          transition disabled:opacity-50 disabled:cursor-not-allowed
        "
            >
                {isSubmitting ? "Minting..." : "Mint IP Asset"}
            </button>
        </form>
    );
}
