<script lang="ts">
  // Every example component used as an app would use it, so a production build
  // carries them — and can be checked for carrying nothing of their tests.
  import { Cart } from "$lib/examples/cart.svelte.ts";
  import Async from "$lib/examples/Async.svelte";
  import Badge from "$lib/examples/Badge.svelte";
  import Card from "$lib/examples/Card.svelte";
  import CartSummary from "$lib/examples/CartSummary.svelte";
  import Clock from "$lib/examples/Clock.svelte";
  import Counter from "$lib/examples/Counter.svelte";
  import Example from "$lib/examples/Example.svelte";
  import Fade from "$lib/examples/Fade.svelte";
  import Form from "$lib/examples/Form.svelte";
  import Greeter from "$lib/examples/Greeter.svelte";
  import List from "$lib/examples/List.svelte";
  import Modal from "$lib/examples/Modal.svelte";
  import Stopwatch from "$lib/examples/Stopwatch.svelte";
  import Tabs from "$lib/examples/Tabs.svelte";
  import TextInput from "$lib/examples/TextInput.svelte";
  import ThemeProvider from "$lib/examples/ThemeProvider.svelte";
  import Themed from "$lib/examples/Themed.svelte";
  import Chip from "$lib/showcase/Chip.svelte";
  import Panel from "$lib/showcase/Panel.svelte";

  const cart = new Cart();
  let items = $state(["one", "two"]);
  let modal = $state(false);
</script>

<h1>Examples</h1>
<Greeter name="World" />
<Counter />
<TextInput label="Name" />
<Form onsubmit={(v) => console.log(v)} />
<Card title="Card"><p>body</p></Card>
<List {items} onremove={(i) => (items = items.filter((x) => x !== i))} />
<Async load={() => Promise.resolve(["a", "b"])} />
<Clock />
<ThemeProvider theme="dark"><Themed /></ThemeProvider>
<Fade />
<button onclick={() => (modal = true)}>Open modal</button>
<Modal bind:open={modal} title="Modal" />
<Tabs
  tabs={[
    { label: "A", content: "a" },
    { label: "B", content: "b" },
  ]}
/>
<Stopwatch />
<CartSummary {cart} />
<Badge tone="good">badge</Badge>
<Example value={1} />
<Chip label="chip" tone="good" />
<Panel title="panel" />
