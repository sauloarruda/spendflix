<script lang="ts">
  interface Props {
    loading?: boolean;
    loadingMessage?: string;
    maxWidth?: string;
    children?: import("svelte").Snippet;
  }

  let {
    loading = false,
    loadingMessage = "Carregando...",
    maxWidth = "max-w-md",
    children,
  }: Props = $props();
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
      <p class="text-center">{loadingMessage}</p>
    </div>
  {:else}
    {@render children()}
  {/if}
</div>
