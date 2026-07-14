import React, { useRef, useState } from 'react';
import { FolderOpen, Image as ImageIcon } from 'lucide-react';

export default function UploadZone({ onFilesSelected }) {
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 min-h-[220px] max-h-[300px] flex-1 ${
        isDragActive
          ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
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

      <div className="flex flex-col items-center gap-2">
        <div>
          <h3 className="text-base font-bold text-white leading-snug">
            Drag & Drop Photos
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-[280px] mx-auto">
            Drop folders from your computer, or choose files from your gallery.
          </p>
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {/* Folder Upload (Desktop) */}
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Upload Folder
          </button>
          
          {/* File Upload (Desktop/Mobile) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Select Photos
          </button>
        </div>
      </div>
    </div>
  );
}
