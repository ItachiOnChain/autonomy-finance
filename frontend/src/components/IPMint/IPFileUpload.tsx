// File Upload Component with Drag and Drop and Preview
// FIX: Removed accidental markdown code fences that caused 500 error

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { MAX_FILE_SIZE } from "../../constants/pinata";

interface IPFileUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

export function IPFileUpload({ file, onChange, error, disabled }: IPFileUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create preview URL when file changes
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Cleanup function to revoke URL when component unmounts or file changes
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onChange(acceptedFiles[0]);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    disabled
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const renderPreview = () => {
    if (!file || !previewUrl) return null;

    const fileType = file.type;

    // Image preview
    if (fileType.startsWith('image/')) {
      return (
        <div className="mt-4 relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-48 mx-auto rounded-lg border border-white/20"
          />
        </div>
      );
    }

    // Video preview
    if (fileType.startsWith('video/')) {
      return (
        <div className="mt-4">
          <video
            src={previewUrl}
            controls
            className="max-h-48 mx-auto rounded-lg border border-white/20"
          >
            Your browser does not support video preview.
          </video>
        </div>
      );
    }

    // Audio preview
    if (fileType.startsWith('audio/')) {
      return (
        <div className="mt-4">
          <audio
            src={previewUrl}
            controls
            className="w-full"
          >
            Your browser does not support audio preview.
          </audio>
        </div>
      );
    }

    // Other files - show icon and metadata
    return (
      <div className="mt-4 p-4 bg-black/20 rounded-lg border border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-4xl">📄</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{file.name}</p>
            <p className="text-xs text-white/50">{file.type || 'Unknown type'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <label className="block text-xs tracking-wider text-white/70 mb-2">
        FILE UPLOAD *
      </label>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition
          ${isDragActive ? 'border-[#8AE06C] bg-[#8AE06C]/10' : error ? 'border-red-500 bg-red-500/5' : 'border-white/20 bg-black/20'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#8AE06C] hover:bg-[#8AE06C]/5'}
        `}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="space-y-2">
            <p className="text-[#8AE06C] font-bold">{file.name}</p>
            <p className="text-white/60 text-sm">{formatFileSize(file.size)}</p>
            <button
              onClick={handleRemoveFile}
              className="mt-2 px-4 py-2 text-xs bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg hover:bg-red-500/30 transition"
            >
              Remove File
            </button>
            <p className="text-white/40 text-xs">or drag another file to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-white/70">
              {isDragActive ? "Drop file here..." : "Drag and drop file here, or click to browse"}
            </p>
            <p className="text-white/40 text-xs">
              Max size: {MAX_FILE_SIZE / (1024 * 1024)}MB
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      {renderPreview()}

      {error && (
        <p className="text-red-400 text-xs mt-2">{error}</p>
      )}
    </div>
  );
}
