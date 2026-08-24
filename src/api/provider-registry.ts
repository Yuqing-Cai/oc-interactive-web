import type { ProviderAdapter } from "./types";

export interface ProviderRegistry {
  list(): readonly ProviderAdapter[];
  get(providerId: string): ProviderAdapter | undefined;
  has(providerId: string): boolean;
}

class ImmutableProviderRegistry implements ProviderRegistry {
  readonly #adapters: readonly ProviderAdapter[];
  readonly #byId: ReadonlyMap<string, ProviderAdapter>;

  constructor(adapters: readonly ProviderAdapter[]) {
    const byId = new Map<string, ProviderAdapter>();

    for (const adapter of adapters) {
      const id = adapter.id.trim();
      if (!id) {
        throw new TypeError("Provider adapter id must not be empty.");
      }
      if (byId.has(id)) {
        throw new TypeError(`Duplicate provider adapter id: ${id}`);
      }
      byId.set(id, adapter);
    }

    this.#adapters = Object.freeze([...adapters]);
    this.#byId = byId;
    Object.freeze(this);
  }

  list(): readonly ProviderAdapter[] {
    return this.#adapters;
  }

  get(providerId: string): ProviderAdapter | undefined {
    return this.#byId.get(providerId);
  }

  has(providerId: string): boolean {
    return this.#byId.has(providerId);
  }
}

export function createProviderRegistry(
  adapters: readonly ProviderAdapter[] = [],
): ProviderRegistry {
  return new ImmutableProviderRegistry(adapters);
}

/**
 * No provider is approved initially. Adding one must be an explicit registry
 * change after its key policy, endpoint origin, and CORS behavior are reviewed.
 */
export const providerRegistry: ProviderRegistry = createProviderRegistry();
