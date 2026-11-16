/// <reference types="node" />
/**
 * Screenshots for the documentation: the browser takes them (`shoot`), a hook
 * turns each file into a URL (`settle`), and a cache in `.derived/` remembers
 * which component each URL was made from, so a hook only fires for a
 * component that has changed.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { DERIVED, ensureDerived } from "./vite-plugin/derived.ts";
import {
  DOCS_BINDING,
  DOCS_CAPTURE,
  type Clip,
} from "./runtimes/common.svelte.ts";
import type { PageResult } from "./runtimes/common.svelte.ts";

// ── hooks ────────────────────────────────────────────────────────────────────

export type Shot = {
  /** the PNG, in a temporary folder that is removed once the hook is done */
  path: string;
  /** the component's path from the README's folder, and the snippet: the same identity as the README's fences */
  id: { file: string; snippet: string };
  /** of the PNG's bytes */
  hash: string;
};

/** Turns a screenshot into the URL the README links to; null leaves the snippet without an image. */
export type Hook = (shot: Shot) => Promise<string | null> | string | null;

export const sha = (data: Buffer | string) =>
  createHash("sha256").update(data).digest("hex").slice(0, 16);

/** `Counter.svelte` > `binds` → `Counter.binds.png`; a folder becomes dots, so two components of one name stay apart. */
export const imageName = ({ file, snippet }: Shot["id"]) =>
  `${`${file.replace(/\.svelte$/, "")}.${snippet}`.replace(/[^\w.-]+/g, ".")}.png`;

