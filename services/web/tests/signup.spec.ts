import { test, expect, Page } from '@playwright/test';

// Test helpers
const getFormElements = (page: Page) => ({
  nameInput: page.locator('input[name="name"]'),
  emailInput: page.locator('input[name="email"]'),
  submitButton: page.locator('button[type="submit"]'),
  loadingIndicator: page.locator('button[type="submit"] .animate-spin'),
});

const fillForm = async (page: Page, name: string, email: string) => {
  const { nameInput, emailInput } = getFormElements(page);
  await nameInput.fill(name);
  await emailInput.fill(email);
};

const submitForm = async (page: Page) => {
  const { submitButton } = getFormElements(page);
  // Wait for button to be enabled
  await expect(submitButton).toBeEnabled();
  
  // Listen for network requests before submitting
  const requestPromise = page.waitForRequest(
    (request) => request.url().includes('/auth/sign-up') && request.method() === 'POST',
    { timeout: 5000 }
  );
  
  // Submit form by clicking button
  await submitButton.click();
  
  // Wait for the request to be made
  try {
    await requestPromise;
  } catch (e) {
    // If clicking didn't trigger the request, try submitting the form directly
    await page.locator('form').evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
    });
  }
};

const waitForButtonLoading = async (page: Page, shouldBeLoading: boolean) => {
  const { loadingIndicator, submitButton } = getFormElements(page);
  if (shouldBeLoading) {
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
    await expect(submitButton).toBeDisabled();
  } else {
    await expect(loadingIndicator).toBeHidden({ timeout: 2000 });
    await expect(submitButton).toBeEnabled();
  }
};

const waitForValidation = async (page: Page, delay = 50) => {
  await page.waitForTimeout(delay);
};

