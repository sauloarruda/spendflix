<script lang="ts">
  interface Props {
    type?: "text" | "email" | "password";
    id: string;
    name: string;
    label: string;
    placeholder?: string;
    value?: string;
    required?: boolean;
    minlength?: number;
    errorMessage?: string;
    size?: "small" | "default" | "large";
    disabled?: boolean;
  }

  let {
    type = "text",
    id,
    name,
    label,
    placeholder = "",
    value = $bindable(""),
    required = false,
    minlength = undefined,
    errorMessage = "",
    size = "default",
    disabled = false,
  }: Props = $props();

  let error = $state<string | null>(null);
  let touched = $state(false);

  const sizeClasses = {
    small: "py-1.5 sm:py-2 px-3",
    default: "py-2.5 sm:py-3 px-4",
    large: "p-3.5 sm:p-5",
  };

  const paddingClass = sizeClasses[size];

  function validate() {
    if (!touched) return;

    if (required && !value.trim()) {
      error = errorMessage || "Este campo é obrigatório.";
      return false;
    }

    if (type === "email" && value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        error = errorMessage || "Por favor, insira um email válido.";
        return false;
      }
    }

    if (
      minlength &&
      value.trim().length > 0 &&
      value.trim().length < minlength
    ) {
      error =
        errorMessage ||
        `Este campo deve ter pelo menos ${minlength} caracteres.`;
      return false;
    }

    error = null;
    return true;
  }

  function handleBlur() {
    touched = true;
    validate();
  }

  function handleInput() {
    // bind:value handles the value update automatically
    // Only clear error if one exists
    if (error) {
      error = null;
    }
  }

  $effect(() => {
    if (touched) {
      validate();
    }
  });
</script>

<div class="relative">
  <input
    {type}
    {id}
    {name}
    {placeholder}
    {required}
    {minlength}
    {disabled}
    bind:value
    onblur={handleBlur}
    oninput={handleInput}
    class="peer {paddingClass} block w-full border rounded-lg sm:text-sm placeholder:text-transparent focus:pt-6 focus:pb-2 [&:not(:placeholder-shown)]:pt-6 [&:not(:placeholder-shown)]:pb-2 {error
      ? 'hs-input-error'
      : touched && !error && value.trim()
        ? 'hs-input-success'
        : ''}"
  />
  <label
    for={id}
    class="absolute top-0 start-0 {paddingClass} h-full text-sm pointer-events-none transition origin-[0_0] peer-focus:scale-90 peer-focus:-translate-y-1.5 peer-[&:not(:placeholder-shown)]:scale-90 peer-[&:not(:placeholder-shown)]:-translate-y-1.5"
  >
    {label}
  </label>
  {#if error}
    <div class="mt-2 flex items-center text-xs text-red-600">
      <svg
        class="flex-shrink-0 size-4 me-1"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
        />
      </svg>
      <span>{error}</span>
    </div>
  {/if}
</div>
