<script lang="ts">
  import type Self from "./Card.svelte";
  import type { Test } from "../../../release/dsl.import.meta.vitest";
  import type { Snippet } from "svelte";

  let {
    title,
    children,
    footer,
  }: { title: string; children: Snippet; footer?: Snippet<[string]> } =
    $props();
</script>

<section class="card">
  <h2>{title}</h2>
  <div>{@render children()}</div>
  {#if footer}<footer>{@render footer(title)}</footer>{/if}
</section>

<!-- children and a snippet prop: a test snippet can declare snippets of its own -->
{#snippet composes(
  Card: typeof Self,
  pocket: { section: HTMLElement },
  test: Test,
)}
  {#snippet footer(title: string)}
    <small>— {title}</small>
  {/snippet}
  <div bind:this={pocket.section}>
    <Card title="Hello" {footer}><p>body text</p></Card>
  </div>
  {test(async ({ expect, screen, within }) => {
    expect(screen.getByRole("heading", { name: "Hello" })).toBeDefined();
    expect(screen.getByText("body text")).toBeDefined();
    expect(screen.getByText("— Hello")).toBeDefined();
    expect(within(pocket.section).getByRole("contentinfo")).toBeDefined();
  })}
{/snippet}

<style>
  .card {
    border: 1px solid #ccc;
    padding: 1rem;
  }
</style>
