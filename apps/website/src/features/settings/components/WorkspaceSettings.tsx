import { id as instantId } from "@instantdb/react";
import { useRef, useState } from "react";

import { createWorkspaceFilePath, updateWorkspaceTx } from "@quack/data";
import { InputField, Notice } from "../../../components/ui/FormFields";
import { instantDB } from "../../../lib/instant";
import { toErrorMessage } from "../../../lib/ui";
import type { WorkspaceSummary } from "../../../types/quack";
import { CameraGlyph } from "./SettingsAtoms";

interface WorkspaceSettingsProps {
  workspace: WorkspaceSummary;
}

export function WorkspaceSettings(props: WorkspaceSettingsProps) {
  const [name, setName] = useState(props.workspace.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentImageUrl = props.workspace.imageUrl ?? null;
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setNotice("Image must be under 5 MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setNotice("Please select an image file.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setNotice(null);
  }

  async function handleSave() {
    setIsSubmitting(true);
    setNotice(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNotice("Workspace name is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const patch: { imageUrl?: string; name?: string } = {};

      if (trimmedName !== props.workspace.name) {
        patch.name = trimmedName;
      }

      if (imageFile) {
        const fileId = instantId();
        const path = createWorkspaceFilePath(props.workspace.id, fileId, imageFile.name);
        await instantDB.storage.uploadFile(path, imageFile, {
          contentType: imageFile.type,
        });
        const result = await instantDB.queryOnce({ $files: { $: { where: { path } } } });
        const fileUrl = result.data.$files[0]?.url;
        if (fileUrl) {
          patch.imageUrl = fileUrl;
        }
        setImageFile(null);
      }

      if (Object.keys(patch).length > 0) {
        await instantDB.transact(updateWorkspaceTx(props.workspace.id, patch));
      }

      setSuccessMsg("Workspace updated.");
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not update workspace settings."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const initial = (name || "W").trim().charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl">
      <h3 className="text-base font-semibold text-slate-900">Workspace</h3>
      <p className="mt-1 text-sm text-slate-500">General settings for this workspace.</p>

      <div className="mt-6 grid grid-cols-[auto_1fr] items-start gap-x-8 gap-y-5">
        <div className="flex flex-col items-center gap-2">
          <button
            className="group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm transition-opacity duration-100 hover:opacity-90"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {imagePreview ? (
              <img alt="Workspace" className="size-full object-cover" src={imagePreview} />
            ) : (
              <span className="text-xl font-bold text-white">{initial}</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors duration-100 group-hover:bg-slate-900/30">
              <CameraGlyph className="text-white opacity-0 transition-opacity duration-100 group-hover:opacity-100" />
            </div>
          </button>
          <p className="text-xs text-slate-400">Max 5 MB</p>
          <input
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
            ref={fileInputRef}
            type="file"
          />
        </div>

        <div className="space-y-4">
          <InputField
            label="Workspace name"
            onChange={setName}
            placeholder="My workspace"
            value={name}
          />
        </div>
      </div>

      {notice ? (
        <div className="mt-4">
          <Notice message={notice} tone="error" />
        </div>
      ) : null}
      {successMsg ? (
        <div className="mt-4">
          <Notice message={successMsg} tone="info" />
        </div>
      ) : null}

      <div className="mt-6">
        <button
          className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          onClick={() => {
            void handleSave();
          }}
          type="button"
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
