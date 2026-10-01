<script lang="ts">
  import type Self from "./Tabs.svelte";
  import type { Test, Widen } from "../../../release/dsl.import.meta.vitest";

  let {
    tabs,
    selected = $bindable(0),
  }: { tabs: { label: string; content: string }[]; selected?: number } =
    $props();
  let buttons: HTMLButtonElement[] = $state([]);

  const move = (by: number) => {
    selected = (selected + by + tabs.length) % tabs.length;
    buttons[selected]?.focus();
  };
</script>

<div role="tablist">
  {#each tabs as tab, i (tab.label)}
    <button
      role="tab"
      aria-selected={i === selected}
      tabindex={i === selected ? 0 : -1}
      bind:this={buttons[i]}
      onclick={() => (selected = i)}
      onkeydown={(e) =>
        e.key === "ArrowRight"
          ? move(1)
          : e.key === "ArrowLeft"
            ? move(-1)
            : undefined}
    >
      {tab.label}
    </button>
  {/each}
</div>
<div role="tabpanel">{tabs[selected]?.content}</div>

<!-- ARIA roles and arrow keys: what a screen reader and a keyboard user get -->
{#snippet navigates(
  Tabs: typeof Self,
  pocket: { selected: Widen<0> },
  test: Test,
)}
  <Tabs
    tabs={[
      { label: "One", content: "first" },
      { label: "Two", content: "second" },
      { label: "Three", content: "third" },
    ]}
    bind:selected={pocket.selected}
  />
  {test(async ({ expect, screen, user }) => {
    expect(
      screen.getByRole("tab", { selected: true }).textContent?.trim(),
    ).toBe("One");
    await user.click(screen.getByRole("tab", { name: "Two" }));
    expect(screen.getByRole("tabpanel").textContent).toBe("second");
    await user.keyboard("{ArrowRight}");
    expect(pocket.selected).toBe(2);
    expect(document.activeElement?.textContent?.trim()).toBe("Three");
    await user.keyboard("{ArrowRight}");
    expect(pocket.selected).toBe(0);
  })}
{/snippet}
