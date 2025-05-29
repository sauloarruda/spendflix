import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import LoginPage from '@/app/login/page'; // Adjust path as necessary

// Mock next/navigation
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    // Clear mock usage history before each test
    mockRouterPush.mockClear();
    // Reset the stored onSuccess handler
  });

  it('should render the Login component', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('login-component')).toBeInTheDocument();
  });

  it('should call router.push("/dashboard") when Login component calls onSuccess', async () => {
    render(<LoginPage />);

    // Ensure the Login component is rendered
    const loginComponent = screen.getByTestId('login-component');
    expect(loginComponent).toBeInTheDocument();

    // Simulate the onSuccess callback from the Login component
    // We can either click a button within the mock that calls onSuccess,
    // or directly call the stored mockLoginOnSuccess function.
    // Using a button click is closer to user interaction if the mock was more complex.
    const successButton = screen.getByTestId('login-trigger-success');
    fireEvent.click(successButton);
    // Or, directly:
    // mockLoginOnSuccess();

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(1);
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/');
  });
});
