<script lang="ts">
  import type Self from "./Greeter.svelte";
  import type { Test } from "../../../release/dsl.import.meta.vitest";

  let { name }: { name: string } = $props();
  let greeted = $state(false);
</script>

<button onclick={() => (greeted = true)}>Greet</button>
{#if greeted}
  <p>Hello {name}</p>
{/if}

<!-- Testing Library's own first example: a prop, a click, and what appears -->
{#snippet greets(Greeter: typeof Self, test: Test)}
  <Greeter name="World" />
  {test(async ({ expect, screen, user }) => {
    expect(screen.queryByText(/hello/i)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Greet" }));
    expect(screen.getByText("Hello World")).toBeDefined();
  })}
{/snippet}
