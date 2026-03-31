import { useState } from "react";

import type { ChannelVisibility } from "@quack/data";

import { ActionModal } from "./ActionModal";
import { ChannelFormFields, ModalButtonRow } from "./ModalPrimitives";

interface CreateChannelModalProps {
  onClose: () => void;
  onCreateChannel: (input: {
    name: string;
    topic?: string;
    visibility: ChannelVisibility;
  }) => Promise<void>;
}

export function CreateChannelModal(props: CreateChannelModalProps) {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [visibility, setVisibility] = useState<ChannelVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await props.onCreateChannel({ name, topic, visibility });
      props.onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionModal onClose={props.onClose} title="New channel">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <ChannelFormFields
          autoFocusName
          name={name}
          namePlaceholder="design-crit"
          onNameChange={setName}
          onTopicChange={setTopic}
          onVisibilityChange={setVisibility}
          topic={topic}
          visibility={visibility}
        />
        <ModalButtonRow
          isDisabled={isSubmitting || !name.trim()}
          isSubmitting={isSubmitting}
          onCancel={props.onClose}
          submitLabel="Create"
          submittingLabel="Creating..."
        />
      </form>
    </ActionModal>
  );
}
