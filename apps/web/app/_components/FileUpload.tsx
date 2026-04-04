'use client';

import { useState, useRef, useCallback } from 'react';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  progress: number;
}

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  onFilesSelected?: (files: File[]) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
  accept = '*',
  maxSizeMB = 25,
  onFilesSelected,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = useCallback((file: UploadedFile) => {
    const interval = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name && f.progress < 100
            ? { ...f, progress: Math.min(f.progress + 10, 100) }
            : f,
        ),
      );
    }, 200);
    setTimeout(() => clearInterval(interval), 2200);
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type || 'application/octet-stream',
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
      newFiles.forEach(simulateUpload);
      onFilesSelected?.(Array.from(fileList));
    },
    [onFilesSelected, simulateUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeFile = useCallback((name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-slate-700 bg-[#161b22] hover:border-slate-600'
        }`}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          className={`mb-3 ${dragOver ? 'text-blue-400' : 'text-slate-500'}`}
        >
          <path
            d="M20 6v18M13 13l7-7 7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 26v6a2 2 0 002 2h24a2 2 0 002-2v-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-sm font-medium text-slate-300">
          Drag and drop files here, or{' '}
          <span className="text-blue-400">browse</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Max file size: {maxSizeMB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-3 rounded-lg border border-slate-800 bg-[#161b22] p-3"
            >
              {/* File icon */}
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M4 1h7l4 4v11a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path d="M11 1v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* File info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">{file.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)} &middot; {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </p>
                  {file.progress < 100 && (
                    <span className="text-xs text-blue-400">{file.progress}%</span>
                  )}
                  {file.progress >= 100 && (
                    <span className="text-xs text-emerald-400">Complete</span>
                  )}
                </div>
                {/* Progress bar */}
                {file.progress < 100 && (
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFile(file.name)}
                className="flex-shrink-0 rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
                aria-label={`Remove ${file.name}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
