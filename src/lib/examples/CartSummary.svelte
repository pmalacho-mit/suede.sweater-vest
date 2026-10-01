<script lang="ts">
  import type Self from "./CartSummary.svelte";
  import type { Test } from "../../../release/dsl.import.meta.vitest";
  import type { Cart } from "./cart.svelte.ts";

  let { cart }: { cart: Cart } = $props();
</script>

<p>{cart.items.length} items, total {cart.total}</p>

<!-- reactive state from a `.svelte.ts` module, constructed in the snippet and driven from the body -->
{#snippet summarizes(
  CartSummary: typeof Self,
  CartClass: typeof Cart,
  test: Test,
)}
  {@const cart = new CartClass()}
  <CartSummary {cart} />
  {test(async ({ expect, screen, flushSync }) => {
    expect(screen.getByText("0 items, total 0")).toBeDefined();
    cart.add("tea", 3);
    cart.add("cake", 4);
    flushSync();
    expect(screen.getByText("2 items, total 7")).toBeDefined();
  })}
{/snippet}
