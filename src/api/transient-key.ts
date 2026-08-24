/**
 * A deliberately tiny in-memory holder for a visitor-supplied API key.
 *
 * It has no serialization hooks and never interacts with browser storage,
 * cookies, URLs, analytics, error reporting, or logging. `clear` drops the
 * JavaScript reference; secure memory zeroing is not available in the browser.
 */

export interface TransientKeyHolder {
  set(apiKey: string): void;
  has(): boolean;
  clear(): void;
  withKey<T>(operation: (apiKey: string) => T): T;
}

export class MissingTransientKeyError extends Error {
  constructor() {
    super("No transient API key is available.");
    this.name = "MissingTransientKeyError";
  }
}

export function createTransientKeyHolder(): TransientKeyHolder {
  let currentKey: string | undefined;

  return Object.freeze({
    set(apiKey: string): void {
      const normalized = apiKey.trim();
      if (!normalized) {
        currentKey = undefined;
        throw new TypeError("API key must not be empty.");
      }
      currentKey = normalized;
    },

    has(): boolean {
      return currentKey !== undefined;
    },

    clear(): void {
      currentKey = undefined;
    },

    withKey<T>(operation: (apiKey: string) => T): T {
      if (currentKey === undefined) {
        throw new MissingTransientKeyError();
      }
      return operation(currentKey);
    },
  });
}

export interface PageLifecycleTarget {
  addEventListener(type: "pageshow" | "pagehide", listener: EventListener): void;
  removeEventListener(
    type: "pageshow" | "pagehide",
    listener: EventListener,
  ): void;
}

export type DisposeLifecycleBinding = () => void;

/**
 * Clears on both sides of page navigation. `pageshow` is intentionally not
 * limited to persisted events: refresh, history restore, and a normal load all
 * start without a visitor key.
 */
export function bindTransientKeyLifecycle(
  holder: TransientKeyHolder,
  target?: PageLifecycleTarget,
): DisposeLifecycleBinding {
  holder.clear();

  const lifecycleTarget =
    target ??
    (typeof window === "undefined"
      ? undefined
      : (window as unknown as PageLifecycleTarget));

  if (!lifecycleTarget) {
    return () => undefined;
  }

  const clearKey: EventListener = () => holder.clear();
  lifecycleTarget.addEventListener("pageshow", clearKey);
  lifecycleTarget.addEventListener("pagehide", clearKey);

  return () => {
    lifecycleTarget.removeEventListener("pageshow", clearKey);
    lifecycleTarget.removeEventListener("pagehide", clearKey);
    holder.clear();
  };
}
