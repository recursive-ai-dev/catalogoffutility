import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { ProductPage } from '../ProductPage';
import { CATALOG_ENTRIES } from '../data';

const testApp = CATALOG_ENTRIES.find(e => !e.missing && !e.requiresAuth)!;

describe('UX Enhancements — Copy ID & Search', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock navigator.clipboard
    // Mock only navigator.clipboard, preserving the rest of navigator.
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('allows copying the entry ID from the product page', async () => {
    render(
      <ProductPage
        app={testApp}
        onBack={vi.fn()}
        onEnter={vi.fn()}
        onTagSelect={vi.fn()}
      />
    );

    const copyBtn = screen.getByLabelText(/Copy entry ID/i);
    expect(copyBtn).toBeTruthy();

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testApp.id);

    // Check success state
    expect(screen.getByText(/COPIED/i)).toBeTruthy();
    expect(screen.getByLabelText(/ID copied/i)).toBeTruthy();
    // ...and that the outcome is also announced, not just shown.
    expect(screen.getByRole('status')).toHaveTextContent(
      `Entry ID ${testApp.id} is on the clipboard.`,
    );

    // Verify it reverts after 2000ms
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.queryByText(/COPIED/i)).toBeNull();
    expect(screen.getByLabelText(/Copy entry ID/i)).toBeTruthy();
  });

  it('makes entry IDs searchable in the catalog', async () => {
    vi.useRealTimers(); // userEvent.type doesn't play well with fake timers sometimes
    render(<App />);
    const input = screen.getByPlaceholderText(/Search the void.../i);

    // Search for a specific known ID
    const targetId = testApp.id;
    await userEvent.type(input, targetId);

    // The target app should be visible
    expect(screen.getByText(testApp.title)).toBeTruthy();

    // Other apps should be filtered out
    const otherApp = CATALOG_ENTRIES.find(e => e.id !== targetId && !e.missing);
    if (otherApp) {
      expect(screen.queryByText(otherApp.title)).toBeNull();
    }
  });

  it('skip link is present on product page and targets main-content', () => {
    render(
      <App />
    );
    // Navigate to product page via the card's activation button.
    fireEvent.click(
      screen.getByRole('button', { name: `Open ${testApp.title}` }),
    );
    // Assert the navigation actually happened — the skip link is rendered on
    // every view, so checking for it alone would pass even on a no-op click.
    // Synchronous (not waitFor): this suite runs on fake timers, and the view
    // transition commits through flushSync, so the product page is present by
    // the time the click handler returns.
    expect(screen.getByText(/Enter Chamber/i)).toBeTruthy();

    const skipLink = screen.getByText(/Skip to main content/i);
    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute('href')).toBe('#main-content');

    const mainContent = document.getElementById('main-content');
    expect(mainContent).toBeTruthy();
    expect(mainContent?.tagName).toBe('MAIN');
    expect(mainContent?.getAttribute('tabindex')).toBe('-1');
  });
});
