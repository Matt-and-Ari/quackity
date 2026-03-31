import { useState } from "react";

import type { ChannelVisibility } from "@quack/data";

import { ActionModal } from "./ActionModal";
import { ChannelFormFields, ModalButtonRow } from "./ModalPrimitives";
import type { ChannelRecord } from "../../../types/quack";

interface EditChannelModalProps {
  channel: ChannelRecord | null;
  onClose: () => void;
  onSave: (input: { name: string; topic?: string; visibility: ChannelVisibility }) => Promise<void>;
}

export function EditChannelModal(props: EditChannelModalProps) {
  const [name, setName] = useState(props.channel?.name ?? "");
  const [topic, setTopic] = useState(props.channel?.topic ?? "");
  const [visibility, setVisibility] = useState<ChannelVisibility>(
    (props.channel?.visibility as ChannelVisibility) ?? "public",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!props.channel) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await props.onSave({ name, topic, visibility });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionModal onClose={props.onClose} title="Edit channel">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <ChannelFormFields
          name={name}
          onNameChange={setName}
          onTopicChange={setTopic}
          onVisibilityChange={setVisibility}
          topic={topic}
          topicPlaceholder="What's this channel about?"
          visibility={visibility}
        />
        <ModalButtonRow
          isDisabled={isSubmitting || !name.trim()}
          isSubmitting={isSubmitting}
          onCancel={props.onClose}
          submitLabel="Save"
          submittingLabel="Saving..."
        />
      </form>
    </ActionModal>
  );
}
