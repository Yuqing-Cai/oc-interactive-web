/**
 * Provider-facing types stay independent from the fate-axis domain model.
 * The domain layer is responsible for compiling a prompt before it reaches
 * this boundary.
 */

export type ProviderTransport = "direct" | "relay";

export type StreamPhase =
  | "preparing"
  | "connecting"
  | "generating"
  | "finalizing";

export type FinishReason =
  | "stop"
  | "length"
  | "content-filter"
  | "cancelled"
  | "unknown";

export interface TokenUsage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
}

export interface StreamMetaEvent {
  readonly type: "meta";
  readonly requestId: string;
  readonly providerId: string;
  readonly modelId: string;
}

export interface StreamStatusEvent {
  readonly type: "status";
  readonly phase: StreamPhase;
  readonly message?: string;
}

export interface StreamDeltaEvent {
  readonly type: "delta";
  readonly text: string;
}

export interface StreamDoneEvent {
  readonly type: "done";
  readonly finishReason: FinishReason;
  readonly usage?: TokenUsage;
}

export interface StreamErrorEvent {
  readonly type: "error";
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

/**
 * Every provider stream must be normalized to this protocol. A consumer must
 * not treat an ended iterator as success unless it received a `done` event.
 */
export type NormalizedStreamEvent =
  | StreamMetaEvent
  | StreamStatusEvent
  | StreamDeltaEvent
  | StreamDoneEvent
  | StreamErrorEvent;

export interface ProviderGenerationRequest {
  readonly requestId: string;
  readonly modelId: string;
  readonly prompt: string;
  readonly systemPrompt?: string;
  readonly maxOutputTokens?: number;
  readonly signal?: AbortSignal;
}

/**
 * This object is intentionally short-lived. It must never be persisted,
 * serialized, logged, placed in a URL, or copied into generic app state.
 */
export interface EphemeralCredential {
  readonly apiKey: string;
}

/**
 * A provider adapter owns protocol translation only. Implementations may be
 * added later, after their browser-key policy and CORS behavior are reviewed.
 */
export interface ProviderAdapter {
  readonly id: string;
  readonly displayName: string;
  readonly transport: ProviderTransport;
  readonly endpointOrigin: string;
  readonly supportsBrowserCors: boolean;
  readonly documentationUrl?: string;

  stream(
    request: ProviderGenerationRequest,
    credential: EphemeralCredential,
  ): AsyncIterable<NormalizedStreamEvent>;
}
