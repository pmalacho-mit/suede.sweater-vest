// Screenshots for the documentation: the marker that asks for one, the hooks
// that turn a file into a URL, the cache that keeps a hook from firing for a
// component that has not changed, and the whole command around them.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

import {
  markdownOf,
  readMarker,
  type Documented,
} from "../release/document.ts";
import {
  copyTo,
  imageName,
  inline,
  isFresh,
  readCache,
  resolveHook,
  settle,
  sha,
  writeCache,
  type Cached,
  type Hook,
  type Wanted,
} from "../release/screenshots.ts";

const root = path.resolve(import.meta.dirname, "..");
const browserThere = fs.existsSync(chromium.executablePath());
let tmp: string;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "shots-spec-"));
});
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

const png = (name: string, bytes = "png") => {
  const file = path.join(tmp, name);
  fs.writeFileSync(file, bytes);
  return file;
};

describe("the marker", () => {
  it("is @docs, alone or with a description", () => {
    expect(readMarker("@docs")).toEqual({
      marked: true,
      screenshot: null,
      text: "",
    });
    expect(readMarker("@docs: counts up")).toEqual({
      marked: true,
      screenshot: null,
      text: "counts up",
    });
    expect(readMarker("just a comment")).toEqual({
      marked: false,
      screenshot: null,
      text: "just a comment",
    });
  });
  it("asks for a screenshot at the start, unless it says the end", () => {
    expect(readMarker("@docs screenshot").screenshot).toBe("start");
    expect(readMarker("@docs screenshot=start: x").screenshot).toBe("start");
    expect(readMarker("@docs screenshot=end: counts up")).toEqual({
      marked: true,
      screenshot: "end",
      text: "counts up",
    });
  });
  it("does not take a description that merely begins with the word", () => {
    expect(readMarker("@docs screenshots of it")).toMatchObject({
      screenshot: null,
    });
    expect(readMarker("@docs: screenshot taken here")).toMatchObject({
      screenshot: null,
      text: "screenshot taken here",
    });
  });
});

describe("the image in the markdown", () => {
  const doc: Documented = {
    name: "A > s",
    snippet: "s",
    description: "says",
    marked: true,
    screenshot: "start",
    line: 3,
    usage: "<A />\n",
    verifiedBy: null,
  };
  it("sits between the description and the usage", () => {
    const md = markdownOf(doc, 2, "A.svelte", "A.s", "shots/A.s.png");
    expect(md).toContain("says\n\n![A.s](shots/A.s.png)\n\n```svelte");
  });
  it("is left out without a URL, and wrapped when the URL has spaces", () => {
    expect(markdownOf(doc, 2)).not.toContain("![");
    expect(
      markdownOf(doc, 2, undefined, "A.s", "my shots/a (1).png"),
    ).toContain("![A.s](<my shots/a (1).png>)");
  });
});

describe("the built-in hooks", () => {
  const id = { file: "lib/Counter.svelte", snippet: "binds" };
  it("name the image after the component's folder, file and snippet", () => {
    expect(imageName(id)).toBe("lib.Counter.binds.png");
  });
  it("inline answers a data URI of the bytes", () => {
    const file = png("a.png", "hello");
    expect(inline({ path: file, id, hash: "h" })).toBe(
      `data:image/png;base64,${Buffer.from("hello").toString("base64")}`,
    );
  });
  it("file: copies into the folder and answers a path from the README", () => {
    const home = path.join(tmp, "docs");
    const url = copyTo(
      path.join(home, "img"),
      home,
    )({
      path: png("a.png", "bytes"),
      id,
      hash: "h",
    });
    expect(url).toBe("img/lib.Counter.binds.png");
    expect(fs.readFileSync(path.join(home, url as string), "utf8")).toBe(
      "bytes",
    );
  });
});

