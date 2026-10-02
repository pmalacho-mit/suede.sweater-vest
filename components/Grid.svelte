<script lang="ts">
  // A matrix of variants: `<Grid columns={3}>…</Grid>`.
  import type { Snippet } from "svelte";

  let { columns = 2, gap = "1rem", children }: { columns?: number; gap?: string; children: Snippet } = $props();
</script>

<div class="grid" style:gap style:grid-template-columns="repeat({columns}, max-content)">
  {@render children()}
</div>

<style>
  .grid { display: grid; align-items: start; }
</style>
