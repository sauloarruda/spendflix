<script lang="ts">
  import "../app.css";
  import { afterNavigate } from "$app/navigation";
  import { onMount } from "svelte";
  import { waitLocale, getLocaleFromNavigator } from "svelte-i18n";
  let { children }: { children?: import("svelte").Snippet } = $props();
  let localeReady = $state(false);

  onMount(async () => {
    // Wait for i18n locale to load
    // Normalize locale (pt-BR -> pt, en-US -> en, etc.)
    const detectedLocale = getLocaleFromNavigator();
    const normalizedLocale = detectedLocale
      ? detectedLocale.split("-")[0].toLowerCase() === "pt"
        ? "pt"
        : detectedLocale.split("-")[0].toLowerCase() === "en"
          ? "en"
          : "en"
      : "en";
    await waitLocale(normalizedLocale);
    localeReady = true;

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

{#if localeReady && children}
  {@render children()}
{/if}
