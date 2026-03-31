import type { Editor } from "@tiptap/react";

import { MessageInput } from "../../../components/chat/MessageInput";
import type { StagedFile } from "../../../hooks/useFileUpload";

interface ChannelFooterProps {
  channelName: string;
  draft: string;
  editorRef: React.RefObject<Editor | null>;
  onAddFiles: (files: FileList) => void;
  onInputFocus?: () => void;
  onInputKeyDown?: (event: KeyboardEvent) => boolean | void;
  onRemoveFile: (fileId: string) => void;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
  stagedFiles: StagedFile[];
}

export function ChannelFooter(props: ChannelFooterProps) {
  return (
    <footer className="border-t border-amber-100/70 px-2 pt-1.5 pb-2 sm:px-4 sm:pt-2 sm:pb-3">
      <div>
        <MessageInput
          editorRef={props.editorRef}
          onAddFiles={props.onAddFiles}
          onKeyDown={props.onInputKeyDown}
          onRemoveFile={props.onRemoveFile}
          onSubmit={props.onSubmit}
          onValueChange={props.onValueChange}
          placeholder={`Message #${props.channelName}`}
          stagedFiles={props.stagedFiles}
          value={props.draft}
        />
      </div>
    </footer>
  );
}
