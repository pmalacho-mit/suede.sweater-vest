# sweater-vest-suede

The library lives in [release/](./release/README.md); this repository is where
it is developed.

- [src/lib/examples](./src/lib/examples): one component per testing pattern,
  each with its test snippets — Testing Library's canonical cases, forms,
  bindable props, context, transitions, dialogs, keyboard navigation, instance
  methods, shared runes state. The library's README lists them.
- [src/routes/vests](./src/routes/vests): every snippet on a page of its own
  (`/vests`), running its test live.
- [src/routes/examples](./src/routes/examples): the example components used as
  an app would use them, so a production build can be checked for carrying
  nothing of their tests.

```sh
npm run dev      # the dev server, with pages at /vests and the components at /examples
npm test         # Vitest: the examples' snippet tests (jsdom) and the library's own namespace tests
npm run report   # with the dev server up: every snippet in a real browser → fashion-show.md
npm run check    # svelte-check
npm run build    # then grep .svelte-kit/output for __pocket, createDeferred, dsl.import.meta.vitest: none
```
