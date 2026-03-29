import {
  channelByIdQuery,
  channelMeetingByChannelQuery,
  createChannelMeetingTx,
  updateChannelMeetingTx,
} from "../../../../packages/data/index.ts";

import { adminDB, type InstantAuthUser } from "../db";
import { getCloudflareRealtimeClient } from "./cloudflare-realtime";

function getAuthDisplayName(authUser: InstantAuthUser, fallbackName?: string) {
  if (fallbackName) {
    return fallbackName;
  }

  if (authUser.email) {
    return authUser.email;
  }

  return `quack-${authUser.id.slice(0, 8)}`;
}

function canJoinChannel(channel: Awaited<ReturnType<typeof loadChannel>>, userId: string) {
  if (!channel?.workspace) {
    return false;
  }

  const isWorkspaceOwner = channel.workspace.owner?.id === userId;
  const workspaceMembership = channel.workspace.members.find(
    (member) => member.$user?.id === userId,
  );
  const isWorkspaceAdmin = workspaceMembership?.role === "admin";
  const isChannelMember = channel.members.some((member) => member.$user?.id === userId);
  const isWorkspaceViewer = isWorkspaceOwner || workspaceMembership !== undefined;

  return (
    isWorkspaceOwner ||
    isWorkspaceAdmin ||
    isChannelMember ||
    (channel.visibility === "public" && isWorkspaceViewer)
  );
}

async function loadChannel(channelId: string) {
  const result = await adminDB.query(channelByIdQuery(channelId));

  return result.channels[0] ?? null;
}

async function loadChannelMeeting(channelId: string) {
  const result = await adminDB.query(channelMeetingByChannelQuery(channelId));

  return result.channelMeetings[0] ?? null;
}

async function ensureChannelMeeting(
  channel: NonNullable<Awaited<ReturnType<typeof loadChannel>>>,
  creatorId: string,
) {
  const realtimeClient = getCloudflareRealtimeClient();
  const existingMeeting = await loadChannelMeeting(channel.id);

  if (!existingMeeting) {
    const createdCloudflareMeeting = await realtimeClient.createMeeting({
      title: `#${channel.name}`,
    });

    try {
      const channelMeeting = createChannelMeetingTx({
        channelId: channel.id,
        cloudflareMeetingId: createdCloudflareMeeting.id,
        creatorId,
        lastJoinedAt: new Date(),
      });

      await adminDB.transact(channelMeeting.tx);
    } catch {
      // Ignore duplicate-create races and re-read the meeting below.
    }

    const createdMeeting = await loadChannelMeeting(channel.id);

    if (!createdMeeting) {
      throw new Error("Channel meeting could not be created");
    }

    return createdMeeting;
  }

  const cloudflareMeeting = await realtimeClient.getMeeting(existingMeeting.cloudflareMeetingId);

  if (!cloudflareMeeting || cloudflareMeeting.status === "INACTIVE") {
    const recreatedMeeting = await realtimeClient.createMeeting({
      title: `#${channel.name}`,
    });

    await adminDB.transact(
      updateChannelMeetingTx(existingMeeting.id, {
        cloudflareMeetingId: recreatedMeeting.id,
        lastJoinedAt: new Date(),
        status: "active",
      }),
    );

    return {
      ...existingMeeting,
      cloudflareMeetingId: recreatedMeeting.id,
      lastJoinedAt: new Date().toISOString(),
      status: "active",
    };
  }

  return existingMeeting;
}

export async function issueChannelCallJoinToken(input: {
  authUser: InstantAuthUser;
  channelId: string;
}) {
  const channel = await loadChannel(input.channelId);

  if (!channel) {
    return {
      error: "Channel not found",
      status: 404 as const,
    };
  }

  if (channel.archivedAt) {
    return {
      error: "Archived channels cannot host calls",
      status: 409 as const,
    };
  }

  if (!canJoinChannel(channel, input.authUser.id)) {
    return {
      error: "You do not have access to this channel call",
      status: 403 as const,
    };
  }

  const workspaceMembership = channel.workspace?.members.find(
    (member) => member.$user?.id === input.authUser.id,
  );
  const meeting = await ensureChannelMeeting(channel, input.authUser.id);
  const realtimeClient = getCloudflareRealtimeClient();
  const participant = await realtimeClient.issueParticipantToken({
    customParticipantId: input.authUser.id,
    meetingId: meeting.cloudflareMeetingId,
    name: getAuthDisplayName(input.authUser, workspaceMembership?.displayName),
    picture: input.authUser.imageURL ?? undefined,
  });

  await adminDB.transact(
    updateChannelMeetingTx(meeting.id, {
      lastJoinedAt: new Date(),
      status: "active",
    }),
  );

  return {
    channelId: channel.id,
    meetingId: meeting.cloudflareMeetingId,
    participantId: participant.participantId,
    presetName: participant.presetName,
    status: 200 as const,
    token: participant.token,
  };
}
