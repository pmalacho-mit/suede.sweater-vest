<script lang="ts">
  import type Self from "./Modal.svelte";
  import type { Test, Widen } from "../../../release/dsl.import.meta.vitest";

  let { open = $bindable(false), title }: { open?: boolean; title: string } =
    $props();
  let closeButton = $state<HTMLButtonElement>();

  $effect(() => {
    if (open) closeButton?.focus();
  });
</script>

<svelte:window
  onkeydown={(event) => event.key === "Escape" && (open = false)}
/>

{#if open}
  <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <h2 id="modal-title">{title}</h2>
    <button bind:this={closeButton} onclick={() => (open = false)}>Close</button
    >
  </div>
{/if}

<!-- focus on open, a window keydown to close: Escape reaches the component through the document -->
{#snippet escapes(
  Modal: typeof Self,
  pocket: { open: Widen<true> },
  test: Test,
)}
  <Modal bind:open={pocket.open} title="Confirm" />
  {test(async ({ expect, screen, user, within }) => {
    const dialog = screen.getByRole("dialog", { name: "Confirm" });
    expect(document.activeElement).toBe(
      within(dialog).getByRole("button", { name: "Close" }),
    );
    await user.keyboard("{Escape}");
    expect(pocket.open).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  })}
{/snippet}
