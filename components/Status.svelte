<script lang="ts">
  // Where a test stands, with its notes and its failure: `<Status {test} />`.
  import type { Test } from "../runtimes/common.svelte.ts";

  let { test, notes = true }: { test: Test; notes?: boolean } = $props();
</script>

<div class="status" data-state={test.state}>
  <span class="light" aria-hidden="true"></span>
  <span class="name">{test.name}</span>
  <span class="state">{test.state}</span>
  {#if test.error}
    <pre class="error">{test.error}</pre>
  {/if}
  {#if notes && test.notes.length}
    <ol class="notes">
      {#each test.notes as note, i (i)}<li>{note}</li>{/each}
    </ol>
  {/if}
</div>

<style>
  .status {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.25rem 0.5rem;
    align-items: center;
    font: 13px/1.4 system-ui, sans-serif;
    padding: 0.4rem 0.6rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: #fafafa;
    color: #222;
  }
  .light {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: #f0c419;
  }
  [data-state="passed"] .light { background: #2fa84f; }
  [data-state="failed"] .light { background: #d93025; }
  .name { font-weight: 600; }
  .state { color: #666; }
  .error, .notes { grid-column: 1 / -1; margin: 0; }
  .error { white-space: pre-wrap; color: #a50e0e; font-size: 12px; }
  .notes { padding-left: 1.2rem; color: #555; }
</style>
