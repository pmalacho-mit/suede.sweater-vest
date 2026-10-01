<script lang="ts">
  import type Self from "./Form.svelte";
  import type { Test, Widen } from "../../../release/dsl.import.meta.vitest";

  type Values = { email: string; plan: "free" | "pro"; terms: boolean };

  let { onsubmit }: { onsubmit: (values: Values) => void } = $props();

  let email = $state("");
  let plan = $state<Values["plan"]>("free");
  let terms = $state(false);
  let error = $state<string | null>(null);

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!email.includes("@")) return void (error = "enter an email address");
    if (!terms) return void (error = "accept the terms");
    error = null;
    onsubmit({ email, plan, terms });
  };
</script>

<form onsubmit={submit}>
  <label>Email <input type="email" bind:value={email} /></label>
  <label>
    Plan
    <select bind:value={plan}>
      <option value="free">Free</option>
      <option value="pro">Pro</option>
    </select>
  </label>
  <label
    ><input type="checkbox" bind:checked={terms} /> I accept the terms</label
  >
  {#if error}<p role="alert">{error}</p>{/if}
  <button>Sign up</button>
</form>

<!-- a form: typing, selecting, checking, submitting, and the messages in between -->
{#snippet validates(
  Form: typeof Self,
  pocket: { submitted?: { email: string; plan: string; terms: boolean } },
  test: Test,
)}
  <Form onsubmit={(values) => (pocket.submitted = values)} />
  {test(async ({ expect, user, screen }) => {
    const submit = screen.getByRole("button", { name: "Sign up" });
    await user.click(submit);
    expect(screen.getByRole("alert").textContent).toBe(
      "enter an email address",
    );
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.click(submit);
    expect(screen.getByRole("alert").textContent).toBe("accept the terms");
    await user.selectOptions(screen.getByLabelText("Plan"), "pro");
    await user.click(screen.getByLabelText("I accept the terms"));
    await user.click(submit);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(pocket.submitted).toEqual({
      email: "ada@example.com",
      plan: "pro",
      terms: true,
    });
  })}
{/snippet}
