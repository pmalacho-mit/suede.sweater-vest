<script lang="ts">
  // A box that sizes to its content, for a `capture` that shows the component
  // and nothing else: `<Frame bind:element={pocket.frame}>…</Frame>`.
  import type { Snippet } from "svelte";

  let {
    element = $bindable(),
    padding = "1rem",
    background = "white",
    border = true,
    children,
  }: { element?: HTMLDivElement; padding?: string; background?: string; border?: boolean; children: Snippet } = $props();
</script>

<div class="frame" class:border bind:this={element} style:padding style:background>
  {@render children()}
</div>

<style>
  .frame { display: inline-block; width: fit-content; box-sizing: border-box; }
  .border { border: 1px solid #ddd; border-radius: 6px; }
</style>
