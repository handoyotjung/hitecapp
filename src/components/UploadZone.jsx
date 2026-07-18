import React, { useRef, useState } from 'react';
import { FolderOpen, Image as ImageIcon, Camera, Loader2 } from 'lucide-react';
import { compressImage } from '../imageCompressor';

export default function UploadZone({ onFilesSelected, onUploadFolder, onSelectPhotos, photosUsed = 0, photosLimit = 100, isMobileMode = false, isCompressing = false }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Recursive folder traversal for Drag and Drop
  const traverseFileTree = async (item) => {
    if (item.isFile) {
      return new Promise((resolve) => {
        item.file((file) => resolve([file]));
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      let entries = [];
      const readEntries = () => {
        return new Promise((resolveReader) => {
          dirReader.readEntries((result) => {
            if (!result.length) {
              resolveReader();
            } else {
              entries = entries.concat(result);
              readEntries().then(resolveReader);
            }
          }, () => resolveReader());
        });
      };
      await readEntries();
      const results = await Promise.all(entries.map(entry => traverseFileTree(entry)));
      return results.flat();
    }
    return [];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragActive(false);

    const items = e.dataTransfer.items;
    if (!items) return;

    const filePromises = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) {
        filePromises.push(traverseFileTree(item));
      }
    }

    const allFiles = (await Promise.all(filePromises)).flat();
    filterAndQueueFiles(allFiles);
  };

  const handleFolderSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      filterAndQueueFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      filterAndQueueFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleCameraSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      filterAndQueueFiles(Array.from(e.target.files));
      // Reset input immediately so the field inspector can sequentially snap more photos
      e.target.value = '';
    }
  };

  const filterAndQueueFiles = async (files) => {
    // Only accept JPEG, PNG, GIF
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      const isAllowedExt = ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
      const isAllowedMime = allowedTypes.includes(file.type);
      return isAllowedExt || isAllowedMime;
    });

    if (validFiles.length > 0) {
      const targetKb = 295;
      const needsCompression = validFiles.some(f => f && f.type && f.type.startsWith('image/') && (f.size / 1024) > targetKb);

      let processed = validFiles;
      if (needsCompression) {
        processed = await Promise.all(
          validFiles.map(async (file) => {
            if (file && file.type && file.type.startsWith('image/') && (file.size / 1024) > targetKb) {
              try {
                return await compressImage(file, targetKb);
              } catch (err) {
                console.warn("UploadZone client compression fallback:", err);
                return file;
              }
            }
            return file;
          })
        );
      }

      onFilesSelected(processed);
    }
  };

  const isAtLimit = photosUsed >= photosLimit;
  const handleUploadFolderClick = () => onUploadFolder ? onUploadFolder() : folderInputRef.current?.click();
  const handleSelectPhotosClick = () => {
    if (onSelectPhotos) {
      onSelectPhotos();
    } else if (isMobileMode && cameraInputRef.current) {
      cameraInputRef.current.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-shrink-0 w-full p-3 border-b border-[#2B2B2B] bg-[#0F172A] transition-colors ${
        isDragActive ? 'bg-indigo-500/10' : ''
      }`}
    >
      {/* Invisible inputs */}
      <input
        type="file"
        ref={folderInputRef}
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={handleFolderSelect}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraSelect}
      />

      <div className="flex gap-2 w-full">
        <button
          type="button"
          onClick={handleUploadFolderClick}
          disabled={isAtLimit || isCompressing}
          className="flex-1 min-w-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2B2B2B] hover:bg-[#3B3B3B] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
        >
          <FolderOpen className="w-4 h-4 flex-shrink-0 text-slate-300" />
          <span className="truncate">Select Folder</span>
        </button>

        <button
          type="button"
          onClick={handleSelectPhotosClick}
          disabled={isAtLimit || isCompressing}
          className="flex-1 min-w-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2B2B2B] hover:bg-[#3B3B3B] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
        >
          <Camera className="w-4 h-4 flex-shrink-0 text-slate-300" />
          <span className="truncate">Use Camera</span>
        </button>
      </div>

      {isCompressing && (
        <div className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-emerald-400" />
          <span>Compressing photos to &lt; 300KB...</span>
        </div>
      )}

      {isAtLimit && (
        <p className="text-xs text-red-400 mt-2 text-center">Daily limit reached: {photosLimit}/100</p>
      )}
    </div>
  );
}
