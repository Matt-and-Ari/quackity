import { expect, test } from "bun:test";

import { getCloudflareRealtimeClient } from "../src/lib/cloudflare-realtime.ts";

test(
  "Cloudflare Realtime issues and refreshes participant tokens idempotently",
  async () => {
    const realtimeClient = getCloudflareRealtimeClient();
    const smokeTestMeetingTitle = "Quack Cloudflare Smoke Test";
    const customParticipantId = "quack-cloudflare-smoke-test-user";

    await realtimeClient.ensurePresetExists();

    const existingMeeting = (
      await realtimeClient.listMeetings({
        search: smokeTestMeetingTitle,
      })
    ).find((meeting) => meeting.title === smokeTestMeetingTitle);

    const meeting =
      existingMeeting ??
      (await realtimeClient.createMeeting({
        title: smokeTestMeetingTitle,
      }));

    const firstToken = await realtimeClient.issueParticipantToken({
      customParticipantId,
      meetingId: meeting.id,
      name: "Quack Integration Test",
    });

    expect(firstToken.participantId.length).toBeGreaterThan(0);
    expect(firstToken.presetName.length).toBeGreaterThan(0);
    expect(firstToken.token.length).toBeGreaterThan(0);

    const participantsAfterFirstJoin = await realtimeClient.listParticipants(meeting.id);
    const matchingParticipantsAfterFirstJoin = participantsAfterFirstJoin.filter(
      (participant) => participant.custom_participant_id === customParticipantId,
    );

    expect(matchingParticipantsAfterFirstJoin).toHaveLength(1);
    expect(matchingParticipantsAfterFirstJoin[0]?.id).toBe(firstToken.participantId);

    const secondToken = await realtimeClient.issueParticipantToken({
      customParticipantId,
      meetingId: meeting.id,
      name: "Quack Integration Test",
    });

    expect(secondToken.participantId).toBe(firstToken.participantId);
    expect(secondToken.presetName).toBe(firstToken.presetName);
    expect(secondToken.token.length).toBeGreaterThan(0);

    const participantsAfterSecondJoin = await realtimeClient.listParticipants(meeting.id);
    const matchingParticipantsAfterSecondJoin = participantsAfterSecondJoin.filter(
      (participant) => participant.custom_participant_id === customParticipantId,
    );

    expect(matchingParticipantsAfterSecondJoin).toHaveLength(1);
    expect(matchingParticipantsAfterSecondJoin[0]?.id).toBe(secondToken.participantId);
  },
  { timeout: 30_000 },
);
