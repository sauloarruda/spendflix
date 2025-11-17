<script lang="ts">
  import "../app.css";
  import { afterNavigate } from "$app/navigation";
  import { onMount } from "svelte";

  onMount(() => {
    // Initialize Preline UI on mount
    if (typeof window !== "undefined" && window.HSStaticMethods) {
      window.HSStaticMethods.autoInit();
    }
  });

  // Reinitialize Preline UI after navigation
  afterNavigate(() => {
    if (typeof window !== "undefined" && window.HSStaticMethods) {
      window.HSStaticMethods.autoInit();
    }
  });
</script>

<slot />
