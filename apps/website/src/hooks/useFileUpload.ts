import { useCallback, useRef, useState } from "react";

import { id as instantId } from "@instantdb/react";

import { createWorkspaceFilePath, type AttachmentType } from "@quack/data";

import { instantDB } from "../lib/instant";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_FILES = 10;

export interface StagedFile {
  attachmentType: AttachmentType;
  contentType: string;
  file: File;
  id: string;
  name: string;
  previewUrl: string | null;
  sizeBytes: number;
  status: "pending" | "uploading" | "done" | "error";
}

export interface UploadedFile {
  attachmentType: AttachmentType;
  contentType: string;
  fileId: string;
  name: string;
  sizeBytes: number;
}

interface UseFileUploadProps {
  workspaceId: string;
}

export interface UseFileUploadResult {
  addFiles: (files: FileList | File[]) => void;
  clearFiles: () => void;
  hasFiles: boolean;
  isUploading: boolean;
  removeFile: (fileId: string) => void;
  stagedFiles: StagedFile[];
  uploadAll: () => Promise<UploadedFile[]>;
}

function resolveAttachmentType(contentType: string): AttachmentType {
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

export function useFileUpload(props: UseFileUploadProps): UseFileUploadResult {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const stagedFilesRef = useRef(stagedFiles);
  stagedFilesRef.current = stagedFiles;

  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files);
    const remaining = MAX_FILES - stagedFilesRef.current.length;

    if (remaining <= 0) return;

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

    setStagedFiles((prev) => [...prev, ...newStaged]);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setStagedFiles((prev) => {
      const removed = prev.find((f) => f.id === fileId);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const clearFiles = useCallback(() => {
    setStagedFiles((prev) => {
      for (const file of prev) {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
      }
      return [];
    });
  }, []);

  const uploadAll = useCallback(async (): Promise<UploadedFile[]> => {
    const pending = stagedFilesRef.current.filter((f) => f.status === "pending");
    if (pending.length === 0) return [];

    setStagedFiles((prev) =>
      prev.map((f) => (f.status === "pending" ? { ...f, status: "uploading" as const } : f)),
    );

    const results: UploadedFile[] = [];

    await Promise.all(
      pending.map(async (staged) => {
        const path = createWorkspaceFilePath(props.workspaceId, staged.id, staged.name);
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

          setStagedFiles((prev) =>
            prev.map((f) => (f.id === staged.id ? { ...f, status: "done" as const } : f)),
          );
        } catch {
          setStagedFiles((prev) =>
            prev.map((f) => (f.id === staged.id ? { ...f, status: "error" as const } : f)),
          );
        }
      }),
    );

    return results;
  }, [props.workspaceId]);

  const hasFiles = stagedFiles.length > 0;
  const isUploading = stagedFiles.some((f) => f.status === "uploading");

  return {
    addFiles,
    clearFiles,
    hasFiles,
    isUploading,
    removeFile,
    stagedFiles,
    uploadAll,
  };
}
