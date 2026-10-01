import * as vscode from "vscode";

import { SUFFIX, extracted } from "../../extract.ts";
import { discover, hasTests, type DiscoveredTest } from "./discovery.ts";
import { ID, rangeOf } from "./editor.ts";
import { lensTitle, type Outcome } from "./outcome.ts";
import { testId } from "./tree.ts";

import type { TestRunner } from "./runner.ts";
import type { TestTree } from "./tree.ts";

const TOP = new vscode.Range(0, 0, 0, 0);

const lens = (range: vscode.Range, title: string, command: string, ...args: unknown[]) =>
  new vscode.CodeLens(range, { title, command: `${ID}.${command}`, arguments: args });

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

const collectorLens = (uri: vscode.Uri, tests: DiscoveredTest[]) =>
  lens(TOP, `$(diff) What Vitest sees (${plural(tests.length, "snippet")})`, "showCollector", uri);

function testLenses(uri: vscode.Uri, test: DiscoveredTest, id: string, outcome: Outcome | undefined) {
  const range = rangeOf(test);
  const failed = outcome?.state === "failed";
  if (!test.generatable) return [lens(range, "$(error) Cannot generate: see the error", "showCollector", uri)];
  return [
    lens(range, lensTitle(outcome), failed ? "showFailure" : "runTest", id),
    lens(range, "$(globe) Open page", "openPage", id),
    lens(range, "$(go-to-file) Extract", "extract", id),
    ...(failed ? [lens(range, "$(refresh) Run again", "runTest", id)] : []),
  ];
}

const EXTRACTED_ACTIONS = [
  ["$(play) Run", "runExtracted"],
  ["$(debug-alt) Debug", "debugExtracted"],
  ["$(trash) Delete", "deleteExtracted"],
] as const;

export const testFileLenses = (tree: TestTree, runner: TestRunner, changed: vscode.EventEmitter<void>) =>
  vscode.languages.registerCodeLensProvider([{ language: "svelte", scheme: "file" }], {
    onDidChangeCodeLenses: changed.event,
    provideCodeLenses(document) {
      const { uri } = document;
      const text = document.getText();
      if (uri.fsPath.endsWith(SUFFIX) || !hasTests(text) || !tree.parsable(uri)) return [];
      let tests: DiscoveredTest[];
      try {
        tests = discover(uri.fsPath, text);
      } catch {
        return [];
      }
      if (!tests.length) return [];
      return [
        collectorLens(uri, tests),
        ...tests.flatMap((test) => {
          const id = testId(uri, test.name);
          return testLenses(uri, test, id, runner.outcomeOf(id));
        }),
      ];
    },
  });

export const extractedFileLenses = () =>
  vscode.languages.registerCodeLensProvider({ language: "svelte", scheme: "file", pattern: `**/*${SUFFIX}` }, {
    provideCodeLenses: (document) =>
      extracted(document.getText())
        ? EXTRACTED_ACTIONS.map(([title, command]) => lens(TOP, title, command, document.uri))
        : [],
  });
