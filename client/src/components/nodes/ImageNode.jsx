import { useState, useEffect } from "react";
import { NodeResizer } from "reactflow";
import { useWorkspaceStore } from "../../store/workspaceStore.js";
import { ImageUploadModal } from "../ImageUploadModal.jsx";

/**
 * A custom ReactFlow node that displays an image.
 * Supports dropping in a new image and dynamically resizing based on the image's aspect ratio.
 */
export function ImageNode({ data, id, selected }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deleteNode = useWorkspaceStore((state) => state.deleteNode);
  const updateNodeDimensions = useWorkspaceStore((state) => state.updateNodeDimensions);

  const handleImageSelect = (imageUrl) => {
    data.onImageChange?.(imageUrl, data.imageKey);
  };

  const handleDelete = () => {
    if (window.confirm("Delete this node?")) {
      deleteNode(id);
    }
  };

  useEffect(() => {
    if (!data.imageUrl) return;

    const img = new Image();
    img.src = data.imageUrl;
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight;
      if (isNaN(aspect) || aspect <= 0) return;

      // Choose an optimal scaling width (e.g. 360px) that keeps high resolution sharp
      const targetWidth = Math.min(Math.max(img.naturalWidth, 240), 420);
      const targetHeight = Math.round(targetWidth / aspect);

      updateNodeDimensions?.(id, targetWidth, targetHeight);
    };
  }, [data.imageUrl, id, updateNodeDimensions]);

  return (
    <>
      <NodeResizer
        minWidth={0}
        minHeight={0}
        isVisible={selected}
        lineClassName="!border-amber-500 !border-2 !rounded-[20px]"
        handleClassName="!w-4 !h-4 !bg-white !border-2 !border-amber-500 !rounded-full !shadow-md hover:!scale-115 active:!scale-95 transition-transform duration-100"
      />
      <div
        className={`relative w-full h-full group rounded-[20px] overflow-hidden border bg-white shadow-[0_14px_32px_rgba(19,32,51,0.08)] flex flex-col transition-all duration-200 ${
          selected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        {data.imageUrl ? (
          <div
            className="relative w-full h-full overflow-hidden rounded-[20px]"
          >
            <img
              className="w-full h-full object-cover"
              src={data.imageUrl}
              alt={data.label}
            />
            {/* Hover overlay with controls */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 px-3.5 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition"
                  title="Change image"
                >
                  Change
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(e);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  title="Delete node"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsModalOpen(true)}
            className="w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 px-4 text-center text-slate-500 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition bg-gradient-to-b from-slate-50/50 to-slate-50/20"
          >
            <div>
              <svg
                className="mx-auto h-12 w-12 text-slate-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-semibold text-sm">Click to upload</p>
              <p className="text-xs mt-1">or drag and drop</p>
            </div>
          </div>
        )}
      </div>

      <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImageSelect={handleImageSelect}
        currentImage={data.imageUrl}
      />
    </>
  );
}
