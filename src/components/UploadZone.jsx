import React, { useRef, useState } from 'react';
import { FolderOpen, Image as ImageIcon } from 'lucide-react';

export default function UploadZone({ onFilesSelected, onUploadFolder, onSelectPhotos, photosUsed = 0, photosLimit = 100 }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);

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
    if (e.target.files) {
      filterAndQueueFiles(Array.from(e.target.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      filterAndQueueFiles(Array.from(e.target.files));
    }
  };

  const filterAndQueueFiles = (files) => {
    // Only accept JPEG, PNG, GIF
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      const isAllowedExt = ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
      const isAllowedMime = allowedTypes.includes(file.type);
      return isAllowedExt || isAllowedMime;
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const isAtLimit = photosUsed >= photosLimit;
  const handleUploadFolderClick = () => onUploadFolder ? onUploadFolder() : folderInputRef.current?.click();
  const handleSelectPhotosClick = () => onSelectPhotos ? onSelectPhotos() : fileInputRef.current?.click();

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

      <div className="flex gap-2 w-full">
        <button
          type="button"
          onClick={handleUploadFolderClick}
          disabled={isAtLimit}
          className="flex-1 min-w-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2B2B2B] hover:bg-[#3B3B3B] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
        >
          <FolderOpen className="w-4 h-4 flex-shrink-0 text-slate-300" />
          <span className="truncate">Upload Folder</span>
        </button>

        <button
          type="button"
          onClick={handleSelectPhotosClick}
          disabled={isAtLimit}
          className="flex-1 min-w-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2B2B2B] hover:bg-[#3B3B3B] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
        >
          <ImageIcon className="w-4 h-4 flex-shrink-0 text-slate-300" />
          <span className="truncate">Select Photos</span>
        </button>
      </div>

      {isAtLimit && (
        <p className="text-xs text-red-400 mt-2 text-center">Daily limit reached: {photosLimit}/100</p>
      )}
    </div>
  );
}
