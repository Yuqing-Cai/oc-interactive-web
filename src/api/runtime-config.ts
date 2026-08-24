/**
 * Public runtime configuration for the owner-funded default experience.
 *
 * The browser is allowed to know where a site-owned relay lives and which
 * provider/model label it represents. It must never receive the owner's API
 * credential: that secret belongs exclusively behind the relay boundary.
 */

export interface DefaultExperienceRuntimeConfig {
  readonly enabled: boolean;
  readonly relayUrl: string;
  readonly providerId: string;
  readonly modelId: string;
}

export type DisabledDefaultExperienceReason =
  | "disabled"
  | "incomplete"
  | "unsafe-relay-url";

export interface DisabledDefaultExperience {
  readonly enabled: false;
  readonly relayUrl: "";
  readonly providerId: "";
  readonly modelId: "";
  readonly reason: DisabledDefaultExperienceReason;
}

export interface EnabledDefaultExperience {
  readonly enabled: true;
  readonly relayUrl: string;
  readonly providerId: string;
  readonly modelId: string;
}

export type ResolvedDefaultExperience =
  | DisabledDefaultExperience
  | EnabledDefaultExperience;

export const EMPTY_DEFAULT_EXPERIENCE_CONFIG: DefaultExperienceRuntimeConfig =
  Object.freeze({
    enabled: false,
    relayUrl: "",
    providerId: "",
    modelId: "",
  });

function disabled(
  reason: DisabledDefaultExperienceReason,
): DisabledDefaultExperience {
  return Object.freeze({
    enabled: false,
    relayUrl: "",
    providerId: "",
    modelId: "",
    reason,
  });
}

function isSafeRelayUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

/**
 * Fail closed whenever the feature flag is off, any required value is absent,
 * or the relay URL is unsafe. Partial configuration is discarded so no stale
 * route/provider/model can leak into a fallback path.
 */
export function resolveDefaultExperience(
  candidate: Partial<DefaultExperienceRuntimeConfig> | null | undefined,
): ResolvedDefaultExperience {
  if (!candidate?.enabled) {
    return disabled("disabled");
  }

  const relayUrl = candidate.relayUrl?.trim() ?? "";
  const providerId = candidate.providerId?.trim() ?? "";
  const modelId = candidate.modelId?.trim() ?? "";

  if (!relayUrl || !providerId || !modelId) {
    return disabled("incomplete");
  }

  if (!isSafeRelayUrl(relayUrl)) return disabled("unsafe-relay-url");

  return Object.freeze({
    enabled: true,
    relayUrl,
    providerId,
    modelId,
  });
}

/**
 * Safe metadata for a public capabilities response. There is deliberately no
 * credential field in either the input or the output type.
 */
export function toPublicDefaultExperience(
  config: ResolvedDefaultExperience,
): Readonly<{
  enabled: boolean;
  relayUrl: string;
  providerId: string;
  modelId: string;
}> {
  if (!config.enabled) {
    return Object.freeze({
      enabled: false,
      relayUrl: "",
      providerId: "",
      modelId: "",
    });
  }

  return Object.freeze({
    enabled: true,
    relayUrl: config.relayUrl,
    providerId: config.providerId,
    modelId: config.modelId,
  });
}
