import { useState, useRef, useEffect } from "react";

export function ImageUploadModal({
  isOpen,
  onClose,
  onImageSelect,
  currentImage,
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImage || null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection (from input or drop)
  const handleFileSelect = async (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setIsLoading(true);
    try {
      const base64Url = await fileToBase64(file);
      setPreviewUrl(base64Url);
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Failed to read file");
    } finally {
      setIsLoading(false);
    }
  };

  // File input handler
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Drag handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Confirm upload
  const handleConfirm = () => {
    if (previewUrl) {
      onImageSelect(previewUrl);
      onClose();
    }
  };

  // Reset
  const handleReset = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-96 rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Upload Image</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {previewUrl ? (
            // Preview Section
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              </div>
              <p className="text-sm text-slate-600">
                Image ready to upload. Click "Confirm" to add to canvas.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  Change
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            // Upload Section
            <div className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                ref={dropZoneRef}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`rounded-lg border-2 border-dashed p-8 text-center transition ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-300 bg-slate-50"
                }`}
              >
                <svg
                  className="mx-auto mb-2 h-12 w-12 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm font-medium text-slate-700">
                  Drag and drop your image here
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  or click below to select
                </p>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Click to Select Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Select from Device"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