describe("resolving a hook", () => {
  it("finds the built-ins by name, with file: relative to the README's folder", async () => {
    expect(await resolveHook("inline", tmp)).toBe(inline);
    const hook = await resolveHook("file:out", tmp);
    const url = await hook({
      path: png("a.png"),
      id: { file: "A.svelte", snippet: "s" },
      hash: "h",
    });
    expect(url).toBe("out/A.s.png");
    expect(fs.existsSync(path.join(tmp, "out/A.s.png"))).toBe(true);
  });
  it("loads a module's default export, which may be async", async () => {
    const file = path.join(tmp, "hook.mjs");
    fs.writeFileSync(
      file,
      "export default async ({ id, hash }) => `https://cdn/${id.snippet}-${hash}.png`;",
    );
    const hook = await resolveHook(file, tmp);
    expect(
      await hook({
        path: "x",
        id: { file: "A.svelte", snippet: "s" },
        hash: "abc",
      }),
    ).toBe("https://cdn/s-abc.png");
  });
  it("says what is wrong with a hook that is missing, or exports no function", async () => {
    await expect(resolveHook(path.join(tmp, "nope.mjs"), tmp)).rejects.toThrow(
      /no screenshot hook/,
    );
    const file = path.join(tmp, "bad.mjs");
    fs.writeFileSync(file, "export default 3;");
    await expect(resolveHook(file, tmp)).rejects.toThrow(/default/);
  });
});

describe("the cache", () => {
  it("round-trips, and reads as empty when there is none or it is garbage", () => {
    expect(readCache(tmp)).toEqual({});
    const cache = {
      "R.md": { "A.svelte > s": { source: "1", hook: "inline", url: "u" } },
    };
    writeCache(cache, tmp);
    expect(readCache(tmp)).toEqual(cache);
    fs.writeFileSync(path.join(tmp, "screenshots.json"), "{nope");
    expect(readCache(tmp)).toEqual({});
  });
  it("is fresh for the same component and hook, and not otherwise", () => {
    const entry: Cached = { source: sha("v1"), hook: "inline", url: "u" };
    expect(isFresh("v1", entry, "inline", false)).toBe(true);
    expect(isFresh("v2", entry, "inline", false)).toBe(false);
    expect(isFresh("v1", entry, "file:x", false)).toBe(false);
    expect(isFresh("v1", entry, "inline", true)).toBe(false);
    expect(isFresh("v1", undefined, "inline", false)).toBe(false);
  });
});

