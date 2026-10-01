<script lang="ts">
  import type Self from "./Stopwatch.svelte";
  import type { Test } from "../../../release/dsl.import.meta.vitest";

  let elapsed = $state(0);
  let laps: number[] = $state([]);

  /** Instance methods, reached through `bind:this`. */
  export function tick(ms: number) {
    elapsed += ms;
  }
  export function lap() {
    laps.push(elapsed);
  }
  export function reset() {
    elapsed = 0;
    laps = [];
  }
</script>

<p>elapsed: {elapsed}ms</p>
<ol>
  {#each laps as at, i (i)}<li>{at}ms</li>{/each}
</ol>

<!-- the instance in the pocket: a component's exported functions, called from the body -->
{#snippet methods(Stopwatch: typeof Self, pocket: { watch: Self }, test: Test)}
  <Stopwatch bind:this={pocket.watch} />
  {test(async ({ expect, screen, flushSync }) => {
    pocket.watch.tick(120);
    pocket.watch.lap();
    pocket.watch.tick(80);
    flushSync();
    expect(screen.getByText("elapsed: 200ms")).toBeDefined();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      ["120ms"],
    );
    pocket.watch.reset();
    flushSync();
    expect(screen.getByText("elapsed: 0ms")).toBeDefined();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  })}
{/snippet}
