<script lang="ts">
  import type Self from "./Clock.svelte";
  import type { Test } from "../../../release/dsl.import.meta.vitest";

  let { every = 1000 }: { every?: number } = $props();
  let ticks = $state(0);

  $effect(() => {
    const id = setInterval(() => (ticks += 1), every);
    return () => clearInterval(id);
  });
</script>

<p>ticks: {ticks}</p>

<!-- an effect with a timer: real time, waited for. (A snippet is a declaration: it cannot share the script's `ticks`.) -->
{#snippet counts(Clock: typeof Self, test: Test)}
  <Clock every={20} />
  {test(async ({ expect, screen, waitFor }) => {
    await waitFor(
      () => expect(screen.getByText(/ticks: [1-9]/)).toBeDefined(),
      { timeout: 2000 },
    );
  })}
{/snippet}