describe("settling screenshots", () => {
  const id = { file: "A.svelte", snippet: "s" };
  const K = "A.svelte > s";
  const wanted = (source = "v1") => {
    const taken: string[] = [];
    const w: Wanted = {
      id,
      source,
      take: async () => {
        taken.push("shot");
        return png("taken.png", "pixels");
      },
    };
    return { w, taken };
  };
  const counting = (url: string | null = "https://cdn/a.png") => {
    const seen: { hash: string; file: string }[] = [];
    const run: Hook = (shot) => {
      seen.push({ hash: shot.hash, file: path.basename(shot.path) });
      return url;
    };
    return { hook: { spec: "mine", run }, seen };
  };

  it("takes the shot and fires the hook the first time, and remembers", async () => {
    const { w, taken } = wanted();
    const { hook, seen } = counting();
    const r = await settle([w], {}, hook, false, tmp);
    expect(r.urls.get(K)).toBe("https://cdn/a.png");
    expect(r.hooked).toEqual([K]);
    expect(taken).toHaveLength(1);
    expect(seen).toEqual([{ hash: sha("pixels"), file: "A.s.png" }]);
    expect(r.cache[K]).toEqual({
      source: sha("v1"),
      hook: "mine",
      url: "https://cdn/a.png",
    });
  });
  it("neither shoots nor fires for a component that has not changed", async () => {
    const first = await settle([wanted().w], {}, counting().hook, false, tmp);
    const { w, taken } = wanted();
    const { hook, seen } = counting("https://cdn/OTHER.png");
    const again = await settle([w], first.cache, hook, false, tmp);
    expect(again.urls.get(K)).toBe("https://cdn/a.png");
    expect(again.reused).toEqual([K]);
    expect(taken).toEqual([]);
    expect(seen).toEqual([]);
  });
  it("fires again when the component changes, the hook changes, or a refresh is asked", async () => {
    const first = await settle([wanted().w], {}, counting().hook, false, tmp);
    for (const [source, spec, refresh] of [
      ["v2", "mine", false],
      ["v1", "theirs", false],
      ["v1", "mine", true],
    ] as const) {
      const { w, taken } = wanted(source);
      const { hook, seen } = counting("https://cdn/new.png");
      const r = await settle([w], first.cache, { ...hook, spec }, refresh, tmp);
      expect(r.urls.get(K)).toBe("https://cdn/new.png");
      expect(taken).toHaveLength(1);
      expect(seen).toHaveLength(1);
    }
  });
  it("with no hook asked for, uses the cache while the component stands, and takes no shot", async () => {
    const first = await settle([wanted().w], {}, counting().hook, false, tmp);
    const same = wanted();
    expect(
      (await settle([same.w], first.cache, null, false, tmp)).urls.get(K),
    ).toBe("https://cdn/a.png");
    expect(same.taken).toEqual([]);
    const moved = wanted("v2");
    expect(
      (await settle([moved.w], first.cache, null, false, tmp)).urls.has(K),
    ).toBe(false);
  });
  it("leaves a snippet without an image when the hook says null, and forgets the old one", async () => {
    const first = await settle([wanted().w], {}, counting().hook, false, tmp);
    const r = await settle(
      [wanted("v2").w],
      first.cache,
      counting(null).hook,
      false,
      tmp,
    );
    expect(r.urls.has(K)).toBe(false);
    expect(r.cache[K]).toBeUndefined();
    expect(r.failed.size).toBe(0);
  });
  it("reports a hook or a browser that fails, and carries on with the others", async () => {
    const boom: Hook = () => {
      throw new Error("upload refused");
    };
    const other = {
      id: { file: "B.svelte", snippet: "t" },
      source: "b",
      take: async () => png("b.png"),
    };
    const r = await settle(
      [wanted().w, other],
      {},
      { spec: "x", run: boom },
      false,
      tmp,
    );
    expect(r.failed.get(K)).toBe("upload refused");
    const noShot: Wanted = { id, source: "v1", take: async () => null };
    const r2 = await settle([noShot], {}, counting().hook, false, tmp);
    expect(r2.failed.get(K)).toMatch(/no screenshot was taken/);
    expect(r2.urls.size).toBe(0);
  });
  it("keeps the cache entries of snippets it was not asked about", async () => {
    const elsewhere: Cached = { source: "z", hook: "mine", url: "keep" };
    const r = await settle(
      [wanted().w],
      { "Z.svelte > z": elsewhere },
      counting().hook,
      false,
      tmp,
    );
    expect(r.cache["Z.svelte > z"]).toEqual(elsewhere);
  });
});

