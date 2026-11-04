#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import { cli, main } from "./vendored/typescript-cli-suede/index.ts";
import {
  analyze,
  hasTest,
  isGeneratable,
  type Analysis,
} from "./vite-plugin/analyze.ts";
import { generate } from "./vite-plugin/generate.ts";
import { scrub } from "./vite-plugin/scrub.ts";
import {
  collectorFor,
  componentsFile,
  runtimeFile,
} from "./vite-plugin/plugin.ts";
import { generatedId, posix, stemOf, testName } from "./vite-plugin/names.ts";
import { SUFFIX, extract, extracted, tempPathFor } from "./extract.ts";
import { document, markdownForComponent, markdownOf } from "./document.ts";
import {
  populate,
  rename,
  suggest,
  blocks,
  idText,
  type Id,
} from "./readme.ts";

import type {
  Expect,
  Invoke,
  Table,
} from "../suede.nests.sweater-vest/dsl.import.meta.vitest.ts";

const DESCRIPTION = [
  "Print a component's test snippet as a standalone test component.",
  "",
  "  cli.ts <component> <snippet>       the generated test component, as it would be extracted",
  "  cli.ts <component> <snippet> --extract   write it beside the component, as <Component>.<snippet>.temp.svelte",
  "  cli.ts <component> --list          the component's test snippets, as JSON",
  "  cli.ts <component> --collector     the component as Vitest is handed it",
  "  cli.ts --clean-extracted [dir]     delete extracted tests under dir (default: the working directory)",
  "  cli.ts <component|dir> [snippet] --markdown [--marked] [--source-base URL] [--header-level N]   the snippets as documentation, for a README",
  "  cli.ts [dir] --readme <README.md> [--marked] [--prune]   write the snippets into a README, between fences that name them",
  "  cli.ts --migrate <README.md> --from <path[ > snippet]> --to <path[ > snippet]>   follow a renamed component or snippet",
].join("\n");

/** What was asked for, read off an argv; kept apart from acting on it so it can be tested without a process. */
const parse = (argv: string[]) => {
  const args = main(argv, DESCRIPTION, [
    cli.flag(
      "list",
      "Print the component's test snippets as JSON, instead of one test.",
      false,
    ),
    cli.flag(
      "collector",
      "Print the component as Vitest is handed it: scrubbed, with the collector.",
      false,
    ),
    cli.flag(
      "extract",
      "Write the generated test beside the component instead of printing it, and print its path.",
      false,
    ),
    cli.flag(
      "markdown",
      "Print the snippets as documentation: the usage, then what verifies it. A directory documents every component under it.",
      false,
    ),
    cli.flag(
      "marked",
      "With --markdown, document only snippets whose comment opens with @docs (<!-- @docs: what it shows -->).",
      false,
    ),
    cli.flag(
      "source-base",
      "With --markdown, the link target for a component's file is this prefix plus its path relative to the working directory (default: the path alone, so a link from a README at the working directory works).",
    ),
    cli.flag(
      "readme",
      "Write the snippets into this README, each between fences naming its component and snippet, so a re-run rewrites only those. Documents the components under the positional directory (default: the README's).",
    ),
    cli.flag(
      "prune",
      "With --readme, remove blocks whose component or snippet is gone (they are otherwise reported and kept).",
      false,
    ),
    cli.flag(
      "migrate",
      "A README whose generated blocks should follow a rename: with --from and --to, rewrites only their fences.",
    ),
    cli.flag(
      "from",
      "With --migrate, the old component path, or 'path > snippet'.",
    ),
    cli.flag("to", "With --migrate, the new one."),
    cli.flag(
      ["header-level", "h"],
      "The heading level of a component in the Markdown; its snippets sit one below.",
      2,
    ),
    cli.flag(
      "tsconfig",
      "The tsconfig file name, found upward from the working directory.",
    ),
    cli.flag(
      "clean-extracted",
      "Delete extracted tests, searched for recursively from the positional directory argument (default: the current working directory). One edited since it was extracted is kept, unless --force.",
      false,
    ),
    cli.flag(
      "force",
      "With --clean-extracted, delete edited extracts too.",
      false,
    ),
  ]);
  return {
    file: args[0],
    snippet: args[1],
    readme: args.readme,
    prune: args.prune,
    migrate: args.migrate,
    from: args.from,
    to: args.to,
    mode: args.migrate
      ? "migrate"
      : args.readme
        ? "readme"
        : args.list
          ? "list"
          : args.collector
            ? "collector"
            : args["clean-extracted"]
              ? "clean"
              : args.extract
                ? "extract"
                : args.markdown
                  ? "markdown"
                  : "test",
    tsconfig: args.tsconfig ?? "tsconfig.json",
    headerLevel: args["header-level"],
    marked: args.marked,
    sourceBase: args["source-base"],
    force: args.force,
    help: args.help,
  } as const;
};

