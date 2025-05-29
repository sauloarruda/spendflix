import { render, screen } from '@testing-library/react';
import React from 'react';

import OnboardingLayout from '@/app/onboarding/layout';

import { mockUsePathname, mockUseRouter } from '../testUtils'; // Adjust path as necessary

// Mock ResumeOnboarding to prevent real logic from running
jest.mock('@/components/onboarding/ResumeOnboarding', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => mockUseRouter(),
}));

describe('OnboardingLayout', () => {
  beforeEach(() => {
    // Clear mock usage history before each test
    mockUsePathname.mockClear();
  });

  it('should render its children', () => {
    mockUsePathname.mockReturnValue('/onboarding/somepage'); // Path without 'step'
    const childText = 'This is a child component';
    render(
      <OnboardingLayout>
        <div>{childText}</div>
      </OnboardingLayout>,
    );
    expect(screen.getByText(childText)).toBeInTheDocument();
  });

  it('should display the current step when pathname includes "/stepX"', () => {
    mockUsePathname.mockReturnValue('/onboarding/step3');
    render(
      <OnboardingLayout>
        <div>Child content</div>
      </OnboardingLayout>,
    );
    expect(screen.getByText('Etapa 3 de 7')).toBeInTheDocument();
  });

  it('should display the correct step number based on pathname', () => {
    mockUsePathname.mockReturnValue('/onboarding/step5');
    render(
      <OnboardingLayout>
        <div>Child content</div>
      </OnboardingLayout>,
    );
    expect(screen.getByText('Etapa 5 de 7')).toBeInTheDocument();
  });

  it('should not display the step message if pathname does not include "/stepX"', () => {
    mockUsePathname.mockReturnValue('/onboarding/waitlist');
    render(
      <OnboardingLayout>
        <div>Child content</div>
      </OnboardingLayout>,
    );
    expect(screen.queryByText(/Etapa \d de 7/)).not.toBeInTheDocument();
  });

  it('should handle pathnames where "step" is followed by non-numeric characters gracefully (no step displayed)', () => {
    mockUsePathname.mockReturnValue('/onboarding/stepABC');
    render(
      <OnboardingLayout>
        <div>Child content</div>
      </OnboardingLayout>,
    );
    // Expecting 'NaN de 7' might be too specific if implementation changes,
    // better to check that the step message is not displayed or displayed as
    // "Etapa undefined de 7" or similar
    // Based on current implementation parseInt("ABC",10) is NaN, which is falsy.
    // Thus, the component should not render the step string.
    expect(screen.queryByText('Etapa NaN de 7')).not.toBeInTheDocument();
    // Also check that no "Etapa X de 7" is rendered generally for this case
    expect(screen.queryByText(/Etapa .* de 7/)).not.toBeInTheDocument();
  });

  it('should not display the step message if pathname is just "/onboarding/"', () => {
    mockUsePathname.mockReturnValue('/onboarding/');
    render(
      <OnboardingLayout>
        <div>Child content</div>
      </OnboardingLayout>,
    );
    expect(screen.queryByText(/Etapa \d de 7/)).not.toBeInTheDocument();
  });

  it('should render the step div with correct classes', () => {
    mockUsePathname.mockReturnValue('/onboarding/step2');
    render(
      <OnboardingLayout>
        <div>Child content</div>
      </OnboardingLayout>,
    );
    const stepDiv = screen.getByText('Etapa 2 de 7');
    expect(stepDiv).toHaveClass('w-full text-sm text-gray-500 mb-4 mt-8 text-center');
  });
});
