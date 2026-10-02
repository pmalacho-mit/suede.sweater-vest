<script lang="ts">
  // Variants side by side: `<Row gap="1rem">…</Row>`.
  import type { Snippet } from "svelte";

  let {
    gap = "1rem",
    align = "center",
    wrap = true,
    children,
  }: { gap?: string; align?: "start" | "center" | "end" | "stretch"; wrap?: boolean; children: Snippet } = $props();
</script>

<div class="row" style:gap style:align-items={align} style:flex-wrap={wrap ? "wrap" : "nowrap"}>
  {@render children()}
</div>

<style>
  .row { display: flex; flex-direction: row; }
</style>
