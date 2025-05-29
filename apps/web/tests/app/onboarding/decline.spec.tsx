import { render, screen } from '@testing-library/react';
import React from 'react';

import DeclinePage from '@/app/onboarding/decline/page'; // Adjust path as necessary

describe('DeclinePage', () => {
  it('should render the main heading "Que pena 😞"', () => {
    render(<DeclinePage />);
    const headingElement = screen.getByRole('heading', {
      level: 2,
      name: /que pena 😞/i,
    });
    expect(headingElement).toBeInTheDocument();
  });

  it('should render the main paragraph message', () => {
    render(<DeclinePage />);
    const paragraphElement = screen.getByText(
      /Não foi dessa vez, mas desejamos todo sucesso na sua jornada financeira!/i,
    );
    expect(paragraphElement).toBeInTheDocument();
    // Check if it's a paragraph, though getByText is usually sufficient
    expect(paragraphElement.tagName).toBe('P');
  });

  it('should not render any links, as per current component implementation', () => {
    render(<DeclinePage />);
    const links = screen.queryAllByRole('link');
    expect(links.length).toBe(0);
  });
});
