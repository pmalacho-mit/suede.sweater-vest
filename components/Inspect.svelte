<script lang="ts">
  // A live view of a value — a pocket, say — as JSON: `<Inspect value={pocket} />`.
  let { value, label }: { value: unknown; label?: string } = $props();

  const seen = (_key: string, v: unknown) =>
    v instanceof Element ? `<${v.tagName.toLowerCase()}>` : typeof v === "function" ? `[function ${v.name}]` : v;
  const text = $derived(JSON.stringify($state.snapshot(value), seen, 2));
</script>

<pre class="inspect">{#if label}<b>{label}</b>
{/if}{text}</pre>

<style>
  .inspect {
    margin: 0;
    padding: 0.5rem 0.6rem;
    font: 12px/1.4 ui-monospace, monospace;
    background: #f4f4f4;
    color: #222;
    border-radius: 6px;
    overflow: auto;
  }
</style>
