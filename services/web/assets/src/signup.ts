/**
 * Signup - Specific logic for signup page
 * 
 * Handles:
 * - Response transformation for Mustache templates (adds helper flags)
 * - Signup-specific HTMX event handling
 */

console.log('signup.ts loaded');

// Transform response data before Mustache processes it
document.body.addEventListener('htmx:beforeSwap', (event: any) => {
  const xhr = event.detail.xhr;

  try {
    const response = JSON.parse(xhr.responseText);

    // Check if user already exists and is confirmed (should redirect to login)
    if (xhr.status === 409 && response.code === 'user_exists') {
      // User exists and is confirmed - redirect to login
      // TODO: Implement login page redirect
      // For now, show error message
      event.preventDefault();
      const formValues = getFormValues();
      showError({
        code: 'user_exists',
        message: 'Este email já está cadastrado. Por favor, faça login.',
      }, formValues);
      return;
    }

    // Add helper flag for pending confirmation status
    if (response.status === 'pending_confirmation') {
      response.isPendingConfirmation = true;
    }
    // Update the response that Mustache will process
    event.detail.serverResponse = JSON.stringify(response);
  } catch (e) {
    // Ignore parsing errors
  }
});

// Helper function to get form field values and API URL
function getFormValues(): { name: string; email: string; apiUrl: string } {
  const nameInput = document.querySelector('spf-input#name input') as HTMLInputElement;
  const emailInput = document.querySelector('spf-input#email input') as HTMLInputElement;
  const form = document.querySelector('form[hx-post]') as HTMLFormElement;
  const hxPost = form?.getAttribute('hx-post') || '';
  const apiUrl = hxPost.replace('/auth/sign-up', '');

  return {
    name: nameInput?.value || '',
    email: emailInput?.value || '',
    apiUrl,
  };
}

// Handle error responses - force swap even on error status codes
document.body.addEventListener('htmx:responseError', (event: any) => {
  const xhr = event.detail.xhr;
  if (!xhr) return;

  try {
    const response = JSON.parse(xhr.responseText);
    event.preventDefault(); // Prevent HTMX default swap
    showError(response, getFormValues());
  } catch (e) {
    console.error('Error processing error response:', e);
  }
});

// Handle network errors (server offline, connection failed, etc.)
document.body.addEventListener('htmx:sendError', (event: any) => {
  console.log('HTMX sendError event (body listener):', event.detail);
  console.log('Event target:', event.target);
  console.log('Event currentTarget:', event.currentTarget);

  // Check if this is for our signup form
  const form = document.querySelector('form[hx-post*="/auth/sign-up"]');
  if (!form) {
    console.log('Signup form not found, ignoring error');
    return;
  }

  event.preventDefault(); // Prevent HTMX default behavior
  event.stopPropagation(); // Stop event propagation

  const formValues = getFormValues();
  console.log('Calling showError with formValues:', formValues);

  showError({
    code: 'connection_error',
    message: 'Não foi possível conectar ao servidor. Por favor, verifique sua conexão e tente novamente.',
  }, formValues);
});

// Also listen for network errors on the form itself (capture phase)
document.addEventListener('htmx:sendError', (event: any) => {
  const target = event.target as HTMLElement;
  if (target && target.closest && target.closest('form[hx-post*="/auth/sign-up"]')) {
    console.log('HTMX sendError on signup form (capture):', event.detail);
    event.preventDefault();
    event.stopPropagation();
    showError({
      code: 'connection_error',
      message: 'Não foi possível conectar ao servidor. Por favor, verifique sua conexão e tente novamente.',
    }, getFormValues());
  }
}, true); // Use capture phase

// Also listen for afterRequest to catch any errors
document.body.addEventListener('htmx:afterRequest', (event: any) => {
  const xhr = event.detail.xhr;
  const elt = event.detail.elt;

  console.log('HTMX afterRequest:', { status: xhr?.status, elt });

  if (xhr && xhr.status === 0) {
    // Status 0 usually means network error
    console.log('HTMX afterRequest with status 0 (network error)');
    const form = elt?.closest?.('form[hx-post*="/auth/sign-up"]') ||
      document.querySelector('form[hx-post*="/auth/sign-up"]');

    if (form) {
      console.log('Found signup form, showing error');
      event.preventDefault();
      showError({
        code: 'connection_error',
        message: 'Não foi possível conectar ao servidor. Por favor, verifique sua conexão e tente novamente.',
      }, getFormValues());
    } else {
      console.log('Signup form not found in afterRequest');
    }
  }
});

