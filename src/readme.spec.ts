// Generated sections inside a hand-written README: what a re-run may touch,
// and how a rename of a component or snippet is followed.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  begin,
  blocks,
  endOf,
  idText,
  populate,
  rename,
  suggest,
  type Entry,
} from "../release/readme.ts";

const entry = (file: string, snippet: string, markdown = "body"): Entry => ({
  file,
  snippet,
  markdown,
});
const always = () => true;
const never = () => false;

describe("fences", () => {
  it("find each block with its identity", () => {
    const text = `intro\n${begin({ file: "a/B.svelte", snippet: "s" })}\nx\n${endOf({ file: "a/B.svelte", snippet: "s" })}\nafter\n`;
    const [b] = blocks(text);
    expect(idText(b!)).toBe("a/B.svelte > s");
    expect(text.slice(b!.bodyStart, b!.bodyEnd)).toBe("x\n");
  });
  it("refuse a begin that is never ended, or an end that was never begun", () => {
    expect(() => blocks("<!-- sweater-vest:begin a.svelte > s -->\n")).toThrow(
      /never ended/,
    );
    expect(() => blocks("<!-- sweater-vest:end a.svelte > s -->\n")).toThrow(
      /without being begun/,
    );
    expect(() =>
      blocks(
        "<!-- sweater-vest:begin a.svelte > s -->\n<!-- sweater-vest:end a.svelte > t -->\n",
      ),
    ).toThrow(/without being begun/);
  });
  it("ignore a path with spaces no differently", () => {
    const id = { file: "my dir/A B.svelte", snippet: "s" };
    expect(idText(blocks(`${begin(id)}\n${endOf(id)}`)[0]!)).toBe(idText(id));
  });
});

describe("populate", () => {
  it("writes into an empty README", () => {
    const r = populate("", [entry("A.svelte", "one")], always);
    expect(r.added).toEqual(["A.svelte > one"]);
    expect(r.text).toBe(
      "<!-- sweater-vest:begin A.svelte > one -->\nbody\n<!-- sweater-vest:end A.svelte > one -->\n",
    );
  });
  it("appends after the hand-written text, leaving it alone", () => {
    const r = populate("# Mine\n\nwords\n", [entry("A.svelte", "one")], always);
    expect(
      r.text.startsWith("# Mine\n\nwords\n\n<!-- sweater-vest:begin"),
    ).toBe(true);
  });
  it("rewrites only the blocks, never the text around them", () => {
    const first = populate(
      "top\n",
      [entry("A.svelte", "one", "old")],
      always,
    ).text;
    const edited = `${first}\nbottom, written by hand\n`.replace("top", "TOP");
    const r = populate(edited, [entry("A.svelte", "one", "new")], always);
    expect(r.updated).toEqual(["A.svelte > one"]);
    expect(r.text).toBe(edited.replace("old", "new"));
  });
  it("is idempotent", () => {
    const entries = [entry("A.svelte", "one"), entry("B.svelte", "two")];
    const once = populate("hi\n", entries, always);
    const twice = populate(once.text, entries, always);
    expect(twice.text).toBe(once.text);
    expect(twice.unchanged).toHaveLength(2);
    expect(twice.updated.concat(twice.added)).toEqual([]);
  });
  it("puts a new snippet after the last block of its component", () => {
    const base = populate(
      "",
      [entry("A.svelte", "one"), entry("B.svelte", "two")],
      always,
    ).text;
    const r = populate(
      base,
      [
        entry("A.svelte", "one"),
        entry("A.svelte", "extra"),
        entry("B.svelte", "two"),
      ],
      always,
    );
    expect(blocks(r.text).map(idText)).toEqual([
      "A.svelte > one",
      "A.svelte > extra",
      "B.svelte > two",
    ]);
  });
  it("overwrites edits made inside a block", () => {
    const base = populate("", [entry("A.svelte", "one", "real")], always).text;
    const r = populate(
      base.replace("real", "tampered"),
      [entry("A.svelte", "one", "real")],
      always,
    );
    expect(r.text).toBe(base);
  });
  it("reports a block whose snippet is gone, and keeps it", () => {
    const base = populate("", [entry("A.svelte", "one")], always).text;
    const r = populate(base, [], never);
    expect(r.stale).toEqual(["A.svelte > one"]);
    expect(r.text).toBe(base);
  });
  it("does not call a block stale when it merely was not asked for", () => {
    const base = populate("", [entry("A.svelte", "one")], always).text;
    const r = populate(base, [], always);
    expect(r.stale).toEqual([]);
  });
  it("prunes a stale block and the blank line with it, keeping the rest", () => {
    const base = populate(
      "intro\n",
      [entry("A.svelte", "one"), entry("A.svelte", "two")],
      always,
    ).text;
    const r = populate(
      base,
      [entry("A.svelte", "two")],
      (id) => id.snippet !== "one",
      true,
    );
    expect(r.pruned).toEqual(["A.svelte > one"]);
    expect(blocks(r.text).map(idText)).toEqual(["A.svelte > two"]);
    expect(
      r.text.startsWith("intro\n\n<!-- sweater-vest:begin A.svelte > two"),
    ).toBe(true);
    expect(r.text).not.toMatch(/\n\n\n/);
  });
});

