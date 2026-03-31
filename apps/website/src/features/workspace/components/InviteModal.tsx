import { useRef, useState } from "react";

import { createWorkspaceInviteTx, type WorkspaceRole } from "@quack/data";

import { ActionModal } from "./ActionModal";
import { ModalButtonRow } from "./ModalPrimitives";
import { Notice, TextareaField } from "../../../components/ui/FormFields";
import { SelectField } from "../../../components/ui/SelectField";
import { api } from "../../../lib/api";
import { instantDB } from "../../../lib/instant";
import { buildInviteUrl, parseInviteEmails } from "../../../lib/workspaces";

interface InviteModalProps {
  inviterName: string;
  isOwner: boolean;
  memberEmails: Set<string>;
  onClose: () => void;
  pendingEmails: Set<string>;
  refreshToken: string;
  userId: string;
  workspaceId: string;
  workspaceName: string;
}

export function InviteModal(props: InviteModalProps) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const roleOptions: { label: string; value: WorkspaceRole }[] = [
    ...(props.isOwner ? [{ label: "Admin", value: "admin" as const }] : []),
    { label: "Member", value: "member" as const },
    { label: "Guest", value: "guest" as const },
  ];

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

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

      const inviteUrl = buildInviteUrl(props.workspaceId, props.workspaceName, props.inviterName);

      console.log("[InviteModal] Sending invite emails", {
        emails: parsedEmails,
        inviterName: props.inviterName,
        inviteUrl,
        workspaceName: props.workspaceName,
        hasRefreshToken: Boolean(props.refreshToken),
      });

      api
        .sendInviteEmails(
          {
            emails: parsedEmails,
            inviterName: props.inviterName,
            inviteUrl,
            workspaceName: props.workspaceName,
          },
          props.refreshToken,
        )
        .then((res: unknown) => {
          console.log("[InviteModal] sendInviteEmails response", res);
        })
        .catch((err: unknown) => {
          console.error("[InviteModal] sendInviteEmails failed", err);
        });

      props.onClose();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not send invites.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionModal onClose={props.onClose} title="Invite teammates">
      <form className="space-y-4" onKeyDown={handleKeyDown} onSubmit={handleSubmit} ref={formRef}>
        <TextareaField
          autoFocus
          label="Emails"
          onChange={setEmails}
          placeholder={"sam@quackity.chat\npat@quackity.chat"}
          value={emails}
        />
        <SelectField label="Role" onChange={setRole} options={roleOptions} value={role} />
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