// Helper function to show error message
function showError(error: { code: string; message: string }, formValues?: { name: string; email: string; apiUrl: string }) {
  const target = document.querySelector('#signup-form');
  const Mustache = (window as any).Mustache;

  console.log('showError called:', { error, target, Mustache: !!Mustache });

  if (!target) {
    console.error('Target #signup-form not found');
    return;
  }

  if (!Mustache) {
    console.error('Mustache not available');
    return;
  }

  // Try to find template - it might be inside spf-container or outside
  let template = document.querySelector('#response-template') as HTMLTemplateElement;
  if (!template) {
    // Try finding it inside the container
    template = target.querySelector('#response-template') as HTMLTemplateElement;
  }
  if (!template) {
    // Try finding it anywhere in the document
    template = document.querySelector('template#response-template') as HTMLTemplateElement;
  }
  if (!template) {
    console.error('Template #response-template not found anywhere');
    // Fallback: show error directly without template
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message mb-4';
    errorDiv.textContent = error.message;
    const form = target.querySelector('form');
    if (form && form.parentElement) {
      form.parentElement.insertBefore(errorDiv, form);
    }
    return;
  }

  // Merge error with form values for template rendering
  const templateData = {
    ...error,
    Name: formValues?.name || '',
    Email: formValues?.email || '',
    API_URL: formValues?.apiUrl || '',
  };

  console.log('Template data:', templateData);

  const templateContent = template.innerHTML;
  const rendered = Mustache.render(templateContent, templateData);

  // Update the content inside spf-container
  // The spf-container has a contentWrapper div that we need to update
  const container = target as HTMLElement;

  // Find the content wrapper - it's the div that's not the spinner
  const spinner = container.querySelector('.spinner')?.parentElement as HTMLElement;
  const allDivs = Array.from(container.children) as HTMLElement[];
  const contentWrapper = allDivs.find(div => div !== spinner && div.tagName === 'DIV');

  if (contentWrapper) {
    // The rendered content needs to match the original structure
    // Original structure: <div style="display: none;"><h2>...</h2><p>...</p><div>...</div></div>
    // So we wrap the rendered content in the same structure
    contentWrapper.innerHTML = `
      <div style="display: none;">
        ${rendered}
      </div>
    `;

    // Make sure it's visible and preserve container classes
    const containerClasses = Array.from(container.classList).filter(cls =>
      cls.includes('max-w') || cls.includes('mx-auto') || cls.includes('w-')
    );
    // Preserve existing classes and add container classes
    const existingClasses = Array.from(contentWrapper.classList).filter(cls =>
      !cls.includes('max-w') && !cls.includes('mx-auto') && !cls.includes('w-') && cls !== 'hidden'
    );
    contentWrapper.className = [...existingClasses, ...containerClasses].join(' ');
    contentWrapper.style.display = '';
    contentWrapper.classList.remove('hidden');

    // Hide spinner if present
    if (spinner) {
      spinner.style.display = 'none';
    }

    // Now show the inner div (remove display:none)
    const innerDiv = contentWrapper.querySelector('div[style*="display: none"]') as HTMLElement;
    if (innerDiv) {
      innerDiv.style.display = '';
      innerDiv.classList.remove('hidden');
    }

    console.log('Error message rendered and displayed');
  } else {
    // Fallback: recreate the structure that spf-container expects
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12" style="display: none;">
        <div class="animate-spin inline-block size-8 border-[3px] border-current border-t-transparent text-primary rounded-full mb-4" role="status" aria-label="loading">
          <span class="sr-only">Loading...</span>
        </div>
        <p class="text-center">Carregando...</p>
      </div>
      <div class="max-w-md mx-auto">
        <div style="display: none;">
          ${rendered}
        </div>
      </div>
    `;
    // Show the content
    const fallbackContent = container.querySelector('div.max-w-md')?.querySelector('div[style*="display: none"]') as HTMLElement;
    if (fallbackContent) {
      fallbackContent.style.display = '';
    }
    console.log('Error message rendered (fallback)');
  }

  // Wait for web components to initialize, then restore form values
  setTimeout(() => {
    if (!formValues) return;

    const nameInput = document.querySelector('spf-input#name input') as HTMLInputElement;
    const emailInput = document.querySelector('spf-input#email input') as HTMLInputElement;

    if (nameInput && formValues.name) {
      nameInput.value = formValues.name;
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (emailInput && formValues.email) {
      emailInput.value = formValues.email;
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Trigger HTMX afterSwap to reinitialize components
    const afterSwapEvent = new CustomEvent('htmx:afterSwap', {
      detail: { target }
    });
    document.body.dispatchEvent(afterSwapEvent);
  }, 50);
}

