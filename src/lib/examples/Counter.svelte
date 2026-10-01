<script lang="ts">
  import type Self from "./Counter.svelte";
  import type { Test, Widen } from "../../../release/dsl.import.meta.vitest";

  let { count = $bindable(0), step = 1 }: { count?: number; step?: number } =
    $props();
  const doubled = $derived(count * 2);
</script>

<button onclick={() => (count -= step)} aria-label="decrement">−</button>
<output>{count}, doubled {doubled}</output>
<button onclick={() => (count += step)} aria-label="increment">+</button>

<!-- a bindable prop: the component writes back through the binding, and reads what the pocket writes -->
{#snippet binds(Counter: typeof Self, pocket: { count: Widen<5> }, test: Test)}
  <Counter bind:count={pocket.count} step={2} />
  {test(async ({ expect, user, screen, flushSync }) => {
    await user.click(screen.getByRole("button", { name: "increment" }));
    expect(pocket.count).toBe(7);
    pocket.count = 10;
    flushSync();
    expect(screen.getByRole("status").textContent).toBe("10, doubled 20");
    await user.click(screen.getByRole("button", { name: "decrement" }));
    expect(pocket.count).toBe(8);
  })}
{/snippet}

<!-- keyboard: a focused button activates on Enter and Space -->
{#snippet keyboard(
  Counter: typeof Self,
  pocket: { count: Widen<0> },
  test: Test,
)}
  <Counter bind:count={pocket.count} />
  {test(async ({ expect, user, screen }) => {
    screen.getByRole("button", { name: "increment" }).focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(pocket.count).toBe(2);
  })}
{/snippet}
