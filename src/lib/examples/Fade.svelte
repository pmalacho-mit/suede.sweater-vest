<script lang="ts">
  import type Self from "./Fade.svelte";
  import type { Test, Widen } from "../../../release/dsl.import.meta.vitest";
  import { fade } from "svelte/transition";

  let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<button onclick={() => (open = !open)}>{open ? "Hide" : "Show"}</button>
{#if open}
  <p transition:fade={{ duration: 100 }}>now you see me</p>
{/if}

<!-- a transition: the element is there at once, and gone once the outro has played -->
{#snippet fades(Fade: typeof Self, pocket: { open: Widen<false> }, test: Test)}
  <Fade bind:open={pocket.open} />
  {test(async ({ expect, screen, user, waitFor }) => {
    await user.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByText("now you see me")).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Hide" }));
    await waitFor(() =>
      expect(screen.queryByText("now you see me")).toBeNull(),
    );
    expect(pocket.open).toBe(false);
  })}
{/snippet}
