<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Container from "$lib/components/ds/Container.svelte";
  import Input from "$lib/components/ds/Input.svelte";
  import Button from "$lib/components/ds/Button.svelte";
  import { browser } from "$app/environment";
  import { _ } from "$lib/i18n";
  import { translateApiError } from "$lib/i18n/helpers";

  // Get API URL from environment variable (set at build time)
  // Fallback to default localhost:3000 for development
  const API_URL = browser
    ? import.meta.env.VITE_API_URL || "http://localhost:3000"
    : "";

  // Debug: log API URL in development
  if (browser && import.meta.env.DEV) {
    console.log("API_URL:", API_URL);
  }

  let loading = $state(true);
  let name = $state("");
  let email = $state("");
  let submitting = $state(false);
  let error = $state<string | null>(null);

  // Validation states
  let nameValid = $state(false);
  let emailValid = $state(false);

  // Computed: form is valid when both fields are valid
  $effect(() => {
    // Validate name: at least 2 characters
    nameValid = name.trim().length >= 2;

    // Validate email: valid email format
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      emailValid = emailRegex.test(email.trim());
    } else {
      emailValid = false;
    }
  });

  const isFormValid = $derived(nameValid && emailValid);

  onMount(() => {
    // Check if user already has tokens
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (accessToken && refreshToken) {
      // Already authenticated, redirect to home
      goto("/");
    } else {
      loading = false;
    }
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitting = true;
    error = null;

    try {
      const response = await fetch(`${API_URL}/auth/sign-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.status === "pending_confirmation") {
          // Redirect to confirmation page with name and email
          goto(
            `/auth/confirmation?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`,
          );
        } else {
          // User created successfully
          // TODO: Handle success case
        }
      } else {
        // Traduz erro baseado no código retornado pela API
        error = translateApiError(data.code, data.message);
        // TODO: Redirect to login page if user_exists
      }
    } catch (err) {
      error = $_("auth.signup.errors.connectionError");
    } finally {
      submitting = false;
    }
  }
</script>

<Container {loading}>
  {#snippet children()}
    {#if !loading}
      <h2 class="text-xl font-semibold mb-6 text-center">
        {$_("auth.signup.title")}
      </h2>

      <p class="text-center mb-6">
        {$_("auth.signup.description")}
      </p>

      {#if error}
        <div class="error-message mb-4">{error}</div>
      {/if}

      <form onsubmit={handleSubmit} class="flex flex-col gap-6 my-8">
        <div class="relative">
          <Input
            type="text"
            id="name"
            name="name"
            label={$_("auth.signup.fields.name.label")}
            placeholder={$_("auth.signup.fields.name.placeholder")}
            required
            minlength={2}
            errorMessage={$_("auth.signup.fields.name.error")}
            bind:value={name}
            disabled={submitting}
          />
        </div>
        <div class="relative">
          <Input
            type="email"
            id="email"
            name="email"
            label={$_("auth.signup.fields.email.label")}
            placeholder={$_("auth.signup.fields.email.placeholder")}
            required
            errorMessage={$_("auth.signup.fields.email.error")}
            bind:value={email}
            disabled={submitting}
          />
        </div>
        <Button
          type="submit"
          loading={submitting}
          disabled={submitting || !isFormValid}
        >
          {$_("common.continue")}
        </Button>
      </form>
    {/if}
  {/snippet}
</Container>
