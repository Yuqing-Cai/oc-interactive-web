import { describe, expect, it } from "vitest";

import {
  EMPTY_DEFAULT_EXPERIENCE_CONFIG,
  resolveDefaultExperience,
  toPublicDefaultExperience,
} from "./runtime-config";

describe("default experience runtime config", () => {
  it("starts fully empty and disabled", () => {
    expect(resolveDefaultExperience(EMPTY_DEFAULT_EXPERIENCE_CONFIG)).toEqual({
      enabled: false,
      relayUrl: "",
      providerId: "",
      modelId: "",
      reason: "disabled",
    });
  });

  it("fails closed and discards partial values", () => {
    expect(
      resolveDefaultExperience({
        enabled: true,
        relayUrl: "/api/generate",
        providerId: "provider",
        modelId: "",
      }),
    ).toEqual({
      enabled: false,
      relayUrl: "",
      providerId: "",
      modelId: "",
      reason: "incomplete",
    });
  });

  it("accepts only a public relay route and exposes no credential surface", () => {
    const resolved = resolveDefaultExperience({
      enabled: true,
      relayUrl: "https://relay.example/api/generate",
      providerId: "provider",
      modelId: "model",
    });
    const publicConfig = toPublicDefaultExperience(resolved);
    expect(publicConfig).toEqual({
      enabled: true,
      relayUrl: "https://relay.example/api/generate",
      providerId: "provider",
      modelId: "model",
    });
    expect(JSON.stringify(publicConfig)).not.toContain("apiKey");
  });

  it("rejects non-HTTPS and credential-bearing relay URLs", () => {
    for (const relayUrl of [
      "http://relay.example/generate",
      "https://user:password@relay.example/generate",
      "javascript:alert(1)",
      "//relay.example/generate",
    ]) {
      expect(
        resolveDefaultExperience({
          enabled: true,
          relayUrl,
          providerId: "provider",
          modelId: "model",
        }),
      ).toMatchObject({ enabled: false, reason: "unsafe-relay-url" });
    }
  });
});
