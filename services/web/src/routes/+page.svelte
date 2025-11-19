<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Container from "$lib/components/ds/Container.svelte";
  import { _ } from "$lib/i18n";

  let loading = $state(true);

  onMount(() => {
    // Check if user has valid tokens
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!accessToken || !refreshToken) {
      // No tokens, redirect to auth
      goto("/auth");
    } else {
      // Has tokens, show home content
      loading = false;
    }
  });
</script>

<Container {loading}>
  {#snippet children()}
    <div>
      <h2 class="text-xl font-semibold mb-6 text-center">
        {$_("home.welcome")}
      </h2>
      <p class="text-center mb-6">
        {$_("home.ready")}
      </p>
    </div>
  {/snippet}
</Container>
