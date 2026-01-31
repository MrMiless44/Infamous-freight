"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type DocType =
  | "cdl"
  | "insurance"
  | "w9"
  | "authority"
  | "vehicle_reg"
  | "pod"
  | "bol"
  | "other";

export default function DocumentUpload({
  docType,
  loadId,
  assignmentId,
}: {
  docType: DocType;
  loadId?: string;
  assignmentId?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function upload() {
    setMsg(null);
    if (!file) return setMsg("Choose a file first.");

    setBusy(true);
    const supabase = supabaseBrowser();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setBusy(false);
      return setMsg("Not signed in.");
    }

    const bucket = "documents";
    // Sanitize filename: remove path separators, allow only alphanumerics and hyphens in the base,
    // and keep at most a single, alphanumeric-only extension.
    const originalName = file.name.replace(/[/\\]+/g, "_");
    const lastDotIndex = originalName.lastIndexOf(".");
    const rawBase =
      lastDotIndex > 0 ? originalName.slice(0, lastDotIndex) : originalName;
    const rawExt =
      lastDotIndex > 0 && lastDotIndex < originalName.length - 1
        ? originalName.slice(lastDotIndex + 1)
        : "";
    const sanitizedBase = rawBase
      .replace(/[^a-zA-Z0-9-]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const sanitizedExt = rawExt.replace(/[^a-zA-Z0-9]+/g, "");
    const safeName =
      (sanitizedBase || "file") + (sanitizedExt ? `.${sanitizedExt}` : "");
    const objectPath = `${u.user.id}/${docType}/${Date.now()}_${safeName}`;

    const { error: upErr } = await supabase.storage.from(bucket).upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

    if (upErr) {
      setBusy(false);
      return setMsg(upErr.message);
    }

    const { error: dbErr } = await supabase.from("documents").insert({
      owner_id: u.user.id,
      doc_type: docType,
      bucket,
      object_path: objectPath,
      mime_type: file.type || null,
      size_bytes: file.size,
      load_id: loadId ?? null,
      assignment_id: assignmentId ?? null,
    });

    setBusy(false);
    if (dbErr) return setMsg(dbErr.message);

    setFile(null);
    setMsg("Uploaded ✅");
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="font-semibold">Upload: {docType.toUpperCase()}</div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm"
      />
      <button
        onClick={upload}
        disabled={busy}
        className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {busy ? "Uploading..." : "Upload"}
      </button>
      {msg && <p className="text-sm text-gray-700">{msg}</p>}
      <p className="text-xs text-gray-600">
        Files stored at <span className="font-mono">documents/{`{user_id}`}/...</span> per RLS
        policy.
      </p>
    </div>
  );
}
