import { render, screen, waitFor, act } from '@testing-library/react'; // Added act for completeness, though might not be strictly needed if useEffect is simple
import React from 'react';

// Define mockUpdateOnboardingAction before it's used in jest.mock
const mockUpdateOnboardingAction = jest.fn().mockResolvedValue({});

// Import the component to be tested AFTER defining mocks for its dependencies
import { updateOnboardingAction } from '@/actions/onboarding'; // This import is for type safety or direct use if needed, actual mock is below
import WaitlistPage from '@/app/onboarding/waitlist/page';


const mockRouterPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Now, mock the module using the pre-defined mock function
jest.mock('@/actions/onboarding', () => ({
  updateOnboardingAction: mockUpdateOnboardingAction,
}));

const TEST_ONBOARDING_UID = 'test-onboarding-uid-waitlist';
const TEST_NAME = 'Test User';

describe('WaitlistPage', () => {
  let localStorageMock: Storage;

  beforeEach(() => {
    jest.clearAllMocks(); // Clears all mocks, including mockUpdateOnboardingAction
    // Re-assign mockResolvedValue if needed, though jest.fn().mockResolvedValue({}) should persist unless overwritten
    mockUpdateOnboardingAction.mockResolvedValue({});


    // Mock localStorage
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0,
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  it('renders initial static messages', () => {
    (localStorageMock.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'onboardingUid') return TEST_ONBOARDING_UID;
      if (key === 'name') return TEST_NAME;
      return null;
    });

    render(<WaitlistPage />);

    expect(screen.getByText(/Ainda não suportamos seu banco/)).toBeInTheDocument();
    expect(screen.getByText(/Seu email já está cadastrado na lista de espera/)).toBeInTheDocument();
    expect(screen.getByText(/Desejamos sucesso!/)).toBeInTheDocument();
  });

  it('redirects to /onboarding/step1 if onboardingUid is null', async () => {
    (localStorageMock.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'onboardingUid') return null;
      return null;
    });
    
    // useEffect runs on mount, potentially causing state updates (router.push)
    // Using act here ensures these updates are processed before assertions.
    await act(async () => {
      render(<WaitlistPage />);
    });

    // No need for waitFor if router.push is called synchronously within useEffect's main path
    // However, if there were async operations before router.push, waitFor would be needed.
    // Given the component structure, router.push for null UID is direct.
    expect(mockRouterPush).toHaveBeenCalledWith('/onboarding/step1');
    expect(mockUpdateOnboardingAction).not.toHaveBeenCalled();
  });

  it('calls updateOnboardingAction and displays name when onboardingUid is present', async () => {
    (localStorageMock.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'onboardingUid') return TEST_ONBOARDING_UID;
      if (key === 'name') return TEST_NAME;
      return null;
    });

    const mockDate = new Date('2024-01-01T12:00:00.000Z');
    const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    // useEffect contains async updateOnboardingAction
    await act(async () => {
      render(<WaitlistPage />);
    });

    // Wait for dynamic text based on name from localStorage (set in useEffect)
    await waitFor(() => {
      expect(screen.getByText(`Que pena ${TEST_NAME}...`)).toBeInTheDocument();
    });

    // Wait for async updateOnboardingAction to be called
    await waitFor(() => {
      expect(mockUpdateOnboardingAction).toHaveBeenCalledWith(TEST_ONBOARDING_UID, {
        waitlist: true,
        finishedAt: mockDate.toISOString(),
      });
    });
    expect(mockRouterPush).not.toHaveBeenCalledWith('/onboarding/step1');

    dateSpy.mockRestore(); 
  });

  it('displays default name "Que pena ..." if name is not in localStorage', async () => {
    (localStorageMock.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'onboardingUid') return TEST_ONBOARDING_UID;
      if (key === 'name') return null; // Name is null
      return null;
    });

    await act(async () => {
      render(<WaitlistPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Que pena ...')).toBeInTheDocument(); 
    });
  });

  it('does not render a "Voltar para o login" link', () => {
    (localStorageMock.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'onboardingUid') return TEST_ONBOARDING_UID;
      if (key === 'name') return TEST_NAME;
      return null;
    });

    render(<WaitlistPage />); // No async effect directly impacts this assertion
    expect(screen.queryByRole('link', { name: /voltar para o login/i })).not.toBeInTheDocument();
  });
});
