import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { id as instantId, tx } from "@instantdb/react";

import {
  channelDraftsByUserQuery,
  createChannelDraftKey,
  createWorkspaceFilePath,
  deleteChannelDraftByKeyTx,
} from "@quack/data";

import { instantDB } from "../lib/instant";
import type { StagedFile, UploadedFile } from "./useFileUpload";

const DEBOUNCE_MS = 800;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 10;

interface UseChannelDraftsProps {
  userId: string;
  workspaceId: string;
}

interface DraftAttachment {
  $file?: {
    id: string;
    path?: string;
    url?: string;
  };
  id: string;
}

interface DraftRecord {
  attachments?: DraftAttachment[];
  body?: string;
  channel?: { id: string };
  id: string;
}

function resolveAttachmentType(contentType: string): "image" | "video" | "file" {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return "file";
}

function createPreviewUrl(file: File): string | null {
  if (file.type.startsWith("image/")) {
    return URL.createObjectURL(file);
  }
  return null;
}

export interface ChannelDraftState {
  body: string;
  stagedFiles: StagedFile[];
}

export interface UseChannelDraftsResult {
  addFiles: (channelId: string, files: FileList | File[]) => void;
  clearDraft: (channelId: string) => void;
  channelIdsWithDrafts: Set<string>;
  getDraft: (channelId: string) => string;
  getStagedFiles: (channelId: string) => StagedFile[];
  hasFiles: (channelId: string) => boolean;
  removeFile: (channelId: string, fileId: string) => void;
  setDraft: (channelId: string, body: string) => void;
  updateWorkspaceId: (workspaceId: string) => void;
  uploadAllFiles: (channelId: string) => Promise<UploadedFile[]>;
}

