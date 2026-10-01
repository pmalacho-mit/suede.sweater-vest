<script lang="ts">
  // A component with a size, to show the layout and container helpers with:
  // `Frame`, `Stage`, `Row`, `Column`, `Grid`, `Theme`.
  import type Self from "./Panel.svelte";
  import type {
    Test,
    Widen,
    Sweater,
  } from "../../../release/dsl.import.meta.vitest";

  let { title, width = 120 }: { title: string; width?: number } = $props();
</script>

<section class="panel" style:width="{width}px">
  <h3>{title}</h3>
  <p>{width}px wide</p>
</section>

<!-- Frame: sized to its content, so a capture of it is the component and nothing else -->
{#snippet framed(
  Panel: typeof Self,
  Frame: typeof Sweater.Frame,
  pocket: { frame: HTMLDivElement },
  test: Test,
)}
  <Frame bind:element={pocket.frame} padding="0.5rem">
    <Panel title="framed" />
  </Frame>
  {test(async ({ expect, capture, note }) => {
    expect(pocket.frame.querySelector("h3")?.textContent).toBe("framed");
    note(
      `captured ${(await capture(pocket.frame, "the frame")) ? "a PNG" : "nothing: no browser driver"}`,
    );
  })}
{/snippet}

<!-- Stage: a viewport of a known size, for what depends on one -->
{#snippet staged(
  Panel: typeof Self,
  Stage: typeof Sweater.Stage,
  pocket: { stage: HTMLDivElement },
  test: Test,
)}
  <Stage bind:element={pocket.stage} width={200} height={120} checkered>
    <Panel title="on stage" width={160} />
  </Stage>
  {test(async ({ expect }) => {
    expect(pocket.stage.style.width).toBe("200px");
    expect(pocket.stage.style.overflow).toBe("hidden");
  })}
{/snippet}

<!-- Row and Column: variants side by side, and stacked -->
{#snippet arranged(
  Panel: typeof Self,
  Row: typeof Sweater.Row,
  Column: typeof Sweater.Column,
  test: Test,
)}
  <Column gap="0.5rem">
    <Row gap="0.5rem">
      <Panel title="a" width={80} />
      <Panel title="b" width={120} />
    </Row>
    <Panel title="c" width={200} />
  </Column>
  {test(async ({ expect, screen }) => {
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual(["a", "b", "c"]);
  })}
{/snippet}

<!-- Grid: a matrix of variants -->
{#snippet gridded(
  Panel: typeof Self,
  Grid: typeof Sweater.Grid,
  pocket: { grid: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.grid}>
    <Grid columns={3} gap="0.5rem">
      {#each [60, 90, 120, 150, 180, 210] as width (width)}
        <Panel title={String(width)} {width} />
      {/each}
    </Grid>
  </div>
  {test(async ({ expect, within }) => {
    const grid = pocket.grid.firstElementChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(3, max-content)");
    expect(within(grid).getAllByRole("heading", { level: 3 })).toHaveLength(6);
  })}
{/snippet}

<!-- Theme: the same component under both colour schemes -->
{#snippet themed(
  Panel: typeof Self,
  Theme: typeof Sweater.Theme,
  Row: typeof Sweater.Row,
  pocket: { row: HTMLDivElement },
  test: Test,
)}
  <div bind:this={pocket.row}>
    <Row>
      <Theme scheme="light"><Panel title="light" /></Theme>
      <Theme scheme="dark"><Panel title="dark" /></Theme>
    </Row>
  </div>
  {test(async ({ expect }) => {
    const schemes = [...pocket.row.querySelectorAll("[data-theme]")].map((el) =>
      el.getAttribute("data-theme"),
    );
    expect(schemes).toEqual(["light", "dark"]);
  })}
{/snippet}

<!-- a gallery, with no test: every helper on one page -->
{#snippet gallery(
  Panel: typeof Self,
  Status: typeof Sweater.Status,
  Frame: typeof Sweater.Frame,
  Grid: typeof Sweater.Grid,
  Labeled: typeof Sweater.Labeled,
  Theme: typeof Sweater.Theme,
  test: Test,
)}
  <Status {test} />
  <Grid columns={2}>
    <Labeled label="Frame"><Frame><Panel title="framed" /></Frame></Labeled>
    <Labeled label="Theme dark"
      ><Theme scheme="dark"><Panel title="dark" /></Theme></Labeled
    >
  </Grid>
  {test(async ({ expect, screen }) => {
    expect(screen.getAllByRole("figure")).toHaveLength(2);
  })}
{/snippet}

<style>
  .panel {
    box-sizing: border-box;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: Canvas;
    color: CanvasText;
    font:
      12px system-ui,
      sans-serif;
  }
  h3,
  p {
    margin: 0;
  }
</style>
