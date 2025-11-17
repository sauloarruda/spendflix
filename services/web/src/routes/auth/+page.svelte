<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Container from "$lib/components/ds/Container.svelte";
  import Input from "$lib/components/ds/Input.svelte";
  import Button from "$lib/components/ds/Button.svelte";
  import { browser } from "$app/environment";

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
        if (data.code === "user_exists") {
          error = "Este email já está cadastrado. Por favor, faça login.";
          // TODO: Redirect to login page
        } else {
          error =
            data.message || "Ocorreu um erro ao processar sua solicitação.";
        }
      }
    } catch (err) {
      error =
        "Não foi possível conectar ao servidor. Por favor, verifique sua conexão e tente novamente.";
    } finally {
      submitting = false;
    }
  }
</script>

<Container {loading} loadingMessage="Carregando...">
  {#snippet children()}
    {#if !loading}
      <h2 class="text-xl font-semibold mb-6 text-center">
        Descubra, Organize, Realize
      </h2>

      <p class="text-center mb-6">
        Em menos de 20 minutos, você dará seu primeiro passo para descobrir para
        onde está indo seu dinheiro todo mês.
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
            label="Como podemos te chamar?"
            placeholder="Como podemos te chamar?"
            required
            minlength={2}
            errorMessage="Por favor, nos diga como podemos te chamar."
            bind:value={name}
            disabled={submitting}
          />
        </div>
        <div class="relative">
          <Input
            type="email"
            id="email"
            name="email"
            label="Seu melhor email"
            placeholder="Seu melhor email"
            required
            errorMessage="Por favor, insira um email válido."
            bind:value={email}
            disabled={submitting}
          />
        </div>
        <Button
          type="submit"
          loading={submitting}
          disabled={submitting || !isFormValid}
        >
          Continuar
        </Button>
      </form>
    {/if}
  {/snippet}
</Container>
