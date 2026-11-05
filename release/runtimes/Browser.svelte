<script lang="ts" module>
  // Vitest's `expect`, assembled for a page: the same matchers the body gets under Vitest
  import * as chai from "chai";
  import {
    JestAsymmetricMatchers,
    JestChaiExpect,
    JestExtend,
  } from "@vitest/expect";

  chai.use(JestExtend);
  chai.use(JestChaiExpect);
  chai.use(JestAsymmetricMatchers);
  const expect = chai.expect as unknown as Env["expect"];
</script>

<script lang="ts">
  // Mounts one snippet's generated component and runs its test. It adds no
  // markup of its own: what the page shows is what the snippet wrote, and the
  // snippet can show `test.name`, `test.state` and `test.error` as it likes.
  import { onMount, tick, type Component } from "svelte";
  import userEvent from "@testing-library/user-event";
  import { fireEvent, screen, waitFor, within } from "@testing-library/svelte";
  import {
    capture,
    captureContent,
    createHarness,
    loadVest,
    publish,
    type Env,
    type Harness,
    type VestEntry,
  } from "./common.svelte.ts";

  let { entry }: { entry: VestEntry } = $props();

  // `?docs=start|end`: the documentation's screenshot of what the snippet shows,
  // taken then. Only then is the snippet wrapped, to have something to measure.
  const asked = new URLSearchParams(location.search).get("docs");
  const docsMoment = asked === "start" || asked === "end" ? asked : null;
  let root = $state<HTMLElement>();

  let mounted = $state<{
    Vest: Component<{ harness: Harness }>;
    harness: Harness;
  } | null>(null);

  onMount(async () => {
    const started = performance.now();
    const harness = createHarness(
      entry.name,
      {
        expect,
        user: userEvent.setup(),
        screen,
        within,
        fireEvent,
        waitFor,
        capture,
        docs: docsMoment
          ? async (when) =>
              when === docsMoment && root ? captureContent(root) : null
          : undefined,
      },
      entry.test,
    );
    publish(harness, entry, started);
    mounted = { Vest: await loadVest(entry), harness };
    await tick();
    await harness.run().catch((e) => console.error(e));
    publish(harness, entry, started);
  });
</script>

{#if mounted}
  {#if docsMoment}
    <div bind:this={root}><mounted.Vest harness={mounted.harness} /></div>
  {:else}
    <mounted.Vest harness={mounted.harness} />
  {/if}
{/if}