const validateField = async (
  page: Page,
  input: ReturnType<typeof getFormElements>['nameInput'] | ReturnType<typeof getFormElements>['emailInput'],
  value: string,
  errorMessage: string,
  shouldShowError: boolean
) => {
  await input.fill(value);
  await input.blur();
  await waitForValidation(page);

  if (shouldShowError) {
    await expect(page.getByText(errorMessage)).toBeVisible();
    await expect(input).toHaveClass(/hs-input-error/);
  } else {
    await expect(page.getByText(errorMessage)).not.toBeVisible();
    await expect(input).toHaveClass(/hs-input-success/);
  }
};

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded', timeout: 10000 });
    // Wait for form inputs to be rendered
    await page.waitForSelector('input[name="name"]', { state: 'attached', timeout: 10000 });
    await page.waitForSelector('input[name="email"]', { state: 'attached', timeout: 10000 });
    await page.waitForSelector('button[type="submit"]', { state: 'attached', timeout: 10000 });
    // Wait for loading to disappear
    await page.waitForFunction(() => {
      const form = document.querySelector('form');
      return form && !form.querySelector('.animate-spin[role="status"]');
    }, { timeout: 10000 });
  });

  test('should display signup form with floating inputs', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Descubra, Organize, Realize' })).toBeVisible();

    const { nameInput, emailInput, submitButton } = getFormElements(page);
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText('Continuar');
  });

  test('should validate name field - show error for short name', async ({ page }) => {
    const { nameInput } = getFormElements(page);
    await validateField(
      page,
      nameInput,
      'A',
      'Por favor, nos diga como podemos te chamar.',
      true
    );
  });

  test('should validate name field - accept valid name', async ({ page }) => {
    const { nameInput } = getFormElements(page);
    await validateField(
      page,
      nameInput,
      'João Silva',
      'Por favor, nos diga como podemos te chamar.',
      false
    );
  });

  test('should validate email field - show error for invalid email', async ({ page }) => {
    const { emailInput } = getFormElements(page);
    await validateField(
      page,
      emailInput,
      'invalid-email',
      'Por favor, insira um email válido.',
      true
    );
  });

  test('should validate email field - accept valid email', async ({ page }) => {
    const { emailInput } = getFormElements(page);
    await validateField(
      page,
      emailInput,
      'joao@example.com',
      'Por favor, insira um email válido.',
      false
    );
  });

  test('should clear errors when user starts typing', async ({ page }) => {
    const { emailInput } = getFormElements(page);

    // Trigger validation error
    await emailInput.fill('invalid');
    await emailInput.blur();
    await waitForValidation(page, 100);
    await expect(page.getByText('Por favor, insira um email válido.')).toBeVisible();

    // Start typing again - error should be cleared
    await emailInput.fill('valid@');
    await expect(page.getByText('Por favor, insira um email válido.')).not.toBeVisible();
  });

  test('should submit form successfully and show confirmation code screen', async ({ page }) => {
    const formData = { name: 'João Silva', email: 'joao.silva@example.com' };
    await fillForm(page, formData.name, formData.email);

    // Verify form values are set
    const { nameInput, emailInput } = getFormElements(page);
    await expect(nameInput).toHaveValue(formData.name);
    await expect(emailInput).toHaveValue(formData.email);

    // Start listening for API response BEFORE submitting
    const apiCallPromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        const method = response.request().method();
        const matches = url.includes('/auth/sign-up') && method === 'POST';
        if (matches) {
          console.log('API response detected:', url, method, response.status());
        }
        return matches;
      },
      { timeout: 20000 }
    );

    // Also listen for requests
    const requestPromise = page.waitForRequest(
      (request) => {
        const url = request.url();
        const method = request.method();
        const matches = url.includes('/auth/sign-up') && method === 'POST';
        if (matches) {
          console.log('Request detected:', url, method);
        }
        return matches;
      },
      { timeout: 20000 }
    );

    // Submit form
    await submitForm(page);

    // Wait for request first
    const request = await requestPromise;
    console.log('Request made to:', request.url());
    
    // Then wait for response (with error handling)
    let apiResponse;
    try {
      apiResponse = await apiCallPromise;
      console.log('Response received:', apiResponse.status(), apiResponse.statusText());
    } catch (error) {
      // Log network errors for debugging
      const response = await request.response();
      if (response) {
        console.log('Response status:', response.status(), response.statusText());
      } else {
        console.log('No response received - possible CORS or network error');
      }
      throw error;
    }

    // Verify API was called with correct data
    const requestData = request.postDataJSON();
    expect(requestData).toMatchObject(formData);
    expect(apiResponse.status()).toBeGreaterThanOrEqual(200);
    expect(apiResponse.status()).toBeLessThan(300);

    // Wait for redirect to confirmation page
    await page.waitForURL('**/auth/confirmation*', { timeout: 10000 });
    
    // Wait for confirmation screen to appear
    await page.waitForSelector('h2:has-text("Confirme seu email")', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Confirme seu email' })).toBeVisible();
    await expect(page.getByText(/Olá.*João Silva.*enviamos um código/)).toBeVisible();
    await expect(page.getByText(/joao.silva@example.com/)).toBeVisible();
    await expect(page.locator('input[name="code"]')).toBeVisible();
  });

  test('should show error message when API returns error', async ({ page }) => {
    const errorMessage = 'Este email já está cadastrado. Por favor, faça login.';
    await fillForm(page, 'Test User', 'existing@example.com');

    // Mock API error response
    await page.route('**/auth/sign-up', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'user_exists',
          message: 'User with this email already exists',
        }),
      });
    });

    await submitForm(page);

    // Wait for error message to appear
    await page.waitForSelector('.error-message', { timeout: 10000 });

    // Verify error is displayed and form is still visible
    await expect(page.getByText(/Este email já está cadastrado/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Descubra, Organize, Realize' })).toBeVisible();

    const { nameInput, emailInput } = getFormElements(page);
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
  });

  test('should show loading indicator during form submission', async ({ page }) => {
    await fillForm(page, 'Test User', 'test@example.com');

    // Delay API response to see loading indicator
    let routeResolved = false;
    await page.route('**/auth/sign-up', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      routeResolved = true;
      await route.continue();
    });

    // Start listening for response before submitting
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/auth/sign-up') && response.status() >= 200 && response.status() < 300,
      { timeout: 15000 }
    );

    await submitForm(page);

    // Verify loading indicator appears in button and form is disabled
    await waitForButtonLoading(page, true);
    const { nameInput, emailInput } = getFormElements(page);
    await expect(nameInput).toBeDisabled();
    await expect(emailInput).toBeDisabled();

    // Wait for response
    await responsePromise;
    
    // After successful signup, page redirects to confirmation
    // So inputs won't exist anymore - verify redirect instead
    await page.waitForURL('**/auth/confirmation*', { timeout: 10000 });
    
    // Verify we're on the confirmation page
    await expect(page.getByRole('heading', { name: 'Confirme seu email' })).toBeVisible();
  });

  test('should show error message when server is offline', async ({ page }) => {
    const formData = { name: 'Test User', email: 'test@example.com' };
    await fillForm(page, formData.name, formData.email);

    // Simulate server offline by aborting the request
    await page.route('**/auth/sign-up', async (route) => {
      await route.abort('failed');
    });

    await submitForm(page);

    // Wait for error message to appear
    await page.waitForTimeout(1000); // Give HTMX time to process the error

    // Verify connection error message is displayed
    await expect(page.getByText(/Não foi possível conectar ao servidor/)).toBeVisible({ timeout: 5000 });

    // Verify form is still visible and re-enabled
    await expect(page.getByRole('heading', { name: 'Descubra, Organize, Realize' })).toBeVisible();

    const { nameInput, emailInput, submitButton } = getFormElements(page);
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(nameInput).toBeEnabled();
    await expect(emailInput).toBeEnabled();
    await expect(submitButton).toBeEnabled();

    // Verify form values are preserved
    await expect(nameInput).toHaveValue(formData.name);
    await expect(emailInput).toHaveValue(formData.email);
  });
});

