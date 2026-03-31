import { useState } from "react";

import { createWorkspaceInviteTx, type WorkspaceRole } from "@quack/data";

import { ActionModal } from "./ActionModal";
import { ModalButtonRow } from "./ModalPrimitives";
import { Notice, TextareaField } from "../../../components/ui/FormFields";
import { instantDB } from "../../../lib/instant";
import { coerceWorkspaceRole, parseInviteEmails } from "../../../lib/workspaces";

interface InviteModalProps {
  isOwner: boolean;
  memberEmails: Set<string>;
  onClose: () => void;
  pendingEmails: Set<string>;
  userId: string;
  workspaceId: string;
}

export function InviteModal(props: InviteModalProps) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedEmails = parseInviteEmails(emails).filter(
      (email) => !props.memberEmails.has(email) && !props.pendingEmails.has(email),
    );

    if (!parsedEmails.length) {
      setNotice("Add at least one new email not already a member or pending invite.");
      return;
    }

    setNotice(null);
    setIsSubmitting(true);

    try {
      const txs = parsedEmails.map(
        (email) =>
          createWorkspaceInviteTx({
            email,
            invitedById: props.userId,
            role,
            workspaceId: props.workspaceId,
          }).tx,
      );

      await instantDB.transact(txs);
      props.onClose();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not send invites.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionModal onClose={props.onClose} title="Invite teammates">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextareaField
          label="Emails"
          onChange={setEmails}
          placeholder={"sam@quackity.chat\npat@quackity.chat"}
          value={emails}
        />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-600">Role</span>
          <select
            className="w-full rounded-xl border border-amber-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-400"
            onChange={(event) => setRole(coerceWorkspaceRole(event.target.value))}
            value={role}
          >
            {props.isOwner ? <option value="admin">Admin</option> : null}
            <option value="member">Member</option>
            <option value="guest">Guest</option>
          </select>
        </label>
        {notice ? <Notice message={notice} tone="error" /> : null}
        <ModalButtonRow
          isDisabled={isSubmitting || !emails.trim()}
          isSubmitting={isSubmitting}
          onCancel={props.onClose}
          submitLabel="Send invites"
          submittingLabel="Sending..."
        />
      </form>
    </ActionModal>
  );
}
