import type { Editor } from "@tiptap/react";

import { MessageInput } from "../../../components/chat/MessageInput";
import { TypingIndicator } from "../../../components/chat/TypingIndicator";
import type { MentionSuggestionItem } from "../../../components/chat/MentionList";
import type { StagedFile } from "../../../hooks/useFileUpload";
import type { TypingPeer } from "../../../hooks/useTypingIndicator";

interface ChannelFooterProps {
  activeTypers: TypingPeer[];
  channelName: string;
  draft: string;
  editorRef: React.RefObject<Editor | null>;
  members?: MentionSuggestionItem[];
  onAddFiles: (files: FileList) => void;
  onInputFocus?: () => void;
  onInputKeyDown?: (event: KeyboardEvent) => boolean | void;
  onRemoveFile: (fileId: string) => void;
  onSubmit: () => void;
  onTypingBlur?: () => void;
  onTypingKeyDown?: (event: KeyboardEvent) => void;
  onValueChange: (value: string) => void;
  stagedFiles: StagedFile[];
}

export function ChannelFooter(props: ChannelFooterProps) {
  return (
    <footer className="border-t border-amber-100/70 px-2 pt-0 pb-2 sm:px-4 sm:pb-3">
      <TypingIndicator activeTypers={props.activeTypers} />
      <MessageInput
        editorRef={props.editorRef}
        members={props.members}
        onAddFiles={props.onAddFiles}
        onKeyDown={props.onInputKeyDown}
        onRemoveFile={props.onRemoveFile}
        onSubmit={props.onSubmit}
        onTypingBlur={props.onTypingBlur}
        onTypingKeyDown={props.onTypingKeyDown}
        onValueChange={props.onValueChange}
        placeholder={`Message #${props.channelName}`}
        stagedFiles={props.stagedFiles}
        value={props.draft}
      />
    </footer>
  );
}
