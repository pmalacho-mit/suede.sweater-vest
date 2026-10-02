<script lang="ts">
  // Content under a colour scheme: `<Theme scheme="dark">…</Theme>`. Sets
  // `color-scheme` and `data-theme`, and a matching background, so what reads
  // `prefers-color-scheme`-style styling through either has something to read.
  import type { Snippet } from "svelte";

  let { scheme = "light", children }: { scheme?: "light" | "dark"; children: Snippet } = $props();
</script>

<div class="theme" data-theme={scheme} style:color-scheme={scheme}>
  {@render children()}
</div>

<style>
  .theme { display: inline-block; padding: 1rem; background: white; color: #111; }
  .theme[data-theme="dark"] { background: #1b1b1f; color: #eee; }
</style>
