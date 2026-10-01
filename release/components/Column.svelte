<script lang="ts">
  // Variants stacked: `<Column gap="0.5rem">…</Column>`.
  import type { Snippet } from "svelte";

  let {
    gap = "1rem",
    align = "start",
    children,
  }: { gap?: string; align?: "start" | "center" | "end" | "stretch"; children: Snippet } = $props();
</script>

<div class="column" style:gap style:align-items={align}>
  {@render children()}
</div>

<style>
  .column { display: flex; flex-direction: column; }
</style>
