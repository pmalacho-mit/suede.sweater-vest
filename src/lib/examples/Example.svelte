<script lang="ts">
  import type Self from "./Example.svelte";
  import type { Test, Widen } from "../../../release/dsl.import.meta.vitest";

  let { value }: { value: number } = $props();
</script>

<p>value is {value}</p>

{#snippet simple(
  Example: typeof Self,
  pocket: { number: Widen<2>; instance: Self; container: HTMLDivElement },
  test: Test,
)}
  <p>
    {test.name}: {test.state}{#if test.error}, {test.error}{/if}
  </p>
  <div bind:this={pocket.container} style="width:fit-content">
    <Example bind:this={pocket.instance} value={pocket.number} />
  </div>

  {test(async ({ expect, flushSync, note, capture }) => {
    expect(pocket.instance).toBeDefined();
    expect(pocket.container.textContent).toContain("value is 2");
    note("changing the value");
    pocket.number = 3;
    flushSync();
    await capture(pocket.container, "after the change");
    expect(pocket.container.textContent).toContain("value is 3");
  })}
{/snippet}

{#snippet big(Example: typeof Self)}
  <Example value={100} />
{/snippet}