/** The PNG as a `data:` URI: nothing to host, at the cost of a README that is mostly base64. */
export const inline: Hook = ({ path: file }) =>
  `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;

/** Copies each PNG into `dir`, and answers its path from `from` (the README's folder). */
export const copyTo =
  (dir: string, from: string): Hook =>
  (shot) => {
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, imageName(shot.id));
    fs.copyFileSync(shot.path, target);
    return path.relative(from, target).split(path.sep).join("/");
  };

/**
 * A hook by name: `inline`, `file:<dir>` (relative to the README's folder),
 * or the path of a module whose default export is a `Hook`.
 */
export async function resolveHook(spec: string, home: string): Promise<Hook> {
  if (spec === "inline") return inline;
  if (spec.startsWith("file:"))
    return copyTo(path.resolve(home, spec.slice("file:".length) || "."), home);
  const file = path.resolve(spec);
  if (!fs.existsSync(file))
    throw new Error(
      `no screenshot hook "${spec}": use inline, file:<dir>, or the path of a module`,
    );
  const loaded = (await import(pathToFileURL(file).href)) as {
    default?: unknown;
  };
  if (typeof loaded.default !== "function")
    throw new Error(`${spec} must export a hook as its default: (shot) => url`);
  return loaded.default as Hook;
}

// ── the cache ────────────────────────────────────────────────────────────────

/** What a URL was made from. */
export type Cached = {
  /** hash of the component's source when the screenshot was taken */
  source: string;
  /** the hook, as named on the command line */
  hook: string;
  url: string;
};

/** Per README (its path from the working directory), each snippet's screenshot. */
export type Cache = Record<string, Record<string, Cached>>;

const cacheFile = (dir: string) => path.join(dir, "screenshots.json");

export function readCache(dir = DERIVED): Cache {
  try {
    return JSON.parse(fs.readFileSync(cacheFile(dir), "utf8")) as Cache;
  } catch {
    return {};
  }
}

export function writeCache(cache: Cache, dir = DERIVED) {
  ensureDerived(dir);
  fs.writeFileSync(cacheFile(dir), JSON.stringify(cache, null, 2));
}

// ── deciding what needs a screenshot, and what the hook says ─────────────────

export type Wanted = {
  id: Shot["id"];
  /** the component's source text */
  source: string;
  /** takes the screenshot, to a file, when it is needed */
  take: () => Promise<string | null>;
};

export type Settled = {
  /** by `file > snippet`: the URLs to link */
  urls: Map<string, string>;
  hooked: string[];
  reused: string[];
  /** a hook or a browser that failed, by snippet; the rest went on */
  failed: Map<string, string>;
  /** the cache to keep: entries for these snippets replaced, everything else as it was */
  cache: Record<string, Cached>;
};

const key = ({ file, snippet }: Shot["id"]) => `${file} > ${snippet}`;

/** Whether a cached screenshot still stands for the component: unchanged since, and made by the same hook. */
export const isFresh = (
  source: string,
  before: Cached | undefined,
  spec: string,
  refresh: boolean,
) =>
  !refresh && !!before && before.source === sha(source) && before.hook === spec;

/**
 * For each snippet that wants a screenshot: if the component is unchanged
 * since the cached one (and the same hook made it), reuse the URL without
 * taking a screenshot or calling the hook; otherwise take one and hand it
 * to the hook. `hook` is null when none was asked for: only the cache speaks.
 */
export async function settle(
  wanted: Wanted[],
  cached: Record<string, Cached>,
  hook: { spec: string; run: Hook } | null,
  refresh: boolean,
  scratch: string,
): Promise<Settled> {
  const out: Settled = {
    urls: new Map(),
    hooked: [],
    reused: [],
    failed: new Map(),
    cache: { ...cached },
  };
  for (const w of wanted) {
    const k = key(w.id);
    const source = sha(w.source);
    const before = cached[k];
    if (!hook) {
      // nothing asked for: what is cached still illustrates, as long as the component has not moved on
      if (before && before.source === source) out.urls.set(k, before.url);
      continue;
    }
    if (isFresh(w.source, before, hook.spec, refresh)) {
      out.urls.set(k, before!.url);
      out.reused.push(k);
      continue;
    }
    try {
      const taken = await w.take();
      if (!taken) throw new Error("no screenshot was taken");
      const file = path.join(scratch, imageName(w.id));
      fs.copyFileSync(taken, file);
      const url = await hook.run({
        path: file,
        id: w.id,
        hash: sha(fs.readFileSync(file)),
      });
      if (url === null) {
        delete out.cache[k];
        continue;
      }
      out.urls.set(k, url);
      out.cache[k] = { source, hook: hook.spec, url };
      out.hooked.push(k);
    } catch (e) {
      out.failed.set(k, e instanceof Error ? e.message : String(e));
    }
  }
  return out;
}

// ── the browser ──────────────────────────────────────────────────────────────

export type ShootOptions = {
  server: string;
  route: string;
  timeoutMs: number;
  /** where the PNGs are written */
  dir: string;
  viewport?: { width: number; height: number };
};

export type ToShoot = { key: string; when: "start" | "end" };

/**
 * Opens each snippet's page with `?docs=<when>`, which makes the page
 * photograph what the snippet shows at that moment, and writes the PNGs.
 * Answers the path of each, by key, or why there is none.
 */
export async function shoot(
  list: ToShoot[],
  options: ShootOptions,
): Promise<Map<string, { path: string } | { error: string }>> {
  const results = new Map<string, { path: string } | { error: string }>();
  if (!list.length) return results;
  const { chromium } = await import("playwright");
  const server = options.server.replace(/\/$/, "");
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: options.viewport ?? { width: 800, height: 600 },
      deviceScaleFactor: 1,
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    await context.exposeBinding(DOCS_BINDING, async ({ page }, clip: Clip) =>
      (
        await page.screenshot({
          type: "png",
          clip,
          fullPage: true,
          animations: "disabled",
        })
      ).toString("base64"),
    );
    for (const item of list) {
      const page = await context.newPage();
      try {
        await page.goto(
          `${server}${options.route}/${item.key}?docs=${item.when}`,
        );
        await page.waitForFunction(
          () =>
            window.__sweaterVest !== undefined &&
            window.__sweaterVest.state !== "running",
          undefined,
          { timeout: options.timeoutMs },
        );
        const run = await page.evaluate(() => window.__sweaterVest!);
        const shot = (run as PageResult).captures.find(
          (c) => c.name === DOCS_CAPTURE,
        );
        if (!shot)
          results.set(item.key, {
            error:
              run.state === "failed"
                ? `the test failed before the ${item.when}: ${run.error}`
                : "the page showed nothing to photograph",
          });
        else {
          const file = path.join(options.dir, `${sha(item.key)}.png`);
          fs.writeFileSync(
            file,
            Buffer.from(shot.dataUri.split(",")[1] ?? "", "base64"),
          );
          results.set(item.key, { path: file });
        }
      } catch (e) {
        results.set(item.key, {
          error: e instanceof Error ? e.message.split("\n")[0]! : String(e),
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}