describe("rename", () => {
  const base = populate(
    "mine\n",
    [
      entry("old/A.svelte", "one", "[source](old/A.svelte#L1)"),
      entry("old/A.svelte", "two"),
      entry("B.svelte", "one"),
    ],
    always,
  ).text;

  it("moves every block of a renamed file, changing only the fences", () => {
    const r = rename(base, "old/A.svelte", "new/A.svelte");
    expect(r.moved).toEqual([
      "old/A.svelte > one -> new/A.svelte > one",
      "old/A.svelte > two -> new/A.svelte > two",
    ]);
    expect(blocks(r.text).map(idText)).toEqual([
      "new/A.svelte > one",
      "new/A.svelte > two",
      "B.svelte > one",
    ]);
    // the generated body is left for the next populate to refresh
    expect(r.text).toContain("[source](old/A.svelte#L1)");
    expect(r.text.startsWith("mine\n")).toBe(true);
  });
  it("moves one snippet, in or out of its file", () => {
    const r = rename(base, "old/A.svelte > two", "old/A.svelte > deux");
    expect(blocks(r.text).map(idText)).toEqual([
      "old/A.svelte > one",
      "old/A.svelte > deux",
      "B.svelte > one",
    ]);
    const moved = rename(base, "old/A.svelte > two", "C.svelte > two");
    expect(blocks(moved.text).map(idText)[1]).toBe("C.svelte > two");
  });
  it("lets the next populate carry on under the new name, refreshing the body", () => {
    const moved = rename(base, "old/A.svelte", "new/A.svelte").text;
    const r = populate(
      moved,
      [
        entry("new/A.svelte", "one", "fresh"),
        entry("new/A.svelte", "two"),
        entry("B.svelte", "one"),
      ],
      always,
    );
    expect(r.added).toEqual([]);
    expect(r.updated).toEqual(["new/A.svelte > one"]);
    expect(r.text).toContain("fresh");
    expect(r.text).not.toContain("old/A.svelte");
  });
  it("refuses a name that already has a block, a mixed target, or nothing to move", () => {
    expect(() => rename(base, "old/A.svelte > one", "B.svelte > one")).toThrow(
      /already has a block/,
    );
    expect(() => rename(base, "old/A.svelte > one", "B.svelte")).toThrow(
      /both sides/,
    );
    expect(() => rename(base, "nope.svelte", "x.svelte")).toThrow(
      /no generated block/,
    );
  });
});

