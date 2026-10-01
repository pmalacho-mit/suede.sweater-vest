// Shared state with runes, the Svelte 5 way: a class whose fields are `$state`.
export class Cart {
  items = $state<{ name: string; price: number }[]>([]);
  readonly total = $derived(
    this.items.reduce((sum, item) => sum + item.price, 0),
  );
  add(name: string, price: number) {
    this.items.push({ name, price });
  }
}
