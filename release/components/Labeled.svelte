<script lang="ts">
  // A caption over a variant: `<Labeled label="tone=good"><Badge tone="good" /></Labeled>`.
  import type { Snippet } from "svelte";

  let { label, children, below = false }: { label: string; children: Snippet; below?: boolean } = $props();
</script>

<figure class="labeled" class:below>
  <figcaption>{label}</figcaption>
  <div class="content">{@render children()}</div>
</figure>

<style>
  .labeled { display: inline-flex; flex-direction: column; gap: 0.3rem; margin: 0; }
  .below { flex-direction: column-reverse; }
  figcaption { font: 12px/1.2 ui-monospace, monospace; color: #666; }
</style>
