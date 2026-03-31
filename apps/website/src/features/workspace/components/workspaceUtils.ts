import type { ChannelRecord } from "../../../types/quack";

export function channelHasActiveCall(
  channel: ChannelRecord,
  callChannelId: string | null,
  activeCallChannelIds: ReadonlySet<string>,
): boolean {
  return callChannelId === channel.id || activeCallChannelIds.has(channel.id);
}
