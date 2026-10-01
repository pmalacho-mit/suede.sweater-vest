<script lang="ts">
  import type Self from "./List.svelte";
  import type { Test, Widen } from "../../../release/dsl.import.meta.vitest";

  let {
    items,
    onremove,
  }: { items: string[]; onremove?: (item: string) => void } = $props();
</script>

<ul>
  {#each items as item (item)}
    <li>
      {item}
      <button onclick={() => onremove?.(item)} aria-label="remove {item}">
        ×
      </button>
    </li>
  {/each}
</ul>

<!-- a keyed list driven by a pocket array: removed from the component, added from the body -->
{#snippet lists(
  List: typeof Self,
  pocket: { items: Widen<["a", "b", "c"]> },
  test: Test,
)}
  <List
    items={pocket.items}
    onremove={(item) => (pocket.items = pocket.items.filter((i) => i !== item))}
  />
  {test(async ({ expect, screen, user, within, flushSync }) => {
    const names = () =>
      within(screen.getByRole("list"))
        .getAllByRole("listitem")
        .map((li) => li.textContent?.trim()[0]);
    expect(names()).toEqual(["a", "b", "c"]);
    await user.click(screen.getByRole("button", { name: "remove b" }));
    expect(names()).toEqual(["a", "c"]);
    pocket.items.push("d");
    flushSync();
    expect(names()).toEqual(["a", "c", "d"]);
  })}
{/snippet}
