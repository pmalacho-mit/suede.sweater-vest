<script lang="ts">
  import type Self from "./Themed.svelte";
  import type { Test } from "../../../release/dsl.import.meta.vitest";
  import type ThemeProvider from "./ThemeProvider.svelte";
  import { getContext } from "svelte";

  const theme = getContext<"light" | "dark">("theme") ?? "light";
</script>

<p data-theme={theme}>theme: {theme}</p>

<!-- context: a provider component, imported as a type, wraps the component under test -->
{#snippet provided(
  Themed: typeof Self,
  Provider: typeof ThemeProvider,
  test: Test,
)}
  <Provider theme="dark"><Themed /></Provider>
  {test(async ({ expect, screen }) => {
    expect(screen.getByText("theme: dark").dataset.theme).toBe("dark");
  })}
{/snippet}

{#snippet unprovided(Themed: typeof Self, test: Test)}
  <Themed />
  {test(async ({ expect, screen }) => {
    expect(screen.getByText("theme: light")).toBeDefined();
  })}
{/snippet}
