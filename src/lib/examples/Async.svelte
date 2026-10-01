<script lang="ts" module>
  const x = 54;
</script>

<script lang="ts">
  import type Self from "./Async.svelte";
  import type { Test } from "../../../release/dsl.import.meta.vitest";
  import type { createDeferred } from "./harness.ts";

  let { load }: { load: () => Promise<string[]> } = $props();
</script>

{#await load()}
  <p>loading…</p>
{:then names}
  <ul>
    {#each names as name (name)}<li>{name}</li>{/each}
  </ul>
{:catch error}
  <p role="alert">{error.message}</p>
{/await}

<!-- an injected loader, settled by the test: `typeof` a type-only import arrives as the value -->
{#snippet resolves(
  Async: typeof Self,
  deferred: typeof createDeferred,
  test: Test,
)}
  {@const names = deferred<string[]>()}
  <Async load={() => names.promise} />
  {test(async ({ expect, screen, waitFor }) => {
    expect(screen.getByText("loading…")).toBeDefined();
    names.resolve(["ann", "bob"]);
    await waitFor(() =>
      expect(screen.getAllByRole("listitem")).toHaveLength(2),
    );
  })}
{/snippet}

{#snippet rejects(
  Async: typeof Self,
  deferred: typeof createDeferred,
  test: Test,
)}
  {@const names = deferred<string[]>()}
  <Async load={() => names.promise} />
  {test(async ({ expect, screen }) => {
    names.reject(new Error("offline"));
    expect((await screen.findByRole("alert")).textContent).toBe("offline");
  })}
{/snippet}
