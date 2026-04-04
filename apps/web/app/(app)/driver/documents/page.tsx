'use client';

import { useState } from 'react';
import Link from 'next/link';
import FileUpload from '../../../_components/FileUpload';
import { documents } from '../../../_data/mock-data';

const docTypes = [
  { id: 'bol', label: 'Bill of Lading (BOL)' },
  { id: 'pod', label: 'Proof of Delivery (POD)' },
  { id: 'other', label: 'Other' },
];

const recentDocs = documents.filter((d) => d.type === 'bol' || d.type === 'pod').slice(0, 5);

export default function DriverDocumentsPage() {
  const [selectedType, setSelectedType] = useState('bol');

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-8">
      <h1 className="text-xl font-bold text-white">Upload Documents</h1>

      {/* Document Type Selector */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Document Type</h2>
        <div className="flex gap-2">
          {docTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                selectedType === type.id
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-700 bg-[#0d1117] text-slate-400 hover:text-slate-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Upload File</h2>
        <FileUpload accept="image/*,.pdf" maxSizeMB={10} />
      </div>

      {/* Camera Capture (mobile) */}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#161b22] px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        Capture with Camera
      </button>

      {/* Recent Uploads */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Recent Uploads</h2>
        {recentDocs.length === 0 ? (
          <p className="text-xs text-slate-500">No recent uploads.</p>
        ) : (
          <div className="space-y-2">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border border-slate-800 bg-[#0d1117] p-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M4 1h7l4 4v11a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M11 1v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">{doc.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {doc.type.toUpperCase()} &middot; {doc.fileSize} &middot; {doc.uploadedAt}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    doc.status === 'valid'
                      ? 'bg-emerald-400/10 text-emerald-400'
                      : doc.status === 'pending_review'
                        ? 'bg-yellow-400/10 text-yellow-400'
                        : 'bg-red-400/10 text-red-400'
                  }`}
                >
                  {doc.status === 'valid' ? 'Valid' : doc.status === 'pending_review' ? 'Pending' : 'Expired'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