describe("the command, without a browser", { timeout: 60_000 }, () => {
  const cli = path.join(root, "release/cli.ts");
  let dir: string;
  let derived: string;
  const run = (...args: string[]) =>
    execFileSync("node", [cli, ...args], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, SWEATER_VEST_DIR: derived },
    });
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(root, "src/lib/shots-spec-"));
    derived = path.join(tmp, "derived");
    fs.copyFileSync(
      path.join(root, "src/lib/examples/Counter.svelte"),
      path.join(dir, "Counter.svelte"),
    );
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const readme = () => path.join(dir, "README.md");
  const seed = (url: string, source: string, hook = "inline") => {
    const key = path.relative(root, readme()).split(path.sep).join("/");
    writeCache(
      {
        [key]: { "Counter.svelte > binds": { source: sha(source), hook, url } },
      },
      derived,
    );
  };

  it("links a cached screenshot, with no flag and no browser", () => {
    seed(
      "shots/binds.png",
      fs.readFileSync(path.join(dir, "Counter.svelte"), "utf8"),
    );
    run(dir, "--readme", readme(), "--marked");
    expect(fs.readFileSync(readme(), "utf8")).toContain(
      "![Counter.binds](shots/binds.png)",
    );
  });
  it("drops the image once the component has changed, rather than show a stale one", () => {
    const source = fs.readFileSync(path.join(dir, "Counter.svelte"), "utf8");
    seed("shots/binds.png", source);
    run(dir, "--readme", readme(), "--marked");
    fs.appendFileSync(path.join(dir, "Counter.svelte"), "\n<!-- edited -->\n");
    run(dir, "--readme", readme(), "--marked");
    expect(fs.readFileSync(readme(), "utf8")).not.toContain("![");
  });
  it("does not photograph again, nor need a server, while the component is unchanged", () => {
    seed(
      "shots/binds.png",
      fs.readFileSync(path.join(dir, "Counter.svelte"), "utf8"),
      "inline",
    );
    const out = run(
      dir,
      "--readme",
      readme(),
      "--marked",
      "--screenshots",
      "inline",
      "--server",
      "http://localhost:1",
    );
    expect(out).toContain("unchanged Counter.svelte > binds");
    expect(fs.readFileSync(readme(), "utf8")).toContain(
      "![Counter.binds](shots/binds.png)",
    );
  });
  it.skipIf(!browserThere)(
    "says so, and still writes the docs, when there is no server to photograph from",
    () => {
      let err = "";
      try {
        run(
          dir,
          "--readme",
          readme(),
          "--marked",
          "--screenshots",
          "inline",
          "--server",
          "http://localhost:1",
        );
      } catch (e) {
        err = String((e as { stderr?: string }).stderr ?? e);
      }
      const text = fs.existsSync(readme())
        ? fs.readFileSync(readme(), "utf8")
        : "";
      expect(err + text).toMatch(
        /no screenshot for Counter.svelte > binds|sweater-vest:begin/,
      );
      if (text) expect(text).not.toContain("![");
    },
  );
  it("forgets a pruned block's screenshot", () => {
    seed(
      "shots/binds.png",
      fs.readFileSync(path.join(dir, "Counter.svelte"), "utf8"),
    );
    run(dir, "--readme", readme(), "--marked");
    fs.rmSync(path.join(dir, "Counter.svelte"));
    run(dir, "--readme", readme(), "--prune");
    const key = path.relative(root, readme()).split(path.sep).join("/");
    expect(readCache(derived)[key]).toEqual({});
  });
});

// With a dev server running (`SWEATER_VEST_E2E_SERVER=http://localhost:5199 npx vitest`), the real thing:
// a browser, the page's own screenshot, and a hook of the user's.
const server = process.env.SWEATER_VEST_E2E_SERVER;
describe.skipIf(!server || !browserThere)("the command, in a browser", () => {
  const cli = path.join(root, "release/cli.ts");
  it("photographs a marked snippet, hands it to the user's hook, and links the URL", () => {
    const dir = fs.mkdtempSync(path.join(root, "src/lib/shots-e2e-"));
    const derived = path.join(tmp, "derived");
    try {
      fs.copyFileSync(
        path.join(root, "src/lib/examples/Counter.svelte"),
        path.join(dir, "Counter.svelte"),
      );
      const hook = path.join(tmp, "hook.mjs");
      fs.writeFileSync(
        hook,
        `import fs from "node:fs";
export default ({ path, id, hash }) => {
  const head = fs.readFileSync(path).subarray(1, 4).toString();
  return \`https://cdn.example/\${id.snippet}-\${head}-\${hash}.png\`;
};`,
      );
      const readme = path.join(dir, "README.md");
      const run = () =>
        execFileSync(
          "node",
          [
            cli,
            dir,
            "--readme",
            readme,
            "--marked",
            "--screenshots",
            hook,
            "--server",
            server!,
          ],
          {
            cwd: root,
            encoding: "utf8",
            env: { ...process.env, SWEATER_VEST_DIR: derived },
          },
        );
      const first = run();
      expect(first).toContain("shot     Counter.svelte > binds");
      // the hook saw a real PNG
      expect(fs.readFileSync(readme, "utf8")).toMatch(
        /!\[Counter\.binds\]\(https:\/\/cdn\.example\/binds-PNG-[0-9a-f]{16}\.png\)/,
      );
      // and the component being unchanged, it is not asked again
      expect(run()).toContain("unchanged Counter.svelte > binds");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});
