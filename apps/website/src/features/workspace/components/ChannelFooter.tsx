import type { KeyboardEvent } from "react";

import { MessageInput } from "../../../components/chat/MessageInput";
import type { StagedFile } from "../../../hooks/useFileUpload";

interface ChannelFooterProps {
  channelName: string;
  draft: string;
  onAddFiles: (files: FileList) => void;
  onInputFocus: () => void;
  onInputKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onRemoveFile: (fileId: string) => void;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
  stagedFiles: StagedFile[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChannelFooter(props: ChannelFooterProps) {
  return (
    <footer className="border-t border-amber-100/70 px-2 pt-1.5 pb-2 sm:px-4 sm:pt-2 sm:pb-3">
      <div>
        <MessageInput
          onAddFiles={props.onAddFiles}
          onFocus={props.onInputFocus}
          onKeyDown={props.onInputKeyDown}
          onRemoveFile={props.onRemoveFile}
          onSubmit={props.onSubmit}
          onValueChange={props.onValueChange}
          placeholder={`Message #${props.channelName}`}
          stagedFiles={props.stagedFiles}
          textareaRef={props.textareaRef}
          value={props.draft}
        />
      </div>
    </footer>
  );
}
