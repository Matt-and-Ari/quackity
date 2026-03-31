import type { ChannelVisibility } from "@quack/data";

import { InputField } from "../../../components/ui/FormFields";
import { SelectField } from "../../../components/ui/SelectField";

const visibilityOptions: { label: string; value: ChannelVisibility }[] = [
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
];

interface ChannelFormFieldsProps {
  name: string;
  onNameChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onVisibilityChange: (value: ChannelVisibility) => void;
  namePlaceholder?: string;
  topic: string;
  topicPlaceholder?: string;
  visibility: ChannelVisibility;
}

export function ChannelFormFields(props: ChannelFormFieldsProps) {
  return (
    <>
      <InputField
        label="Name"
        onChange={props.onNameChange}
        placeholder={props.namePlaceholder ?? "general"}
        value={props.name}
      />
      <InputField
        label="Description"
        onChange={props.onTopicChange}
        placeholder={props.topicPlaceholder ?? "Optional description"}
        value={props.topic}
      />
      <SelectField
        label="Visibility"
        onChange={props.onVisibilityChange}
        options={visibilityOptions}
        value={props.visibility}
      />
    </>
  );
}

interface ModalButtonRowProps {
  isDisabled: boolean;
  onCancel: () => void;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
}

export function ModalButtonRow(props: ModalButtonRowProps) {
  return (
    <div className="flex gap-2 pt-1">
      <button
        className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={props.isDisabled}
        type="submit"
      >
        {props.isSubmitting ? props.submittingLabel : props.submitLabel}
      </button>
      <button
        className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
        onClick={props.onCancel}
        type="button"
      >
        Cancel
      </button>
    </div>
  );
}