describe("suggest", () => {
  const all = [
    { file: "New.svelte", snippet: "one" },
    { file: "Old.svelte", snippet: "fresh" },
    { file: "Old.svelte", snippet: "kept" },
  ];
  const hasBlock = (id: { snippet: string }) => id.snippet === "kept";
  it("offers the same snippet in another file, and unclaimed snippets of the same file", () => {
    expect(
      suggest({ file: "Old.svelte", snippet: "one" }, all, hasBlock).map(
        idText,
      ),
    ).toEqual(["New.svelte > one", "Old.svelte > fresh"]);
  });
});

describe("the command", { timeout: 60_000 }, () => {
  let dir: string;
  const cli = path.resolve(import.meta.dirname, "../release/cli.ts");
  const run = (...args: string[]) =>
    execFileSync("node", [cli, ...args], {
      cwd: path.resolve(import.meta.dirname, ".."),
      encoding: "utf8",
    });
  beforeEach(() => {
    const root = path.resolve(import.meta.dirname, "..");
    dir = fs.mkdtempSync(path.join(root, "src/lib/.readme-spec-"));
    fs.copyFileSync(
      path.join(root, "src/lib/examples/Counter.svelte"),
      path.join(dir, "Counter.svelte"),
    );
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));
  // a component renamed on disk, with the self-import its snippets rely on
  const renameCounter = () => {
    const from = path.join(dir, "Counter.svelte");
    fs.writeFileSync(
      path.join(dir, "Tally.svelte"),
      fs
        .readFileSync(from, "utf8")
        .replaceAll("Counter.svelte", "Tally.svelte"),
    );
    fs.rmSync(from);
  };

  it("populates, is stable, follows a file rename, and flags a vanished component", () => {
    const readme = path.join(dir, "README.md");
    fs.writeFileSync(readme, "# Mine\n");
    run(dir, "--readme", readme);
    const first = fs.readFileSync(readme, "utf8");
    expect(first.startsWith("# Mine\n")).toBe(true);
    expect(first).toContain(
      "<!-- sweater-vest:begin Counter.svelte > binds -->",
    );
    expect(first).toContain("[source](Counter.svelte#L");
    expect(run(dir, "--readme", readme)).toContain("up to date");

    // the component is renamed: its blocks go stale, and the tool says where they went
    renameCounter();
    const stale = run(dir, "--readme", readme);
    expect(stale).toContain("stale    Counter.svelte > binds");
    expect(stale).toContain("added     Tally.svelte > binds");
    expect(stale).toContain(
      '--from "Counter.svelte > binds" --to "Tally.svelte > binds"',
    );
  });

  it("migrates blocks so a rename leaves hand-written text and the other blocks alone", () => {
    const readme = path.join(dir, "README.md");
    fs.writeFileSync(readme, "# Mine\n\nnotes\n");
    run(dir, "--readme", readme);
    renameCounter();
    run(
      "--migrate",
      readme,
      "--from",
      "Counter.svelte",
      "--to",
      "Tally.svelte",
    );
    const out = run(dir, "--readme", readme);
    expect(out).not.toContain("stale");
    expect(out).not.toMatch(/added/);
    const text = fs.readFileSync(readme, "utf8");
    expect(text).not.toContain("Counter.svelte");
    expect(text).toContain("[source](Tally.svelte#L");
    expect(text.startsWith("# Mine\n\nnotes\n")).toBe(true);
  });

  it("prunes what is gone, and --marked writes only marked snippets", () => {
    const readme = path.join(dir, "README.md");
    run(dir, "--readme", readme, "--marked");
    const marked = blocks(fs.readFileSync(readme, "utf8")).map(idText);
    expect(marked).toEqual(["Counter.svelte > binds"]);
    fs.rmSync(path.join(dir, "Counter.svelte"));
    fs.copyFileSync(
      path.resolve(import.meta.dirname, "lib/examples/Badge.svelte"),
      path.join(dir, "Badge.svelte"),
    );
    run(dir, "--readme", readme, "--prune");
    const after = blocks(fs.readFileSync(readme, "utf8")).map(idText);
    expect(after).not.toContain("Counter.svelte > binds");
    expect(after.every((id) => id.startsWith("Badge.svelte"))).toBe(true);
  });
});
