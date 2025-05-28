// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import OnboardingModal from '@/components/OnboardingModal';
import { useAppStore } from '@/store/useAppStore';

// Ensure jsdom environment for React Testing Library

describe('OnboardingModal', () => {
  beforeEach(() => {
    useAppStore.setState({ onboardingDismissed: false });
  });

  it('shows only once after dismissal', () => {
    const { rerender } = render(<OnboardingModal />);
    expect(screen.getByText(/welcome to intellea/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /got it/i }));
    rerender(<OnboardingModal />);
    expect(screen.queryByText(/welcome to intellea/i)).toBeNull();

    // Render again to ensure persisted dismissal
    rerender(<OnboardingModal />);
    expect(screen.queryByText(/welcome to intellea/i)).toBeNull();
  });
});
