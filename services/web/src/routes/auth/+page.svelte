<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Container from "$lib/components/preline/Container.svelte";
  import Input from "$lib/components/preline/Input.svelte";
  import Button from "$lib/components/preline/Button.svelte";
  import { browser } from "$app/environment";

  const API_URL = browser
    ? import.meta.env.VITE_API_URL || "http://localhost:3000"
    : "";

  let loading = $state(true);
  let name = $state("");
  let email = $state("");
  let submitting = $state(false);
  let error = $state<string | null>(null);
  let pendingConfirmation = $state(false);
  let confirmationCode = $state("");

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
          pendingConfirmation = true;
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
      {#if pendingConfirmation}
        <h2 class="text-xl font-semibold mb-6 text-center">
          Confirme seu email
        </h2>
        <p class="text-center mb-6">
          Olá <strong>{name}</strong>, enviamos um código de confirmação para
          <strong>{email}</strong>. Por favor, digite o código abaixo:
        </p>
        <div class="relative max-w-xs mx-auto">
          <Input
            type="text"
            id="confirmation-code"
            name="code"
            label="Código de confirmação"
            placeholder="Código de confirmação"
            required
            errorMessage="Por favor, insira o código de confirmação."
            bind:value={confirmationCode}
          />
        </div>
      {:else}
        <h2 class="text-xl font-semibold mb-6 text-center">
          Descubra, Organize, Realize
        </h2>

        <p class="text-center mb-6">
          Em menos de 20 minutos, você dará seu primeiro passo para descobrir
          para onde está indo seu dinheiro todo mês.
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
          <Button type="submit" loading={submitting} disabled={submitting}>
            Continuar
          </Button>
        </form>
      {/if}
    {/if}
  {/snippet}
</Container>