type Parsed = ReturnType<typeof parse>;

declare namespace parse {
  /** a component and a snippet: the test, as it would be extracted */
  export type Test = Expect<
    Invoke<typeof parse, [argv: ["src/A.svelte", "simple"]]>,
    "matches",
    { file: "src/A.svelte"; snippet: "simple"; mode: "test" }
  >;

  /** the listing and the collector need no snippet named */
  export type Modes = Table<
    typeof parse,
    [
      [
        args: [["src/A.svelte", "--list"]],
        condition: "matches",
        expected: { file: "src/A.svelte"; mode: "list" },
      ],
      [
        args: [["--collector", "src/A.svelte"]],
        condition: "matches",
        expected: { file: "src/A.svelte"; mode: "collector" },
      ],
      [
        args: [["--clean-extracted"]],
        condition: "matches",
        expected: { file: undefined; mode: "clean"; force: false },
      ],
      [
        args: [["--clean-extracted", "src", "--force"]],
        condition: "matches",
        expected: { file: "src"; mode: "clean"; force: true },
      ],
      [
        args: [["src/A.svelte", "s", "--extract"]],
        condition: "matches",
        expected: { snippet: "s"; mode: "extract" },
      ],
    ]
  >;
}

const SKIPPED = new Set(["node_modules", "dist", "build", "coverage"]);

function* extractsUnder(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const at = path.join(dir, entry.name);
    if (
      entry.isDirectory() &&
      !entry.name.startsWith(".") &&
      !SKIPPED.has(entry.name)
    )
      yield* extractsUnder(at);
    else if (entry.isFile() && entry.name.endsWith(SUFFIX)) yield at;
  }
}

type Verdict = "delete" | "keep" | "ignore";

const verdict = (file: { edited: boolean } | null, force: boolean): Verdict =>
  !file ? "ignore" : file.edited && !force ? "keep" : "delete";

declare namespace verdict {
  export type Rules = Table<
    typeof verdict,
    [
      [args: [file: null, force: true], expected: "ignore"],
      [args: [file: { edited: false }, force: false], expected: "delete"],
      [args: [file: { edited: true }, force: false], expected: "keep"],
      [args: [file: { edited: true }, force: true], expected: "delete"],
    ]
  >;
}

const shown = (file: string) => path.relative(process.cwd(), file);

const report = {
  delete: (file: string) => console.log(`deleted  ${shown(file)}`),
  keep: (file: string) =>
    console.log(
      `kept     ${shown(file)} — edited since it was extracted (--force to delete it too)`,
    ),
  ignore: () => {},
};

function cleanExtracted(dir: string, force: boolean) {
  for (const file of extractsUnder(dir)) {
    const decided = verdict(extracted(fs.readFileSync(file, "utf8")), force);
    if (decided === "delete") fs.rmSync(file);
    report[decided](file);
  }
}

const loaded = (file: string): Analysis => {
  const abs = path.resolve(file);
  return analyze(abs, fs.readFileSync(abs, "utf8"));
};

/** What the editor wants to know about each snippet. */
export const listing = (analysis: Analysis) =>
  analysis.snippets.map((s) => ({
    name: testName(analysis.file, s.name),
    snippet: s.name,
    line: s.line,
    test: hasTest(s),
    generatable: isGeneratable(s),
    key: `${posix(path.relative(process.cwd(), analysis.file)).replace(/\.svelte$/, "")}/${s.name}`,
    params: s.params,
  }));

