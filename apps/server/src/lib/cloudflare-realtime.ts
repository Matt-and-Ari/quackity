import { getCloudflareRealtimeEnv } from "../env";

type CloudflareRealtimeConfig = {
  accountId: string;
  apiToken: string;
  appId: string;
  presetName: string;
};

type CloudflareApiEnvelope<T> = {
  data?: T;
  error?: {
    code?: number;
    message?: string;
  };
  errors?: Array<{
    message?: string;
  }>;
  messages?: Array<{
    message?: string;
  }>;
  success?: boolean;
};

type CloudflareMeeting = {
  id: string;
  status?: "ACTIVE" | "INACTIVE";
  title?: string;
};

type CloudflareParticipant = {
  custom_participant_id: string;
  id: string;
  name?: string;
  picture?: string;
  preset_name: string;
};

type CloudflareParticipantWithToken = CloudflareParticipant & {
  token: string;
};

type CloudflarePreset = {
  id?: string;
  name?: string;
};

type JsonRequestInit = Omit<RequestInit, "body"> & {
  json?: unknown;
};

export class CloudflareRealtimeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = "CloudflareRealtimeError";
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const maybeEnvelope = payload as CloudflareApiEnvelope<unknown>;
  const singularErrorMessage = maybeEnvelope.error?.message;

  if (singularErrorMessage) {
    return singularErrorMessage;
  }

  const errorMessages = maybeEnvelope.errors
    ?.map((error) => error.message)
    .filter((message): message is string => Boolean(message));

  if (errorMessages?.length) {
    return errorMessages.join(", ");
  }

  const infoMessages = maybeEnvelope.messages
    ?.map((message) => message.message)
    .filter((message): message is string => Boolean(message));

  if (infoMessages?.length) {
    return infoMessages.join(", ");
  }

  return fallback;
}

class CloudflareRealtimeClient {
  private readonly baseUrl: string;
  private resolvedPresetName: string | null = null;

