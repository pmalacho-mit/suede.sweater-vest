// The optional-dependency stub (release/templates/optional/sweater-vest.d.ts)
// stands in for the DSL where sweater-vest is not installed. These tests hold
// it to the real DSL: it must offer everything the DSL exports, accept every
// way a snippet uses it, and give way to the real module wherever that resolves.
import { describe, it, expect } from "vitest";
import ts from "typescript";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const stubFile = path.join(root, "release/templates/optional/sweater-vest.d.ts");
const realFile = path.join(root, "release/dsl.import.meta.vitest.ts");
// virtual files, beside the real DSL so `./dsl.import.meta.vitest` resolves
const probeFile = path.join(root, "release/__stub-probe__.ts");

// every way the DSL is imported: bare, with the .ts extension, from any depth
const absent = [
  "./absent/dsl.import.meta.vitest",
  "./absent/dsl.import.meta.vitest.ts",
  "../../deep/absent/dsl.import.meta.vitest",
];

const build = (source: string) => {
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true,
    skipLibCheck: true,
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const readFile = host.readFile.bind(host);
  const getSourceFile = host.getSourceFile.bind(host);
  const fileExists = host.fileExists.bind(host);
  host.fileExists = (f) => f === probeFile || fileExists(f);
  host.readFile = (f) => (f === probeFile ? source : readFile(f));
  host.getSourceFile = (f, lang, ...rest) =>
    f === probeFile
      ? ts.createSourceFile(f, source, lang, true)
      : getSourceFile(f, lang, ...rest);
  const program = ts.createProgram([stubFile, realFile, probeFile], options, host);
  return { program, checker: program.getTypeChecker() };
};

const exportsOf = (
  checker: ts.TypeChecker,
  program: ts.Program,
  file: string,
) => {
  const sf = program.getSourceFile(file)!;
  const symbol = checker.getSymbolAtLocation(sf) ?? sf.symbol;
  return checker.getExportsOfModule(symbol);
};

// The stub's module symbol is the ambient declaration inside the stub file.
const stubExports = (checker: ts.TypeChecker, program: ts.Program) => {
  const sf = program.getSourceFile(stubFile)!;
  const decl = sf.statements.find(ts.isModuleDeclaration)!;
  return checker.getExportsOfModule(checker.getSymbolAtLocation(decl.name)!);
};

describe("optional-dependency stub", () => {
  const { program, checker } = build("export {};");
  const real = exportsOf(checker, program, realFile);
  const stub = stubExports(checker, program);

  it("offers every name the DSL exports", () => {
    const names = (s: ts.Symbol[]) => s.map((x) => x.name).sort();
    expect(real.length).toBeGreaterThan(0);
    expect(names(stub)).toEqual(expect.arrayContaining(names(real)));
  });

  // The members of `Sweater`, so a snippet's `typeof Sweater.<Name>` is covered
  const sweaterMembers = ts
    .createSourceFile(
      "i.ts",
      ts.sys.readFile(path.join(root, "release/components/index.ts"))!,
      ts.ScriptTarget.ESNext,
    )
    .statements.filter(ts.isExportDeclaration)
    .flatMap((d) =>
      d.exportClause && ts.isNamedExports(d.exportClause)
        ? d.exportClause.elements.map((e) => e.name.text)
        : [],
    );

  const usage = (spec: string, alias: string) => `
import type { Test, TestState, Payload, Body, Widen, Sweater } from "${spec}";
import type * as Dsl from "${spec}";
import type { Test as RealTest, TestState as RealTestState, Widen as RealWiden } from "./dsl.import.meta.vitest";

declare const test: Test;
// a snippet calls it once, with a body, and reads its fields
test(async ({ expect, user, screen, within, fireEvent, waitFor, flushSync, tick, note, capture, context, vi }) => {
  expect(1).toBe(1);
  note(test.name + test.state + (test.error ?? "") + test.notes.join());
});
const body: Body = (p: Payload) => {};
test(body);
const asReal: RealTest = test;               // the stub carries every member of the real Test
const state: RealTestState = "passed" as TestState;
const back: TestState = "failed" as RealTestState; // and the states agree both ways
const widened: Widen<2> = 3;                 // a Widen<…> member is assignable
const widenedMany: Widen<[2, 4]> = [1, 2, 3];
type Same<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
const widenAgrees: [
  Same<Widen<2>, RealWiden<2>>,
  Same<Widen<"a">, RealWiden<"a">>,
  Same<Widen<true>, RealWiden<true>>,
  Same<Widen<1n>, RealWiden<1n>>,
  Same<Widen<[2, 4]>, RealWiden<[2, 4]>>,
  Same<Widen<{ a: 2; b: ["x"] }>, RealWiden<{ a: 2; b: ["x"] }>>,
  Same<Widen<null>, RealWiden<null>>,
] = [true, true, true, true, true, true, true];
declare const ns: typeof Dsl.Sweater;
${sweaterMembers.map((m) => `declare const ${m}${alias}: typeof Sweater.${m};`).join("\n")}
export type { asReal, state, back, widened, widenedMany, widenAgrees, ns };
`;

  for (const spec of absent) {
    describe(`imported from "${spec}"`, () => {
      const source = usage(spec, "_" + absent.indexOf(spec));
      const { program, checker } = build(source);
      const probe = program.getSourceFile(probeFile)!;

      it("type-checks every way a snippet uses the DSL", () => {
        const diagnostics = program
          .getSemanticDiagnostics(probe)
          .concat(program.getSyntacticDiagnostics(probe))
          .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
        expect(diagnostics).toEqual([]);
      });

      it("resolves to the stub, as nothing exists at that path", () => {
        const resolved = ts.resolveModuleName(
          spec,
          probeFile,
          program.getCompilerOptions(),
          ts.sys,
        ).resolvedModule;
        expect(resolved).toBeUndefined();
        const decl = checker.getSymbolsInScope(probe, ts.SymbolFlags.Alias)
          .find((s) => s.name === "Test")!;
        const target = checker.getAliasedSymbol(decl);
        expect(target.declarations![0].getSourceFile().fileName).toBe(stubFile);
      });
    });
  }

  it("gives way to the real module wherever it resolves", () => {
    const { program, checker } = build(`
import type { Test } from "./dsl.import.meta.vitest";
import type { Test as Ts } from "./dsl.import.meta.vitest.ts";
export type { Test, Ts };
`);
    const probe = program.getSourceFile(probeFile)!;
    for (const name of ["Test", "Ts"]) {
      const alias = checker
        .getSymbolsInScope(probe, ts.SymbolFlags.Alias)
        .find((s) => s.name === name)!;
      const decl = checker.getAliasedSymbol(alias).declarations![0];
      expect(decl.getSourceFile().fileName).not.toBe(stubFile);
      expect(decl.getSourceFile().fileName).toMatch(/runtimes\/common\.svelte\.ts$/);
    }
  });
});
