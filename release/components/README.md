# Components

The library's components, as their own snippets use them. The sections between the
`sweater-vest:` fences are generated; everything else is yours. Refresh with

    node release/cli.ts release/components --readme release/components/README.md

<!-- sweater-vest:begin Column.svelte > stacked -->
## Column.stacked

[source](Column.svelte#L23)

Column: variants stacked, with a Row of them nested inside

```svelte
<script lang="ts">
  import Column from "./Column.svelte";
  import { Row, Labeled } from "./index.ts";
</script>

<Column gap="0.5rem">
  <Labeled label="first!"><span>one</span></Labeled>
  <Row gap="0.5rem">
    <Labeled label="second"><span>two</span></Labeled>
    <Labeled label="third"><span>three</span></Labeled>
  </Row>
  <Labeled label="last"><span>four</span></Labeled>
</Column>
```
<!-- sweater-vest:end Column.svelte > stacked -->

<!-- sweater-vest:begin Column.svelte > defaults -->
## Column.defaults

[source](Column.svelte#L39)

left alone: a 1rem gap, aligned to the start, and the children in the order written

```svelte
<script lang="ts">
  import Column from "./Column.svelte";
</script>

<Column>
  <span>a</span>
  <span>b</span>
  <span>c</span>
</Column>
```

Verified by:

```ts
const column = screen.getByText("a").parentElement as HTMLElement;
expect(column.style.gap).toBe("1rem");
expect(column.style.alignItems).toBe("start");
expect([...column.children].map((child) => child.textContent)).toEqual([
  "a",
  "b",
  "c",
]);
```
<!-- sweater-vest:end Column.svelte > defaults -->

<!-- sweater-vest:begin Column.svelte > aligned -->
## Column.aligned

[source](Column.svelte#L63)

every other align, each column as wide as its widest child

```svelte
<script lang="ts">
  import Column from "./Column.svelte";
  import { Row, Labeled } from "./index.ts";
</script>

<Row align="start">
  <Labeled label="align=center">
    <Column align="center"
      ><button>center</button><button>a wider one</button></Column
    >
  </Labeled>
  <Labeled label="align=end">
    <Column align="end"
      ><button>end</button><button>a wider one</button></Column
    >
  </Labeled>
  <Labeled label="align=stretch">
    <Column align="stretch"
      ><button>stretch</button><button>a wider one</button></Column
    >
  </Labeled>
</Row>
```

Verified by:

```ts
for (const align of ["center", "end", "stretch"]) {
  const column = screen.getByRole("button", { name: align })
    .parentElement as HTMLElement;
  expect(column.style.alignItems).toBe(align);
}
```
<!-- sweater-vest:end Column.svelte > aligned -->

<!-- sweater-vest:begin Column.svelte > follows -->
## Column.follows

[source](Column.svelte#L98)

gap, of any CSS length, and align, each following its prop as it changes

```svelte
<script lang="ts">
  import Column from "./Column.svelte";

  let gap = $state("2rem");
  let centred = $state(false);
</script>

<Column gap={gap} align={centred ? "center" : "end"}>
  <span>top</span>
  <span>bottom</span>
</Column>
```

Verified by:

```ts
const column = screen.getByText("top").parentElement as HTMLElement;
expect(column.style.gap).toBe("2rem");
expect(column.style.alignItems).toBe("end");
gap = "4px";
centred = true;
flushSync();
expect(column.style.gap).toBe("4px");
expect(column.style.alignItems).toBe("center");
```
<!-- sweater-vest:end Column.svelte > follows -->

<!-- sweater-vest:begin Frame.svelte > framed -->
## Frame.framed

[source](Frame.svelte#L34)

Frame: around what a capture should show, and nothing else

```svelte
<script lang="ts">
  import Frame from "./Frame.svelte";
  import { Row } from "./index.ts";
</script>

<Row>
  <Frame><span>as it comes: padded, white, bordered</span></Frame>
  <Frame padding="0.25rem" background="papayawhip" border={false}>
    <span>tighter, tinted, no border</span>
  </Frame>
</Row>
```
<!-- sweater-vest:end Frame.svelte > framed -->

<!-- sweater-vest:begin Frame.svelte > captured -->
## Frame.captured

[source](Frame.svelte#L44)

bind:element hands back the box, to capture just it

```svelte
<script lang="ts">
  import Frame from "./Frame.svelte";

  let frame = $state<HTMLDivElement>();
</script>

<Frame bind:element={frame}><span>just this</span></Frame>
```

Verified by:

```ts
expect(frame).toBeInstanceOf(HTMLDivElement);
expect(frame.textContent).toBe("just this");
expect(frame.style.padding).toBe("1rem");
expect(frame.style.background).toBe("white");
expect(frame.classList.contains("border")).toBe(true);
const png = await capture(frame, "the frame");
note(
  png
    ? "captured a PNG of the frame"
    : "captured nothing: only the report takes screenshots",
);
```
<!-- sweater-vest:end Frame.svelte > captured -->

<!-- sweater-vest:begin Frame.svelte > styled -->
## Frame.styled

[source](Frame.svelte#L68)

padding, background and border, set and then changed

```svelte
<script lang="ts">
  import Frame from "./Frame.svelte";

  let frame = $state<HTMLDivElement>();
  let padding = $state("2px 8px");
  let background = $state("papayawhip");
  let border = $state(false);
</script>

<Frame
  bind:element={frame}
  padding={padding}
  background={background}
  border={border}
>
  <span>styled</span>
</Frame>
```

Verified by:

```ts
expect(frame.style.padding).toBe("2px 8px");
expect(frame.style.background).toBe("papayawhip");
expect(frame.classList.contains("border")).toBe(false);
padding = "0.5rem";
background = "lavender";
border = true;
flushSync();
expect(frame.style.padding).toBe("0.5rem");
expect(frame.style.background).toBe("lavender");
expect(frame.classList.contains("border")).toBe(true);
```
<!-- sweater-vest:end Frame.svelte > styled -->

<!-- sweater-vest:begin Grid.svelte > usage -->
## Grid.usage

[source](Grid.svelte#L23)

a matrix of variants: children fill the columns row by row, a size per column, a weight per row

```svelte
<script lang="ts">
  import Grid from "./Grid.svelte";
  import { Labeled } from "./index.ts";
</script>

<Grid columns={3} gap="0.5rem">
  {#each ["normal", "bold"] as weight (weight)}
    {#each [12, 16, 24] as size (size)}
      <Labeled label="{weight} {size}px">
        <span style:font-weight={weight} style:font-size="{size}px">Aa</span>
      </Labeled>
    {/each}
  {/each}
</Grid>
```
<!-- sweater-vest:end Grid.svelte > usage -->

<!-- sweater-vest:begin Grid.svelte > defaults -->
## Grid.defaults

[source](Grid.svelte#L36)

defaults: two columns, each as wide as its widest child, 1rem apart

```svelte
<script lang="ts">
  import Grid from "./Grid.svelte";

  let el = $state<HTMLDivElement>();
</script>

<div bind:this={el}>
  <Grid>
    <span>a</span>
    <span>b</span>
    <span>c</span>
    <span>d</span>
  </Grid>
</div>
```

Verified by:

```ts
const grid = el.querySelector("div")!;
expect(grid.style.gridTemplateColumns).toBe("repeat(2, max-content)");
expect(grid.style.gap).toBe("1rem");
expect([...grid.children].map((child) => child.textContent)).toEqual([
  "a",
  "b",
  "c",
  "d",
]);
```
<!-- sweater-vest:end Grid.svelte > defaults -->

<!-- sweater-vest:begin Grid.svelte > reflows -->
## Grid.reflows

[source](Grid.svelte#L65)

columns and gap set, and both following the values they are given

```svelte
<script lang="ts">
  import Grid from "./Grid.svelte";

  let el = $state<HTMLDivElement>();
  let columns = $state(3);
  let gap = $state("4px 12px");
</script>

<div bind:this={el}>
  <Grid columns={columns} gap={gap}>
    {#each [1, 2, 3, 4, 5, 6] as n (n)}
      <span>{n}</span>
    {/each}
  </Grid>
</div>
```

Verified by:

```ts
const grid = el.querySelector("div")!;
expect(grid.style.gridTemplateColumns).toBe("repeat(3, max-content)");
expect(grid.style.gap).toBe("4px 12px");
columns = 6;
gap = "2px";
flushSync();
expect(grid.style.gridTemplateColumns).toBe("repeat(6, max-content)");
expect(grid.style.gap).toBe("2px");
```
<!-- sweater-vest:end Grid.svelte > reflows -->

<!-- sweater-vest:begin Inspect.svelte > usage -->
## Inspect.usage

[source](Inspect.svelte#L22)

a pocket beside what changes it: the view follows every write

```svelte
<script lang="ts">
  import Inspect from "./Inspect.svelte";

  let pocket = $state({ name: "Ada", clicks: 0 });
</script>

<input bind:value={pocket.name} aria-label="name" />
<button onclick={() => pocket.clicks++}>click</button>
<Inspect value={pocket} label="pocket" />
```
<!-- sweater-vest:end Inspect.svelte > usage -->

<!-- sweater-vest:begin Inspect.svelte > json -->
## Inspect.json

[source](Inspect.svelte#L32)

any value, as JSON indented by two spaces

```svelte
<script lang="ts">
  import Inspect from "./Inspect.svelte";

  let box = $state<HTMLDivElement>();
</script>

<div bind:this={box}>
  <Inspect value={{ name: "Ada", tags: ["a"], none: null }} />
  <Inspect value={42} />
  <Inspect value="text" />
</div>
```

Verified by:

```ts
const [object, number, string] = [...box.querySelectorAll("pre")];
expect(object.textContent).toBe(
  '{\n  "name": "Ada",\n  "tags": [\n    "a"\n  ],\n  "none": null\n}',
);
expect(number.textContent).toBe("42");
expect(string.textContent).toBe('"text"');
```
<!-- sweater-vest:end Inspect.svelte > json -->

<!-- sweater-vest:begin Inspect.svelte > live -->
## Inspect.live

[source](Inspect.svelte#L55)

live: a write to the pocket, or a new value, shows once Svelte flushes

```svelte
<script lang="ts">
  import Inspect from "./Inspect.svelte";

  let pocket = $state({ count: 1, items: ["a"] });
</script>

<Inspect value={pocket} label="pocket" />
<Inspect value={pocket.count} label="count" />
```

Verified by:

```ts
const whole = screen.getByText("pocket").parentElement!;
const part = screen.getByText("count").parentElement!;
expect(whole.textContent).toContain('"count": 1');
expect(part.textContent).toBe("count\n1");
pocket.count = 2;
pocket.items.push("b");
flushSync();
expect(whole.textContent).toContain('"count": 2');
expect(whole.textContent).toContain('"items": [\n    "a",\n    "b"\n  ]');
expect(whole.textContent).not.toContain('"count": 1');
expect(part.textContent).toBe("count\n2");
```
<!-- sweater-vest:end Inspect.svelte > live -->

<!-- sweater-vest:begin Inspect.svelte > special -->
## Inspect.special

[source](Inspect.svelte#L80)

what JSON cannot hold: an element prints as its tag, a function as its name

```svelte
<script lang="ts">
  import Inspect from "./Inspect.svelte";

  let pocket = $state({ el: undefined as HTMLSpanElement | undefined });
</script>

<span bind:this={pocket.el}>bound</span>
<Inspect value={pocket} />
<Inspect value={function greet() {}} />
```

Verified by:

```ts
expect(screen.getByText(/"el": "<span>"/).textContent).toBe(
  '{\n  "el": "<span>"\n}',
);
expect(screen.getByText('"[function greet]"')).toBeDefined();
```
<!-- sweater-vest:end Inspect.svelte > special -->

<!-- sweater-vest:begin Inspect.svelte > labeled -->
## Inspect.labeled

[source](Inspect.svelte#L99)

label: a bold heading above the JSON, only when given, and following its value

```svelte
<script lang="ts">
  import Inspect from "./Inspect.svelte";

  let titled = $state<HTMLDivElement>();
  let plain = $state<HTMLDivElement>();
  let label = $state("state");
</script>

<div bind:this={titled}>
  <Inspect value={{ n: 1 }} label={label} />
</div>
<div bind:this={plain}><Inspect value={{ n: 1 }} /></div>
```

Verified by:

```ts
expect(titled.querySelector("pre > b")?.textContent).toBe("state");
expect(titled.textContent).toBe(
  `state\n${JSON.stringify({ n: 1 }, null, 2)}`,
);
expect(plain.querySelector("b")).toBeNull();
expect(plain.textContent).toBe(JSON.stringify({ n: 1 }, null, 2));
label = "renamed";
flushSync();
expect(titled.querySelector("pre > b")?.textContent).toBe("renamed");
```
<!-- sweater-vest:end Inspect.svelte > labeled -->

<!-- sweater-vest:begin Labeled.svelte > usage -->
## Labeled.usage

[source](Labeled.svelte#L20)

a caption over each variant, above by default or below

```svelte
<script lang="ts">
  import Labeled from "./Labeled.svelte";
  import { Row } from "./index.ts";
</script>

<Row>
  <Labeled label="size=small"><span style="font-size: 12px">Aa</span></Labeled
  >
  <Labeled label="size=large"><span style="font-size: 24px">Aa</span></Labeled
  >
  <Labeled label="caption below" below><span>Aa</span></Labeled>
</Row>
```
<!-- sweater-vest:end Labeled.svelte > usage -->

<!-- sweater-vest:begin Labeled.svelte > captions -->
## Labeled.captions

[source](Labeled.svelte#L31)

a figure whose figcaption is the label, and the children after it

```svelte
<script lang="ts">
  import Labeled from "./Labeled.svelte";
</script>

<Labeled label="tone=good"><span>good</span></Labeled>
```

Verified by:

```ts
const figure = screen.getByRole("figure");
expect(figure.classList.contains("below")).toBe(false);
const caption = within(figure).getByText("tone=good");
expect(caption.tagName).toBe("FIGCAPTION");
expect(figure.firstElementChild).toBe(caption);
expect(within(figure).getByText("good").closest("figcaption")).toBeNull();
```
<!-- sweater-vest:end Labeled.svelte > captions -->

<!-- sweater-vest:begin Labeled.svelte > flipped -->
## Labeled.flipped

[source](Labeled.svelte#L49)

below: the caption under the variant, a class away and still first in the DOM; both props follow their values

```svelte
<script lang="ts">
  import Labeled from "./Labeled.svelte";

  let label = $state("under");
  let below = $state(true);
</script>

<Labeled label={label} below={below}
  ><span>variant</span></Labeled
>
```

Verified by:

```ts
const figure = screen.getByRole("figure");
expect(figure.classList.contains("below")).toBe(true);
expect(figure.firstElementChild?.tagName).toBe("FIGCAPTION");
expect(figure.firstElementChild?.textContent).toBe("under");
below = false;
label = "over";
flushSync();
expect(figure.classList.contains("below")).toBe(false);
expect(figure.firstElementChild?.textContent).toBe("over");
```
<!-- sweater-vest:end Labeled.svelte > flipped -->

<!-- sweater-vest:begin Labeled.svelte > gallery -->
## Labeled.gallery

[source](Labeled.svelte#L73)

in a Row: a gallery of swatches, each figure its own caption over its own variant

```svelte
<script lang="ts">
  import Labeled from "./Labeled.svelte";
  import { Row } from "./index.ts";
</script>

<Row gap="0.5rem" align="end">
  {#each [8, 16, 24] as size (size)}
    <Labeled label="size={size}">
      <span
        style:display="inline-block"
        style:width="{size}px"
        style:height="{size}px"
        style:background="#888"
      ></span>
    </Labeled>
  {/each}
</Row>
```

Verified by:

```ts
const figures = screen.getAllByRole("figure");
expect(figures).toHaveLength(3);
for (const [i, size] of [8, 16, 24].entries()) {
  expect(figures[i].firstElementChild?.textContent).toBe(`size=${size}`);
  expect(
    figures[i].lastElementChild?.querySelector("span")?.style.width,
  ).toBe(`${size}px`);
}
```
<!-- sweater-vest:end Labeled.svelte > gallery -->

<!-- sweater-vest:begin Row.svelte > usage -->
## Row.usage

[source](Row.svelte#L30)

variants side by side, a gap apart, lined up along their bottoms

```svelte
<script lang="ts">
  import Row from "./Row.svelte";
  import { Labeled } from "./index.ts";
</script>

<Row gap="2rem" align="end">
  <Labeled label="size=small"><span style="font-size: 12px">Aa</span></Labeled
  >
  <Labeled label="size=medium"
    ><span style="font-size: 18px">Aa</span></Labeled
  >
  <Labeled label="size=large"><span style="font-size: 24px">Aa</span></Labeled
  >
</Row>
```
<!-- sweater-vest:end Row.svelte > usage -->

<!-- sweater-vest:begin Row.svelte > defaults -->
## Row.defaults

[source](Row.svelte#L43)

left alone: a 1rem gap, centred, wrapping, and the children in the order written

```svelte
<script lang="ts">
  import Row from "./Row.svelte";

  let el = $state<HTMLDivElement>();
</script>

<div bind:this={el}>
  <Row>
    <span>a</span>
    <span>b</span>
    <span>c</span>
  </Row>
</div>
```

Verified by:

```ts
const row = el.firstElementChild as HTMLElement;
expect(row.style.gap).toBe("1rem");
expect(row.style.alignItems).toBe("center");
expect(row.style.flexWrap).toBe("wrap");
expect([...row.children].map((child) => child.textContent)).toEqual([
  "a",
  "b",
  "c",
]);
```
<!-- sweater-vest:end Row.svelte > defaults -->

<!-- sweater-vest:begin Row.svelte > overrides -->
## Row.overrides

[source](Row.svelte#L71)

every prop written, and followed when it changes: a gap, an alignment, wrapping

```svelte
<script lang="ts">
  import Row from "./Row.svelte";

  let el = $state<HTMLDivElement>();
  let gap = $state("0.25rem");
  let stretch = $state(false);
  let wrap = $state(false);
</script>

<div bind:this={el}>
  <Row
    gap={gap}
    align={stretch ? "stretch" : "start"}
    wrap={wrap}
  >
    <span>one</span>
    <span>two</span>
  </Row>
</div>
```

Verified by:

```ts
const row = el.firstElementChild as HTMLElement;
expect(row.style.gap).toBe("0.25rem");
expect(row.style.alignItems).toBe("start");
expect(row.style.flexWrap).toBe("nowrap");
gap = "3px";
stretch = true;
wrap = true;
flushSync();
expect(row.style.gap).toBe("3px");
expect(row.style.alignItems).toBe("stretch");
expect(row.style.flexWrap).toBe("wrap");
```
<!-- sweater-vest:end Row.svelte > overrides -->

<!-- sweater-vest:begin Stage.svelte > phone -->
## Stage.phone

[source](Stage.svelte#L36)

a phone-sized viewport, checkered so its edges show, with what it holds placed against them

```svelte
<script lang="ts">
  import Stage from "./Stage.svelte";
</script>

<Stage width={180} height={320} checkered>
  <span style="position: absolute; top: 8px; left: 8px;">top left</span>
  <span style="position: absolute; bottom: 8px; right: 8px;"
    >bottom right</span
  >
</Stage>
```
<!-- sweater-vest:end Stage.svelte > phone -->

<!-- sweater-vest:begin Stage.svelte > defaults -->
## Stage.defaults

[source](Stage.svelte#L46)

defaults: 320 by 240, overflow hidden, a plain background; the element binds out

```svelte
<script lang="ts">
  import Stage from "./Stage.svelte";

  let stage = $state<HTMLDivElement>();
</script>

<Stage bind:element={stage}>
  <span>on stage</span>
</Stage>
```

Verified by:

```ts
expect(stage).toBeInstanceOf(HTMLDivElement);
expect(within(stage).getByText("on stage")).toBeDefined();
expect(stage.style.width).toBe("320px");
expect(stage.style.height).toBe("240px");
expect(stage.style.overflow).toBe("hidden");
expect(stage.classList.contains("checkered")).toBe(false);
```
<!-- sweater-vest:end Stage.svelte > defaults -->

<!-- sweater-vest:begin Stage.svelte > scrolling -->
## Stage.scrolling

[source](Stage.svelte#L67)

scroll: content taller than the stage, scrolled to rather than cut off

```svelte
<script lang="ts">
  import Stage from "./Stage.svelte";
</script>

<Stage width={200} height={100} scroll checkered>
  <div style="height: 400px;">a tall column, scroll down</div>
</Stage>
```
<!-- sweater-vest:end Stage.svelte > scrolling -->

<!-- sweater-vest:begin Stage.svelte > resized -->
## Stage.resized

[source](Stage.svelte#L74)

every prop follows its value: resize, scroll and checker the same stage

```svelte
<script lang="ts">
  import Stage from "./Stage.svelte";

  let stage = $state<HTMLDivElement>();
  let width = $state(160);
  let height = $state(90);
  let scroll = $state(true);
  let checkered = $state(true);
</script>

<Stage
  bind:element={stage}
  width={width}
  height={height}
  scroll={scroll}
  checkered={checkered}
>
  <span>{width} by {height}</span>
</Stage>
```

Verified by:

```ts
expect(stage.style.width).toBe("160px");
expect(stage.style.height).toBe("90px");
expect(stage.style.overflow).toBe("auto");
expect(stage.classList.contains("checkered")).toBe(true);
expect(within(stage).getByText("160 by 90")).toBeDefined();
width = 360;
height = 640;
scroll = false;
checkered = false;
flushSync();
expect(stage.style.width).toBe("360px");
expect(stage.style.height).toBe("640px");
expect(stage.style.overflow).toBe("hidden");
expect(stage.classList.contains("checkered")).toBe(false);
expect(within(stage).getByText("360 by 640")).toBeDefined();
scroll = true;
checkered = true;
flushSync();
expect(stage.style.overflow).toBe("auto");
expect(stage.classList.contains("checkered")).toBe(true);
```
<!-- sweater-vest:end Stage.svelte > resized -->

<!-- sweater-vest:begin Status.svelte > running -->
## Status.running

[source](Status.svelte#L25)

a test still running: its name, and where it stands

```svelte
<script lang="ts">
  import Status from "./Status.svelte";
  import { createHarness as harness, type Env } from "../runtimes/common.svelte.ts";
</script>

<Status test={harness("Counter > counts", {} as Env).test} />
```
<!-- sweater-vest:end Status.svelte > running -->

<!-- sweater-vest:begin Status.svelte > noted -->
## Status.noted

[source](Status.svelte#L30)

notes: each one under the test as the body writes it, unless notes={false}, until it turns true

```svelte
<script lang="ts">
  import Status from "./Status.svelte";
  import type { Test } from "../dsl.import.meta.vitest";
  import { createHarness as harness, type Env } from "../runtimes/common.svelte.ts";

  let { test }: { test: Test } = $props();
  let notes = $state(false);
  const quiet = harness("Counter > counts", {} as Env);
</script>

<Status {test} />
<Status test={quiet.test} notes={notes} />
```

Verified by:

```ts
const own = screen.getByText("Status > noted").closest(".status")!;
const muted = screen.getByText("Counter > counts").closest(".status")!;
expect(own.getAttribute("data-state")).toBe("running");
expect(own.querySelector(".state")?.textContent).toBe("running");
expect(own.querySelector("ol")).toBeNull();
note("clicked twice");
note("then reset");
quiet.test(({ note }) => note("kept, shown once asked"));
await quiet.run();
await tick();
expect([...own.querySelectorAll("li")].map((li) => li.textContent)).toEqual(
  ["clicked twice", "then reset"],
);
expect(quiet.test.notes).toEqual(["kept, shown once asked"]);
expect(muted.querySelector("ol")).toBeNull();
notes = true;
flushSync();
expect(muted.querySelector("li")?.textContent).toBe(
  "kept, shown once asked",
);
```
<!-- sweater-vest:end Status.svelte > noted -->

<!-- sweater-vest:begin Status.svelte > outcomes -->
## Status.outcomes

[source](Status.svelte#L64)

outcomes: a test that passed, and one that failed with its error underneath

```svelte
<script lang="ts">
  import Status from "./Status.svelte";
  import type { Test } from "../dsl.import.meta.vitest";
  import { createHarness as harness, type Env } from "../runtimes/common.svelte.ts";

  let { test }: { test: Test } = $props();
  const passes = harness("Counter > counts", {} as Env);
  const fails = harness("Counter > resets", {} as Env);
</script>

<Status {test} />
<Status test={passes.test} />
<Status test={fails.test} />
```

Verified by:

```ts
const passed = screen.getByText("Counter > counts").closest(".status")!;
const failed = screen.getByText("Counter > resets").closest(".status")!;
expect(failed.getAttribute("data-state")).toBe("running");
expect(failed.querySelector("pre")).toBeNull();
passes.test(() => {});
fails.test(() => {
  throw new Error("expected 1 to be 0");
});
await passes.run();
await expect(fails.run()).rejects.toThrow("expected 1 to be 0");
await tick();
expect(passed.getAttribute("data-state")).toBe("passed");
expect(passed.querySelector(".state")?.textContent).toBe("passed");
expect(passed.querySelector("pre")).toBeNull();
expect(failed.getAttribute("data-state")).toBe("failed");
expect(failed.querySelector(".state")?.textContent).toBe("failed");
expect(failed.querySelector("pre")?.textContent).toBe("expected 1 to be 0");
```
<!-- sweater-vest:end Status.svelte > outcomes -->

<!-- sweater-vest:begin Theme.svelte > pair -->
## Theme.pair

[source](Theme.svelte#L20)

Theme: the same content under both colour schemes, side by side

```svelte
<script lang="ts">
  import Theme from "./Theme.svelte";
  import { Row } from "./index.ts";
</script>

<Row>
  <Theme scheme="light"><span>light</span></Theme>
  <Theme scheme="dark"><span>dark</span></Theme>
</Row>
```
<!-- sweater-vest:end Theme.svelte > pair -->

<!-- sweater-vest:begin Theme.svelte > defaults -->
## Theme.defaults

[source](Theme.svelte#L28)

no scheme: light, with the children inside

```svelte
<script lang="ts">
  import Theme from "./Theme.svelte";
</script>

<Theme><span>default</span></Theme>
```

Verified by:

```ts
const theme = screen.getByText("default").parentElement!;
expect(theme.getAttribute("data-theme")).toBe("light");
expect(theme.style.colorScheme).toBe("light");
```
<!-- sweater-vest:end Theme.svelte > defaults -->

<!-- sweater-vest:begin Theme.svelte > toggles -->
## Theme.toggles

[source](Theme.svelte#L43)

the scheme follows its prop: light, then dark, then light again

```svelte
<script lang="ts">
  import Theme from "./Theme.svelte";

  let dark = $state(false);
</script>

<Theme scheme={dark ? "dark" : "light"}><span>toggled</span></Theme>
```

Verified by:

```ts
const theme = screen.getByText("toggled").parentElement!;
expect(theme.getAttribute("data-theme")).toBe("light");
expect(theme.style.colorScheme).toBe("light");
dark = true;
flushSync();
expect(theme.getAttribute("data-theme")).toBe("dark");
expect(theme.style.colorScheme).toBe("dark");
dark = false;
flushSync();
expect(theme.getAttribute("data-theme")).toBe("light");
expect(theme.style.colorScheme).toBe("light");
```
<!-- sweater-vest:end Theme.svelte > toggles -->
