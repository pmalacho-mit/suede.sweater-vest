<script lang="ts">
  import { setContext, type Snippet } from "svelte";

  let { theme, children }: { theme: "light" | "dark"; children: Snippet } =
    $props();
  // svelte-ignore state_referenced_locally
  setContext("theme", theme);
</script>

{@render children()}
