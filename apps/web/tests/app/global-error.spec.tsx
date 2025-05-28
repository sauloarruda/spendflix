import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import GlobalError from '@/app/global-error'; // Adjust path as necessary

describe('GlobalError Component', () => {
  const mockError = new Error('Test error message');
  (mockError as Error & { digest?: string }).digest = 'test-digest';
  const mockReset = jest.fn();
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console.error before each test
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Clear any previous mock calls
    mockReset.mockClear();
  });

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should log the error to the console', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
  });

  it('should render the main error message heading', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    // The component renders <html><body><h2>... so we search for the h2 content.
    const headingElement = screen.getByRole('heading', { level: 2, name: /something went wrong!/i });
    expect(headingElement).toBeInTheDocument();
  });

  it('should render the "Try again" button', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    const buttonElement = screen.getByRole('button', { name: /try again/i });
    expect(buttonElement).toBeInTheDocument();
  });

  it('should call the reset function when "Try again" button is clicked', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    const buttonElement = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(buttonElement);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  // Test that html and body tags are present as per Next.js requirements for global-error
  it('should render html and body tags at the document level', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    // For global error components, Next.js expects full html and body tags.
    // JSDOM, when rendering such a component, might make these the document's root elements.
    // We check if these elements exist in the document and contain our component's content.
    
    // document.documentElement refers to the <html> tag of the document
    expect(document.documentElement).toBeInTheDocument();
    // document.body refers to the <body> tag of the document
    expect(document.body).toBeInTheDocument();

    // Verify that the content of our component is rendered within this structure
    expect(screen.getByRole('heading', { name: /something went wrong!/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    // Check if the document's body is indeed the one from our component (optional, might be fragile)
    // This checks if the h2 is a child of document.body directly or indirectly.
    expect(document.body.contains(screen.getByRole('heading', { name: /something went wrong!/i }))).toBe(true);
  });
});
