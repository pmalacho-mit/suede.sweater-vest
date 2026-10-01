<script lang="ts">
  import type Self from "./Badge.svelte";
  import type { Test } from "../../../release/dsl.import.meta.vitest";

  let {
    tone = "neutral",
    children,
  }: { tone?: "neutral" | "good" | "bad"; children: import("svelte").Snippet } =
    $props();
</script>

<span class="badge {tone}">{@render children()}</span>

<!-- examples only: these render on a page, and Vitest is handed nothing -->
{#snippet tones(Badge: typeof Self)}
  <Badge>neutral</Badge>
  <Badge tone="good">good</Badge>
  <Badge tone="bad">bad</Badge>
{/snippet}

{#snippet testUnused(Badge: typeof Self, test: Test)}
  <Badge tone="good">{test.name}</Badge>
  {test(async ({ expect, screen }) => {
    expect(screen.getByText("Badge > testUnused")).toBeDefined();
  })}
{/snippet}

<style>
  .badge {
    padding: 0 0.5em;
    border-radius: 999px;
    background: #eee;
  }
  .good {
    background: #d2f5dc;
  }
  .bad {
    background: #fbd5d5;
  }
</style>
