import { id as instantId, tx } from "@instantdb/react";
import { useRef, useState } from "react";

import { createWorkspaceFilePath } from "@quack/data";
import { InputField, Notice } from "../../../components/ui/FormFields";
import { instantDB } from "../../../lib/instant";
import { toErrorMessage } from "../../../lib/ui";
import type { AuthenticatedUser, WorkspaceMemberRecord } from "../../../types/quack";
import { updateWorkspaceMemberTx } from "@quack/data";
import { CameraGlyph } from "./SettingsAtoms";

interface ProfileSettingsProps {
  currentUserMember: WorkspaceMemberRecord | undefined;
  user: AuthenticatedUser;
  workspaceId: string;
}

export function ProfileSettings(props: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(props.currentUserMember?.displayName ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const avatarQuery = instantDB.useQuery({
    $users: { $: { where: { id: props.user.id } }, avatar: {} },
  });
  const avatarUrl = avatarQuery.data?.$users[0]?.avatar?.url ?? props.user.imageURL ?? null;

  if (import.meta.env.DEV) {
    const u = avatarQuery.data?.$users[0];
    console.log("[ProfileSettings] avatar debug:", {
      userId: props.user.id,
      "props.user.imageURL": props.user.imageURL,
      "avatarQuery user keys": u ? Object.keys(u) : [],
      "avatar link": u?.avatar,
      avatarUrl,
    });
  }

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayedImage = imagePreview ?? avatarUrl;

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

    try {
      const txs: Parameters<typeof instantDB.transact>[0] = [];

      if (
        props.currentUserMember &&
        displayName.trim() !== (props.currentUserMember.displayName ?? "")
      ) {
        txs.push(
          updateWorkspaceMemberTx(props.currentUserMember.id, {
            displayName: displayName.trim(),
          }),
        );
      }

      if (imageFile) {
        const fileId = instantId();
        const path = createWorkspaceFilePath(props.workspaceId, fileId, imageFile.name);
        const { data: uploadData } = await instantDB.storage.uploadFile(path, imageFile, {
          contentType: imageFile.type,
        });
        txs.push(tx.$users[props.user.id].link({ avatar: uploadData.id }));
        setImageFile(null);
      }

      if (txs.length > 0) {
        await instantDB.transact(txs);
      }

      setSuccessMsg("Profile updated.");
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not update your profile."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const initial = (displayName || props.user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl">
      <h3 className="text-base font-semibold text-slate-900">Your profile</h3>
      <p className="mt-1 text-sm text-slate-500">
        This is how you appear to others in this workspace.
      </p>

      <div className="mt-6 grid grid-cols-[auto_1fr] items-start gap-x-8 gap-y-5">
        <div className="flex flex-col items-center gap-2">
          <button
            className="group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-100 to-amber-200/80 shadow-sm transition-opacity duration-100 hover:opacity-90"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {displayedImage ? (
              <img alt="Profile" className="size-full object-cover" src={displayedImage} />
            ) : (
              <span className="text-xl font-bold text-amber-600">{initial}</span>
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
            label="Display name"
            onChange={setDisplayName}
            placeholder="Your name"
            value={displayName}
          />
          <div>
            <span className="text-sm font-medium text-slate-600">Email</span>
            <p className="mt-1.5 text-sm text-slate-500">{props.user.email ?? "No email"}</p>
          </div>
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
