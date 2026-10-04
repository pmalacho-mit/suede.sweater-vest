# sweater-vest: A svelte testing utility



Sweater vest (<ins style="color:white"><span style="color:#aa1e1e"><span>**S**</span><sup style="color:grey">weater</sup> <span style="color:#aa1e1e">**v**</span><sub style="color:#aa1e1e">_elte_</sub></span> <sub style="">_t_</sub><span style="text-">est</span></ins>) is a [svelte](https://svelte.dev/) utility that simplifies testing svelte components in browser environments, specifically when you're testing multiple components together and/or within complex markup.

This repo is a [suede dependency](https://github.com/pmalacho-mit/suede). 

To see the installable source code, please checkout the [release branch](https://github.com/pmalacho-mit/suede.sweater-vest/tree/release).

## Installation

```bash
bash <(curl -fsSL https://suede.sh/install/release) --repo pmalacho-mit/suede.sweater-vest
```

<details>
<summary>
See alternative to using <a href="https://github.com/pmalacho-mit/suede#suedesh">suede.sh</a> script proxy
</summary>

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/pmalacho-mit/suede/refs/heads/main/scripts/install/release.sh) --repo pmalacho-mit/suede.sweater-vest
```

</details>

The library lives in [release/](./release/README.md); this repository is where
it is developed.

- [src/lib/examples](./src/lib/examples): one component per testing pattern,
  each with its test snippets — Testing Library's canonical cases, forms,
  bindable props, context, transitions, dialogs, keyboard navigation, instance
  methods, shared runes state. The library's README lists them.
- [release/components](./release/components): the library's own components
  for tests (`Sweater.Status`, `Frame`, `Stage`, `Row`, `Column`, `Grid`,
  `Labeled`, `Theme`, `Inspect`), each tested and documented by snippets of
  its own — the library bootstrapping itself. `vite.config.ts` sets
  `_scanSelf` so this repository collects them.
- [src/lib/showcase](./src/lib/showcase): the same components used from a
  component of an app's own, as `typeof Sweater.<Name>`.
- [src/routes/vests](./src/routes/vests): every snippet on a page of its own
  (`/vests`), running its test live.
- [src/routes/examples](./src/routes/examples): the example components used as
  an app would use them, so a production build can be checked for carrying
  nothing of their tests.

```sh
npm run dev      # the dev server, with pages at /vests and the components at /examples
npm test         # Vitest: the examples' and release components' snippet tests (jsdom), and the library's namespace tests
npm run report   # with the dev server up: every snippet in a real browser → fashion-show.md
npm run check    # svelte-check
npm run build    # then grep .svelte-kit/output for __pocket, createDeferred, dsl.import.meta.vitest: none
```