async function printTest(
  analysis: Analysis,
  name: string,
  tsconfig: string,
  at?: string,
) {
  const snippet = analysis.snippets.find((s) => s.name === name);
  if (!snippet)
    throw new Error(`no test snippet named ${name} in ${shown(analysis.file)}`);
  if (!isGeneratable(snippet))
    throw new Error(
      `${name} has a parameter the plugin cannot hand in; see its warning`,
    );
  // the type checker is only loaded when a pocket needs its initial value read
  const { pocketValues } = await import("./vite-plugin/pocket-values.ts");
  const pockets = pocketValues(process.cwd(), tsconfig).forSnippet(
    analysis,
    snippet,
  );
  return generate(analysis, snippet, {
    runtime: runtimeFile,
    components: componentsFile,
    pockets,
    ...(at ? { at } : {}),
  }).code;
}

async function writeExtracted(
  analysis: Analysis,
  name: string,
  tsconfig: string,
) {
  const target = tempPathFor(analysis.file, name);
  const body = await printTest(analysis, name, tsconfig, target);
  fs.writeFileSync(target, extract(shown(analysis.file), name, body));
  return `${shown(target)}\n`;
}

async function printMarkdown(
  target: string,
  snippet: string | undefined,
  level: number,
  tsconfig: string,
  marked: boolean,
  sourceBase: string | undefined,
) {
  const { pocketValues } = await import("./vite-plugin/pocket-values.ts");
  const values = pocketValues(process.cwd(), tsconfig);
  const root = path.resolve(target);
  const components = fs.statSync(root).isDirectory()
    ? [...componentsUnder(root)]
    : [root];
  const sections: string[] = [];
  for (const file of components) {
    const analysis = analyze(file, fs.readFileSync(file, "utf8"));
    const snippets = analysis.snippets.filter(
      (s) => isGeneratable(s) && (!snippet || s.name === snippet),
    );
    if (snippet && !snippets.length)
      throw new Error(`no test snippet named ${snippet} in ${shown(file)}`);
    const docs = snippets
      .map((s) => {
        const pockets = new Map(
          [...values.forSnippet(analysis, s)].map(([name, value]) => [
            name,
            value.members,
          ]),
        );
        return document(analysis, s, { components: componentsFile, pockets });
      })
      .filter((d) => !marked || d.marked);
    if (!docs.length) continue;
    const rel = posix(path.relative(process.cwd(), file));
    const link =
      sourceBase === undefined
        ? rel
        : `${sourceBase.replace(/\/$/, "")}/${rel}`;
    sections.push(
      snippet
        ? markdownOf(docs[0]!, level, link)
        : markdownForComponent(analysis, docs, level, link),
    );
  }
  return `${sections.join("\n")}`;
}

/** Writes the snippets under `target` into a README, between fences; says what changed. */
async function populateReadme(
  readme: string,
  target: string | undefined,
  level: number,
  tsconfig: string,
  marked: boolean,
  prune: boolean,
  sourceBase: string | undefined,
  snippet: string | undefined,
) {
  const { pocketValues } = await import("./vite-plugin/pocket-values.ts");
  const values = pocketValues(process.cwd(), tsconfig);
  const home = path.dirname(path.resolve(readme));
  const root = path.resolve(target ?? home);
  const components = fs.statSync(root).isDirectory()
    ? [...componentsUnder(root)]
    : [root];
  const analyses = new Map<string, Analysis>();
  const load = (file: string) => {
    const abs = path.resolve(file);
    if (!analyses.has(abs))
      analyses.set(abs, analyze(abs, fs.readFileSync(abs, "utf8")));
    return analyses.get(abs)!;
  };
  const idOf = (file: string, name: string): Id => ({
    file: posix(path.relative(home, file)),
    snippet: name,
  });
  const entries = [];
  const all: Id[] = [];
  for (const file of components) {
    const analysis = load(file);
    for (const s of analysis.snippets) {
      if (!isGeneratable(s)) continue;
      all.push(idOf(file, s.name));
      if (snippet && s.name !== snippet) continue;
      const pockets = new Map(
        [...values.forSnippet(analysis, s)].map(([name, value]) => [
          name,
          value.members,
        ]),
      );
      const doc = document(analysis, s, {
        components: componentsFile,
        pockets,
      });
      if (marked && !doc.marked) continue;
      const id = idOf(file, s.name);
      const link = sourceBase
        ? `${sourceBase.replace(/\/$/, "")}/${posix(path.relative(process.cwd(), file))}`
        : id.file;
      entries.push({
        ...id,
        markdown: markdownOf(doc, level, link, `${stemOf(file)}.${s.name}`),
      });
    }
  }
  if (snippet && !entries.length)
    throw new Error(`no test snippet named ${snippet} under ${shown(root)}`);
  const existing = fs.existsSync(readme) ? fs.readFileSync(readme, "utf8") : "";
  const exists = (id: Id) => {
    const file = path.join(home, id.file);
    return (
      fs.existsSync(file) &&
      load(file).snippets.some((s) => s.name === id.snippet)
    );
  };
  const result = populate(existing, entries, exists, prune);
  if (result.text !== existing) fs.writeFileSync(readme, result.text);
  const said = (verb: string, ids: string[]) =>
    ids.forEach((id) => console.log(`${verb} ${id}`));
  said("added    ", result.added);
  said("updated  ", result.updated);
  said("pruned   ", result.pruned);
  const hasBlock = (id: Id) =>
    blocks(result.text).some((b) => idText(b) === idText(id));
  for (const key of result.stale) {
    const [old] = blocks(existing).filter((b) => idText(b) === key);
    console.log(`stale    ${key} — its snippet is gone (--prune removes it)`);
    for (const to of old ? suggest(old, all, hasBlock) : [])
      console.log(
        `         moved? cli.ts --migrate ${readme} --from "${key}" --to "${idText(to)}"`,
      );
  }
  if (!result.added.length && !result.updated.length && !result.pruned.length)
    console.log(`${readme} is up to date`);
}