  constructor(private readonly config: CloudflareRealtimeConfig) {
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/realtime/kit/${config.appId}`;
  }

  private async request<T>(path: string, init?: JsonRequestInit): Promise<T>;
  private async request<T>(
    path: string,
    init: JsonRequestInit | undefined,
    options: {
      allowNotFound: true;
    },
  ): Promise<T | null>;
  private async request<T>(
    path: string,
    init?: JsonRequestInit,
    options?: {
      allowNotFound?: boolean;
    },
  ): Promise<T | null> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      body: init?.json === undefined ? undefined : JSON.stringify(init.json),
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }

    if (response.status === 404 && options?.allowNotFound) {
      return null;
    }

    if (!response.ok) {
      throw new CloudflareRealtimeError(
        getErrorMessage(payload, "Cloudflare Realtime request failed"),
        response.status,
        payload,
      );
    }

    const envelope = payload as CloudflareApiEnvelope<T> | undefined;

    if (!envelope?.data) {
      throw new CloudflareRealtimeError(
        getErrorMessage(payload, "Cloudflare Realtime response was missing data"),
        response.status,
        payload,
      );
    }

    return envelope.data;
  }

  private async requestWithoutData(
    path: string,
    init?: JsonRequestInit,
    options?: {
      allowNotFound?: boolean;
    },
  ) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      body: init?.json === undefined ? undefined : JSON.stringify(init.json),
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }

    if (response.status === 404 && options?.allowNotFound) {
      return;
    }

    if (!response.ok) {
      throw new CloudflareRealtimeError(
        getErrorMessage(payload, "Cloudflare Realtime request failed"),
        response.status,
        payload,
      );
    }
  }

  async createMeeting(input?: { title?: string }) {
    return this.request<CloudflareMeeting>("/meetings", {
      json: {
        title: input?.title,
      },
      method: "POST",
    });
  }

  async getMeeting(meetingId: string) {
    return this.request<CloudflareMeeting>(`/meetings/${meetingId}`, undefined, {
      allowNotFound: true,
    });
  }

  async listMeetings(input?: { search?: string }) {
    const params = new URLSearchParams({
      page_no: "1",
      per_page: "100",
    });

    if (input?.search) {
      params.set("search", input.search);
    }

    return this.request<CloudflareMeeting[]>(`/meetings?${params.toString()}`);
  }

  async listParticipants(meetingId: string) {
    return this.request<CloudflareParticipant[]>(
      `/meetings/${meetingId}/participants?page_no=1&per_page=100`,
    );
  }

  async addParticipant(input: {
    customParticipantId: string;
    meetingId: string;
    name?: string;
    picture?: string;
  }) {
    const presetName = await this.resolvePresetName();

    return this.request<CloudflareParticipantWithToken>(
      `/meetings/${input.meetingId}/participants`,
      {
        json: {
          custom_participant_id: input.customParticipantId,
          name: input.name,
          picture: input.picture,
          preset_name: presetName,
        },
        method: "POST",
      },
    );
  }

  async refreshParticipantToken(input: { meetingId: string; participantId: string }) {
    return this.request<{ token: string }>(
      `/meetings/${input.meetingId}/participants/${input.participantId}/token`,
      {
        method: "POST",
      },
    );
  }

  async deleteParticipant(input: { meetingId: string; participantId: string }) {
    await this.requestWithoutData(
      `/meetings/${input.meetingId}/participants/${input.participantId}`,
      {
        method: "DELETE",
      },
      {
        allowNotFound: true,
      },
    );
  }

  async deleteMeeting(meetingId: string) {
    await this.requestWithoutData(
      `/meetings/${meetingId}`,
      {
        method: "DELETE",
      },
      {
        allowNotFound: true,
      },
    );
  }

  async listPresets() {
    return this.request<CloudflarePreset[]>("/presets?page_no=1&per_page=100");
  }

  async createPreset(name: string) {
    return this.request<CloudflarePreset>("/presets", {
      json: {
        config: {
          max_screenshare_count: 1,
          max_video_streams: {
            desktop: 8,
            mobile: 4,
          },
          media: {
            audio: {
              enable_high_bitrate: true,
              enable_stereo: false,
            },
            screenshare: {
              frame_rate: 15,
              quality: "hd",
            },
            video: {
              frame_rate: 30,
              quality: "hd",
            },
          },
          view_type: "GROUP_CALL",
        },
        name,
      },
      method: "POST",
    });
  }

  async ensurePresetExists() {
    const presetName = await this.resolvePresetName();
    const presets = await this.listPresets();
    const existingPreset = presets.find((preset) => preset.name === presetName);

    if (existingPreset) {
      return existingPreset;
    }

    return this.createPreset(presetName);
  }

  async resolvePresetName() {
    if (this.resolvedPresetName) {
      return this.resolvedPresetName;
    }

    const presets = await this.listPresets();
    const configuredPreset = presets.find((preset) => preset.name === this.config.presetName);

    if (configuredPreset?.name) {
      this.resolvedPresetName = configuredPreset.name;
      return configuredPreset.name;
    }

    const fallbackPreset = presets.find((preset) =>
      ["group_call_participant", "group_call_host", "group_call_guest"].includes(preset.name ?? ""),
    );

    if (fallbackPreset?.name) {
      this.resolvedPresetName = fallbackPreset.name;
      return fallbackPreset.name;
    }

    throw new CloudflareRealtimeError(
      `No usable Realtime preset found. Configured preset "${this.config.presetName}" is missing.`,
      400,
      presets,
    );
  }

  async issueParticipantToken(input: {
    customParticipantId: string;
    meetingId: string;
    name?: string;
    picture?: string;
  }) {
    const existingParticipant = (await this.listParticipants(input.meetingId)).find(
      (participant) => participant.custom_participant_id === input.customParticipantId,
    );

    if (existingParticipant) {
      const refreshedToken = await this.refreshParticipantToken({
        meetingId: input.meetingId,
        participantId: existingParticipant.id,
      });
      const presetName = existingParticipant.preset_name ?? (await this.resolvePresetName());

      return {
        participantId: existingParticipant.id,
        presetName,
        token: refreshedToken.token,
      };
    }

    const createdParticipant = await this.addParticipant(input);
    const presetName = createdParticipant.preset_name ?? (await this.resolvePresetName());

    return {
      participantId: createdParticipant.id,
      presetName,
      token: createdParticipant.token,
    };
  }
}

let cachedClient: CloudflareRealtimeClient | null = null;

export function getCloudflareRealtimeClient() {
  if (!cachedClient) {
    cachedClient = new CloudflareRealtimeClient(getCloudflareRealtimeEnv());
  }

  return cachedClient;
}
