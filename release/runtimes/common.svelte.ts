// What a generated test component and a page share: the harness a snippet's
// `test` comes from, pockets, captures, and what a page publishes about its run.
// Under Vitest the plugin resolves this module to `./vitest.ts`, which re-exports
// it with a `define` that registers a Vitest test; here, a page mounts the
// component itself, so `define` has nothing to do.
import { flushSync, tick, type Component } from "svelte";
import { TESTS_ENDPOINT } from "../endpoints.ts";
import type { ExpectStatic, TestContext, vi } from "vitest";
import type { UserEvent } from "@testing-library/user-event";
import type {
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/svelte";

// ── what a snippet is handed ─────────────────────────────────────────────────

/** What a test body is handed. */
export type Payload = {
  expect: ExpectStatic;
  /** A `@testing-library/user-event` session for this test. */
  user: UserEvent;
  flushSync: typeof flushSync;
  tick: typeof tick;
  /** Testing Library's queries over the whole document. */
  screen: typeof screen;
  within: typeof within;
  fireEvent: typeof fireEvent;
  waitFor: typeof waitFor;
  /** A free-form annotation, kept with the test's outcome. */
  note: (text: string) => void;
  /**
   * A PNG of `target` (the whole page by default) as a data URI, kept with the
   * outcome and shown in the report. Only the report's browser can take one:
   * anywhere else it resolves to null.
   */
  capture: (target?: HTMLElement, name?: string) => Promise<string | null>;
  /** Vitest's test context: only when running under Vitest. */
  context?: TestContext;
  /** Vitest's `vi`: only when running under Vitest. */
  vi?: typeof vi;
};

export type Body = (payload: Payload) => Promise<void> | void;

export type TestState = "running" | "passed" | "failed";

/**
 * The last parameter of a test snippet. Call it exactly once, in the snippet's
 * markup, with the test body: `{test(async ({ expect }) => { … })}`.
 *
 * It also carries the test's name and, reactively, where it stands, so the
 * snippet can show them however it likes: `{test.name} — {test.state}`.
 */
export type Test = ((body: Body) => void) & {
  /** `Component > snippet` */
  readonly name: string;
  readonly state: TestState;
  /** The failure's message, once it has failed. */
  readonly error: string | null;
  /** Every `note` the body wrote so far. */
  readonly notes: readonly string[];
};

/**
 * A pocket is the reactive object a test snippet and its body share. The
 * snippet binds elements and component instances into it, and the body reads
 * them back and writes values the markup reacts to.
 *
 * The type argument is the pocket's full shape (what the snippet declared); the
 * initial value holds only the members that were written as literal types.
 */
export const pocket = <T extends object>(initial: Partial<T> = {}): T => {
  const state = $state(initial);
  return state as T;
};

// ── the harness ──────────────────────────────────────────────────────────────

export type Env = Omit<Payload, "flushSync" | "tick" | "note" | "capture"> & {
  /**
   * The documentation's screenshot, taken at the start of the body or its end:
   * called at both, answers a data URI at the one it was asked for. Left out
   * where nobody is asking (everywhere but a page opened with `?docs=`).
   */
  docs?: (when: DocsMoment) => Promise<string | null>;
  /** Draws a capture; left out where nothing can (under Vitest). */
  capture?: Payload["capture"];
  /** Told about every `note` as it is written. */
  onNote?: (text: string) => void;
};

export type Captured = { name: string | null; dataUri: string };

export type Harness = {
  /** Handed to the snippet as its `Test` parameter. */
  test: Test;
  /** Every `note` the body wrote, in order. */
  notes: string[];
  /** Every capture the body drew, in order. */
  captures: Captured[];
  /** Runs the body the snippet registered; rejects if it never did, or if it threw. */
  run(): Promise<void>;
};

export const NEVER_CALLED =
  "the snippet never called `test`: a test snippet renders `{test(async (payload) => { … })}` exactly once";

export const CALLED_TWICE =
  "`test` was called more than once: a test snippet calls it exactly once";

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/**
 * The part of running a test that is the same under Vitest and on a page:
 * the snippet hands over a body through `test`, and `run` runs it once the
 * markup is mounted (so every `bind:this` has been set). `test.state` and
 * `test.error` follow along, reactively, for the snippet to show.
 */
export type DocsMoment = "start" | "end";

/** The name the documentation's screenshot goes by among a run's captures. */
export const DOCS_CAPTURE = "docs";

export function createHarness(
  name: string,
  env: Env,
  expectsBody = true,
): Harness {
  let state = $state<TestState>("running");
  let error = $state<string | null>(null);
  let body: Body | null = null;
  let calls = 0;
  const notes = $state<string[]>([]);
  const captures: Captured[] = [];
  const { onNote, capture, docs, ...rest } = env;

  const payload: Payload = {
    ...rest,
    flushSync,
    tick,
    note: (text) => {
      notes.push(text);
      onNote?.(text);
    },
    capture: async (target, captureName) => {
      const dataUri = capture ? await capture(target, captureName) : null;
      if (dataUri) captures.push({ name: captureName ?? null, dataUri });
      return dataUri;
    },
  };

  const test = Object.defineProperties(
    (fn: Body) => {
      calls += 1;
      if (calls > 1) throw new Error(CALLED_TWICE);
      body = fn;
    },
    {
      name: { value: name },
      state: { get: () => state },
      error: { get: () => error },
      notes: { get: () => notes },
    },
  ) as unknown as Test;

  const forDocs = async (when: DocsMoment) => {
    const dataUri = docs ? await docs(when) : null;
    if (dataUri) captures.push({ name: DOCS_CAPTURE, dataUri });
  };

  return {
    test,
    notes,
    captures,
    async run() {
      try {
        flushSync();
        await tick();
        await forDocs("start");
        // an example has no body: mounting without throwing is its test
        if (!body && expectsBody) throw new Error(NEVER_CALLED);
        if (body) await body(payload);
        await forDocs("end");
        state = "passed";
      } catch (e) {
        error = messageOf(e);
        state = "failed";
        throw e;
      }
    },
  };
}

// ── a page ───────────────────────────────────────────────────────────────────

/** The screenshot function the report exposes to a page it drives; absent on a page opened by hand. */
export const CAPTURE_BINDING = "__sweaterVestCapture";

declare global {
  interface Window {
    [CAPTURE_BINDING]?: (selector: string | null) => Promise<string>;
  }
}

const MARK = "data-sweater-vest-capture";

/** A PNG data URI of `target` (the page without one), taken by the browser's driver; null when nothing drives it. */
export async function capture(target?: HTMLElement): Promise<string | null> {
  const screenshot = window[CAPTURE_BINDING];
  if (!screenshot) return null;
  if (!target) return `data:image/png;base64,${await screenshot(null)}`;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  target.setAttribute(MARK, id);
  try {
    return `data:image/png;base64,${await screenshot(`[${MARK}="${id}"]`)}`;
  } finally {
    target.removeAttribute(MARK);
  }
}

/** The screenshot function for a region of the page, which the docs runner exposes; absent on a page opened by hand. */
export const DOCS_BINDING = "__sweaterVestDocs";

export type Clip = { x: number; y: number; width: number; height: number };

declare global {
  interface Window {
    [DOCS_BINDING]?: (clip: Clip) => Promise<string>;
  }
}

const PADDING = 8;

/** The smallest box, in page coordinates, around everything inside `root` that takes up room, with a little air. */
export function contentClip(root: HTMLElement): Clip | null {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const el of root.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    left = Math.min(left, r.left);
    top = Math.min(top, r.top);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  if (left === Infinity) return null;
  const x = Math.max(0, Math.floor(left + scrollX) - PADDING);
  const y = Math.max(0, Math.floor(top + scrollY) - PADDING);
  return {
    x,
    y,
    width: Math.ceil(right + scrollX) + PADDING - x,
    height: Math.ceil(bottom + scrollY) + PADDING - y,
  };
}

/** A PNG data URI of what `root` shows, tight around its content; null when nothing drives the page or nothing shows. */
export async function captureContent(
  root: HTMLElement,
): Promise<string | null> {
  const screenshot = window[DOCS_BINDING];
  const clip = contentClip(root);
  if (!screenshot || !clip) return null;
  return `data:image/png;base64,${await screenshot(clip)}`;
}

/** What a generated test component knows about where it came from. */
export type Meta = {
  /** `Component > snippet` */
  name: string;
  /** The component, relative to the generated file. */
  source: string;
  snippet: string;
  /** 1-based line of the `{#snippet}` in the component. */
  line: number;
  /** false for an example: a snippet with no `Test` parameter, which renders and tests nothing (absent in an older extract: a test) */
  test?: boolean;
};

/** A generated component's registration; on a page the route mounts it itself. */
export const define = (
  _Self: () => Component<{ harness: Harness }>,
  _meta: Meta,
): void => {};

/** One test (or example) snippet, as the dev server lists them at `TESTS_ENDPOINT`. */
export type VestEntry = {
  /** the component, relative to the project root */
  file: string;
  snippet: string;
  /** `Component > snippet` */
  name: string;
  line: number;
  /** false for a render-only example: a snippet with no `Test` parameter */
  test: boolean;
  /** the page path for this snippet: `<file without .svelte>/<snippet>` */
  key: string;
  /** the generated test component, as the dev server serves it */
  url: string;
};

/** Every snippet the dev server lists; `fetcher` is SvelteKit's `fetch` in a `load`. */
export const fetchTests = async (
  fetcher: typeof fetch = fetch,
): Promise<VestEntry[]> => (await fetcher(TESTS_ENDPOINT)).json();

/** The generated test component a page mounts. */
export const loadVest = async (
  entry: VestEntry,
): Promise<Component<{ harness: Harness }>> =>
  (await import(/* @vite-ignore */ entry.url)).default;

/** What a page says about its snippet, for whoever drives the browser (the report). */
export type PageResult = {
  name: string;
  key: string;
  test: boolean;
  state: TestState;
  error: string | null;
  notes: string[];
  captures: Captured[];
  durationMs: number;
};

declare global {
  interface Window {
    __sweaterVest?: PageResult;
  }
}

export const publish = (
  harness: Harness,
  entry: VestEntry,
  started: number,
) => {
  window.__sweaterVest = {
    name: entry.name,
    key: entry.key,
    test: entry.test,
    state: harness.test.state,
    error: harness.test.error,
    notes: [...harness.notes],
    captures: [...harness.captures],
    durationMs: Math.round(performance.now() - started),
  };
};
