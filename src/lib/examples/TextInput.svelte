<script lang="ts">
  import type Self from "./TextInput.svelte";
  import type { Test, Widen } from "../../../release/dsl.import.meta.vitest";

  let {
    value = $bindable(""),
    label,
    onchange,
  }: {
    value?: string;
    label: string;
    onchange?: (value: string) => void;
  } = $props();
</script>

<label>
  {label}
  <input bind:value oninput={() => onchange?.(value)} />
</label>

<!-- typing: `bind:value` into a pocket member, and a callback prop counted by the pocket -->
{#snippet types(
  TextInput: typeof Self,
  pocket: { text: Widen<"">; changes: Widen<0> },
  test: Test,
)}
  <TextInput
    label="Name"
    bind:value={pocket.text}
    onchange={() => (pocket.changes += 1)}
  />
  {test(async ({ expect, user, screen }) => {
    const input = screen.getByLabelText("Name");
    await user.type(input, "Ada");
    expect(pocket.text).toBe("Ada");
    expect(pocket.changes).toBe(3);
    await user.clear(input);
    expect(pocket.text).toBe("");
  })}
{/snippet}
