<script lang="ts">
  import { _ } from "$lib/i18n";

  interface Props {
    loading?: boolean;
    loadingMessage?: string;
    maxWidth?: string;
    children?: import("svelte").Snippet;
  }

  let {
    loading = false,
    loadingMessage = undefined,
    maxWidth = "max-w-md",
    children,
  }: Props = $props();

  // Use default loading message if not provided
  const defaultLoadingMessage = $derived(
    loadingMessage || $_("common.loading"),
  );
</script>

<div class="{maxWidth} mx-auto" style="position: relative;">
  {#if loading}
    <div class="flex flex-col items-center justify-center py-12">
      <div
        class="animate-spin inline-block size-8 border-[3px] border-current border-t-transparent text-primary rounded-full mb-4"
        role="status"
        aria-label="loading"
      >
        <span class="sr-only">Loading...</span>
      </div>
      <p class="text-center">{defaultLoadingMessage}</p>
    </div>
  {:else if children}
    {@render children()}
  {/if}
</div>
