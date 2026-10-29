// Lets code that carries sweater-vest test snippets type-check where
// sweater-vest is NOT installed. Copy it into your library's source, anywhere
// your tsconfig includes (next to the components is fine), and ship it with them.
//
// It is a pattern ambient module: TypeScript consults it only when an import
// does not resolve to a real file. Wherever sweater-vest is installed at the
// path the snippets import from, the real types win and this file is inert, so
// there is nothing to delete to opt in.
//
// The types are deliberately loose: they keep snippets compiling and
// `test(async ({ expect }) => …)` autocompleting, nothing more.
declare module "*/dsl.import.meta.vitest" {
  export type Payload = any;
  export type Body = (payload: Payload) => Promise<void> | void;
  export type TestState = "running" | "passed" | "failed";
  export type Test = ((body: Body) => void) & {
    readonly name: string;
    readonly state: TestState;
    readonly error: string | null;
    readonly notes: readonly string[];
  };
  // Copied from suede.nests.sweater-vest; src/optional-stub.spec.ts holds it to the real one.
  export type Widen<T> = T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T extends bigint
          ? bigint
          : T extends symbol
            ? symbol
            : T extends readonly (infer U)[]
              ? Widen<U>[]
              : T extends object
                ? { -readonly [K in keyof T]: Widen<T[K]> }
                : T;
  // `typeof Sweater.Status` and the like resolve to `any`.
  export const Sweater: any;
}

// The same module for an import that spells the extension out.
declare module "*/dsl.import.meta.vitest.ts" {
  export * from "sweater-vest/dsl.import.meta.vitest";
}