function migrateReadme(readme: string, from: string, to: string) {
  const { text, moved } = rename(fs.readFileSync(readme, "utf8"), from, to);
  fs.writeFileSync(readme, text);
  for (const m of moved) console.log(`moved    ${m}`);
  console.log(`run --readme ${readme} to refresh what they say`);
}

// every component with snippets under a directory
function* componentsUnder(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const at = path.join(dir, entry.name);
    if (
      entry.isDirectory() &&
      !entry.name.startsWith(".") &&
      !SKIPPED.has(entry.name)
    )
      yield* componentsUnder(at);
    else if (
      entry.isFile() &&
      entry.name.endsWith(".svelte") &&
      !entry.name.endsWith(".vest.svelte") &&
      !entry.name.endsWith(SUFFIX)
    )
      if (fs.readFileSync(at, "utf8").includes("import.meta.vitest")) yield at;
  }
}

const printCollector = (analysis: Analysis) => {
  const ids = analysis.snippets
    .filter(isGeneratable)
    .map((s) => generatedId(analysis.file, s.name));
  return scrub(analysis, ids.length ? collectorFor(analysis.file, ids) : null)
    .code;
};

async function run({
  file,
  snippet,
  mode,
  tsconfig,
  force,
  help,
  headerLevel,
  marked,
  sourceBase,
  readme,
  prune,
  migrate,
  from,
  to,
}: Parsed) {
  if (mode === "clean") return cleanExtracted(path.resolve(file ?? "."), force);
  if (mode === "migrate") {
    if (!from || !to) {
      console.error("--migrate needs --from and --to");
      process.exit(2);
    }
    return migrateReadme(migrate!, from, to);
  }
  if (mode === "readme")
    return populateReadme(
      readme!,
      file,
      headerLevel,
      tsconfig,
      marked,
      prune,
      sourceBase,
      snippet,
    );
  if (mode === "markdown" && file)
    return void process.stdout.write(
      await printMarkdown(
        file,
        snippet,
        headerLevel,
        tsconfig,
        marked,
        sourceBase,
      ),
    );
  if (!file || ((mode === "test" || mode === "extract") && !snippet)) {
    console.error(help());
    process.exit(2);
  }
  const analysis = loaded(file);
  for (const w of analysis.warnings)
    console.error(
      `${shown(analysis.file)}:${w.line + 1}:${w.column + 1} ${w.severity}: ${w.message}`,
    );
  const text =
    mode === "list"
      ? `${JSON.stringify(listing(analysis), null, 2)}\n`
      : mode === "collector"
        ? printCollector(analysis)
        : mode === "extract"
          ? await writeExtracted(analysis, snippet!, tsconfig)
          : await printTest(analysis, snippet!, tsconfig);
  process.stdout.write(text);
}

if (cli.entry(import.meta.url)) await run(parse(process.argv.slice(2)));
