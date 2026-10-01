<script lang="ts">
  // A small component to show the display helpers with: `Status`, `Inspect`, `Labeled`.
  import type Self from "./Chip.svelte";
  import type {
    Test,
    Widen,
    Sweater,
  } from "../../../release/dsl.import.meta.vitest";

  let {
    label,
    tone = "neutral",
  }: { label: string; tone?: "neutral" | "good" | "bad" } = $props();
</script>

<span class="chip {tone}">{label}</span>

<!-- Status: the test's name, state, notes and failure, however the snippet places it -->
{#snippet status(Chip: typeof Self, Status: typeof Sweater.Status, test: Test)}
  <Status {test} />
  <Chip label="hello" />
  {test(async ({ expect, screen, note, tick }) => {
    note("looking for the chip");
    expect(screen.getByText("hello")).toBeDefined();
    await tick();
    expect(screen.getByText("looking for the chip")).toBeDefined();
  })}
{/snippet}

<!-- Inspect: a live JSON view of the pocket, following the body's writes -->
{#snippet inspect(
  Chip: typeof Self,
  Inspect: typeof Sweater.Inspect,
  pocket: { label: Widen<"one">; chip: HTMLSpanElement },
  test: Test,
)}
  <Chip label={pocket.label} />
  <Inspect value={pocket} label="pocket" />
  {test(async ({ expect, screen, flushSync }) => {
    expect(screen.getByText(/"label": "one"/)).toBeDefined();
    pocket.label = "two";
    flushSync();
    expect(screen.getByText(/"label": "two"/)).toBeDefined();
  })}
{/snippet}

<!-- Labeled: a caption over each variant -->
{#snippet labeled(
  Chip: typeof Self,
  Labeled: typeof Sweater.Labeled,
  Row: typeof Sweater.Row,
  test: Test,
)}
  <Row>
    {#each ["neutral", "good", "bad"] as const as tone (tone)}
      <Labeled label="tone={tone}"><Chip label={tone} {tone} /></Labeled>
    {/each}
  </Row>
  {test(async ({ expect, screen }) => {
    expect(screen.getAllByRole("figure")).toHaveLength(3);
    expect(screen.getByText("tone=good")).toBeDefined();
  })}
{/snippet}

<style>
  .chip {
    display: inline-block;
    padding: 0.1em 0.6em;
    border-radius: 999px;
    background: #eee;
    font:
      13px system-ui,
      sans-serif;
  }
  .good {
    background: #d2f5dc;
  }
  .bad {
    background: #fbd5d5;
  }
</style>