export function useChannelDrafts(props: UseChannelDraftsProps): UseChannelDraftsResult {
  const draftsState = instantDB.useQuery(channelDraftsByUserQuery(props.userId));
  const remoteDrafts = (draftsState.data?.channelDrafts ?? []) as DraftRecord[];

  const [localDrafts, setLocalDrafts] = useState<Map<string, string>>(new Map());
  const [stagedFilesMap, setStagedFilesMap] = useState<Map<string, StagedFile[]>>(new Map());

  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingSaves = useRef<Set<string>>(new Set());
  const workspaceIdRef = useRef(props.workspaceId);
  workspaceIdRef.current = props.workspaceId;

  const remoteDraftsByChannelId = useMemo(() => {
    const map = new Map<string, DraftRecord>();
    for (const draft of remoteDrafts) {
      if (draft.channel?.id) {
        map.set(draft.channel.id, draft);
      }
    }
    return map;
  }, [remoteDrafts]);

  useEffect(() => {
    return () => {
      for (const timer of debounceTimers.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const pendingDraftIds = useRef<Map<string, string>>(new Map());

  const saveDraftToRemote = useCallback(
    function saveDraftToRemote(channelId: string, body: string) {
      const trimmed = body.trim();
      const existing = remoteDraftsByChannelId.get(channelId);

      if (!trimmed && !existing && !pendingDraftIds.current.has(channelId)) {
        return;
      }

      if (!trimmed) {
        pendingDraftIds.current.delete(channelId);
        if (existing) {
          void instantDB.transact(deleteChannelDraftByKeyTx(channelId, props.userId));
        }
        return;
      }

      const draftKey = createChannelDraftKey(channelId, props.userId);
      let draftId = existing?.id ?? pendingDraftIds.current.get(channelId);
      if (!draftId) {
        draftId = instantId();
        pendingDraftIds.current.set(channelId, draftId);
      }

      void instantDB.transact(
        tx.channelDrafts[draftId]
          .update({
            body: trimmed,
            draftKey,
            updatedAt: new Date().toISOString(),
          })
          .link({
            $user: props.userId,
            channel: channelId,
          }),
      );
    },
    [props.userId, remoteDraftsByChannelId],
  );

  const setDraft = useCallback(
    function setDraft(channelId: string, body: string) {
      setLocalDrafts((prev) => {
        const next = new Map(prev);
        next.set(channelId, body);
        return next;
      });

      pendingSaves.current.add(channelId);

      const existingTimer = debounceTimers.current.get(channelId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      debounceTimers.current.set(
        channelId,
        setTimeout(() => {
          debounceTimers.current.delete(channelId);
          pendingSaves.current.delete(channelId);
          saveDraftToRemote(channelId, body);
        }, DEBOUNCE_MS),
      );
    },
    [saveDraftToRemote],
  );

  const getDraft = useCallback(
    function getDraft(channelId: string): string {
      if (localDrafts.has(channelId)) {
        return localDrafts.get(channelId)!;
      }
      const remote = remoteDraftsByChannelId.get(channelId);
      return remote?.body ?? "";
    },
    [localDrafts, remoteDraftsByChannelId],
  );

  const clearDraft = useCallback(
    function clearDraft(channelId: string) {
      const existingTimer = debounceTimers.current.get(channelId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        debounceTimers.current.delete(channelId);
      }
      pendingSaves.current.delete(channelId);
      pendingDraftIds.current.delete(channelId);

      setLocalDrafts((prev) => {
        const next = new Map(prev);
        next.delete(channelId);
        return next;
      });

      setStagedFilesMap((prev) => {
        const files = prev.get(channelId);
        if (files) {
          for (const f of files) {
            if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
          }
        }
        const next = new Map(prev);
        next.delete(channelId);
        return next;
      });

      const existing = remoteDraftsByChannelId.get(channelId);
      if (existing) {
        void instantDB.transact(deleteChannelDraftByKeyTx(channelId, props.userId));
      }
    },
    [props.userId, remoteDraftsByChannelId],
  );

  const channelIdsWithDrafts = useMemo(() => {
    const ids = new Set<string>();

    for (const [channelId, body] of localDrafts) {
      if (body.trim()) {
        ids.add(channelId);
      }
    }

    for (const draft of remoteDrafts) {
      if (draft.channel?.id && draft.body?.trim()) {
        if (!localDrafts.has(draft.channel.id)) {
          ids.add(draft.channel.id);
        }
      }
    }

    for (const [channelId, files] of stagedFilesMap) {
      if (files.length > 0) {
        ids.add(channelId);
      }
    }

    return ids;
  }, [localDrafts, remoteDrafts, stagedFilesMap]);

  const addFiles = useCallback(function addFiles(channelId: string, files: FileList | File[]) {
    const incoming = Array.from(files);

    setStagedFilesMap((prev) => {
      const existing = prev.get(channelId) ?? [];
      const remaining = MAX_FILES - existing.length;
      if (remaining <= 0) return prev;

      const toAdd = incoming.slice(0, remaining);
      const newStaged: StagedFile[] = toAdd
        .filter((file) => file.size <= MAX_FILE_SIZE)
        .map((file) => ({
          attachmentType: resolveAttachmentType(file.type),
          contentType: file.type || "application/octet-stream",
          file,
          id: instantId(),
          name: file.name,
          previewUrl: createPreviewUrl(file),
          sizeBytes: file.size,
          status: "pending" as const,
        }));

      const next = new Map(prev);
      next.set(channelId, [...existing, ...newStaged]);
      return next;
    });
  }, []);

  const removeFile = useCallback(function removeFile(channelId: string, fileId: string) {
    setStagedFilesMap((prev) => {
      const existing = prev.get(channelId);
      if (!existing) return prev;

      const removed = existing.find((f) => f.id === fileId);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      const next = new Map(prev);
      const filtered = existing.filter((f) => f.id !== fileId);
      if (filtered.length === 0) {
        next.delete(channelId);
      } else {
        next.set(channelId, filtered);
      }
      return next;
    });
  }, []);

  const getStagedFiles = useCallback(
    function getStagedFiles(channelId: string): StagedFile[] {
      return stagedFilesMap.get(channelId) ?? [];
    },
    [stagedFilesMap],
  );

  const hasFiles = useCallback(
    function hasFiles(channelId: string): boolean {
      const files = stagedFilesMap.get(channelId);
      return files !== undefined && files.length > 0;
    },
    [stagedFilesMap],
  );

  const uploadAllFiles = useCallback(
    async function uploadAllFiles(channelId: string): Promise<UploadedFile[]> {
      const files = stagedFilesMap.get(channelId);
      if (!files || files.length === 0) return [];

      const pending = files.filter((f) => f.status === "pending");
      if (pending.length === 0) return [];

      setStagedFilesMap((prev) => {
        const next = new Map(prev);
        const updated = (prev.get(channelId) ?? []).map((f) =>
          f.status === "pending" ? { ...f, status: "uploading" as const } : f,
        );
        next.set(channelId, updated);
        return next;
      });

      const results: UploadedFile[] = [];

      await Promise.all(
        pending.map(async (staged) => {
          const path = createWorkspaceFilePath(workspaceIdRef.current, staged.id, staged.name);
          try {
            const { data } = await instantDB.storage.uploadFile(path, staged.file, {
              contentType: staged.contentType,
            });

            results.push({
              attachmentType: staged.attachmentType,
              contentType: staged.contentType,
              fileId: data.id,
              name: staged.name,
              sizeBytes: staged.sizeBytes,
            });

            setStagedFilesMap((prev) => {
              const next = new Map(prev);
              const updated = (prev.get(channelId) ?? []).map((f) =>
                f.id === staged.id ? { ...f, status: "done" as const } : f,
              );
              next.set(channelId, updated);
              return next;
            });
          } catch {
            setStagedFilesMap((prev) => {
              const next = new Map(prev);
              const updated = (prev.get(channelId) ?? []).map((f) =>
                f.id === staged.id ? { ...f, status: "error" as const } : f,
              );
              next.set(channelId, updated);
              return next;
            });
          }
        }),
      );

      return results;
    },
    [stagedFilesMap],
  );

  function updateWorkspaceId(workspaceId: string) {
    workspaceIdRef.current = workspaceId;
  }

  return {
    addFiles,
    channelIdsWithDrafts,
    clearDraft,
    getDraft,
    getStagedFiles,
    hasFiles,
    removeFile,
    setDraft,
    updateWorkspaceId,
    uploadAllFiles,
  };
}
