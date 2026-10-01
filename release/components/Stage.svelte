<script lang="ts">
  // A viewport of a known size, for what depends on one: `<Stage width={360} height={640}>…</Stage>`.
  import type { Snippet } from "svelte";

  let {
    element = $bindable(),
    width = 320,
    height = 240,
    scroll = false,
    checkered = false,
    children,
  }: {
    element?: HTMLDivElement;
    width?: number;
    height?: number;
    scroll?: boolean;
    checkered?: boolean;
    children: Snippet;
  } = $props();
</script>

<div
  class="stage"
  class:checkered
  bind:this={element}
  style:width="{width}px"
  style:height="{height}px"
  style:overflow={scroll ? "auto" : "hidden"}
>
  {@render children()}
</div>

<style>
  .stage { position: relative; box-sizing: border-box; border: 1px solid #ddd; background: white; }
  .checkered {
    background-image:
      linear-gradient(45deg, #eee 25%, transparent 25%),
      linear-gradient(-45deg, #eee 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #eee 75%),
      linear-gradient(-45deg, transparent 75%, #eee 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  }
</style>
