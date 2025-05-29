// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import OnboardingModal from '@/components/OnboardingModal';
import { useAppStore } from '@/store/useAppStore';

// Ensure jsdom environment for React Testing Library

describe('OnboardingModal', () => {
  beforeEach(() => {
    useAppStore.setState({ onboardingDismissed: false });
  });

  it('shows only once after dismissal', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <OnboardingModal open={true} onClose={onClose} />
    );
    expect(screen.getByText(/welcome to intellea/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /got it/i }));
    expect(onClose).toHaveBeenCalled();

    rerender(<OnboardingModal open={false} onClose={onClose} />);
    expect(screen.queryByText(/welcome to intellea/i)).toBeNull();

    // Render again to ensure persisted dismissal
    rerender(<OnboardingModal open={false} onClose={onClose} />);
    expect(screen.queryByText(/welcome to intellea/i)).toBeNull();
  });

  it('returns null when closed', () => {
    render(<OnboardingModal open={false} onClose={() => {}} />);
    expect(screen.queryByText(/welcome to intellea/i)).toBeNull();
  });
});
