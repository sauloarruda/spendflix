<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Container from "$lib/components/ds/Container.svelte";
  import Input from "$lib/components/ds/Input.svelte";
  import Button from "$lib/components/ds/Button.svelte";
  import { browser } from "$app/environment";

  let loading = $state(true);
  let name = $state("");
  let email = $state("");
  let confirmationCode = $state("");
  let submitting = $state(false);
  let error = $state<string | null>(null);

  onMount(() => {
    // Check if user already has tokens
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (accessToken && refreshToken) {
      // Already authenticated, redirect to home
      goto("/");
      return;
    }

    // Get name and email from query params
    if (browser) {
      const params = new URLSearchParams(window.location.search);
      name = params.get("name") || "";
      email = params.get("email") || "";

      if (!name || !email) {
        // Missing required params, redirect to signup
        goto("/auth");
        return;
      }
    }

    loading = false;
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitting = true;
    error = null;

    try {
      // TODO: Implement confirmation code submission
      console.log("Submitting confirmation code:", confirmationCode);
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
      <h2 class="text-xl font-semibold mb-6 text-center">Confirme seu email</h2>
      <p class="text-center mb-6">
        Olá <strong>{name}</strong>, enviamos um código de confirmação para
        <strong>{email}</strong>. Por favor, digite o código abaixo:
      </p>
      {#if error}
        <div class="error-message mb-4">{error}</div>
      {/if}

      <form onsubmit={handleSubmit} class="flex flex-col gap-6 my-8">
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
            disabled={submitting}
          />
        </div>
        <Button type="submit" loading={submitting} disabled={submitting}>
          Confirmar
        </Button>
      </form>
    {/if}
  {/snippet}
</Container>
