import { describe, expect, it, vi } from "vitest";

import {
  MissingTransientKeyError,
  bindTransientKeyLifecycle,
  createTransientKeyHolder,
  type PageLifecycleTarget,
} from "./transient-key";

class FakeLifecycleTarget implements PageLifecycleTarget {
  readonly listeners = new Map<string, Set<EventListener>>();

  addEventListener(type: "pageshow" | "pagehide", listener: EventListener) {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: "pageshow" | "pagehide", listener: EventListener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: "pageshow" | "pagehide") {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(new Event(type));
    }
  }
}

describe("transient key holder", () => {
  it("keeps a key only behind a short-lived callback", () => {
    const holder = createTransientKeyHolder();
    holder.set("  visitor-key  ");
    expect(holder.has()).toBe(true);
    expect(holder.withKey((value) => value)).toBe("visitor-key");
    holder.clear();
    expect(holder.has()).toBe(false);
    expect(() => holder.withKey(vi.fn())).toThrow(MissingTransientKeyError);
  });

  it("clears on page show, page hide, and disposal", () => {
    const holder = createTransientKeyHolder();
    const target = new FakeLifecycleTarget();
    const dispose = bindTransientKeyLifecycle(holder, target);

    holder.set("one");
    target.dispatch("pageshow");
    expect(holder.has()).toBe(false);

    holder.set("two");
    target.dispatch("pagehide");
    expect(holder.has()).toBe(false);

    holder.set("three");
    dispose();
    expect(holder.has()).toBe(false);
    expect(target.listeners.get("pageshow")?.size).toBe(0);
    expect(target.listeners.get("pagehide")?.size).toBe(0);
  });
});
