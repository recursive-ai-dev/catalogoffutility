import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
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
    // Navigate to product page
    fireEvent.click(screen.getByText(testApp.title));

    const skipLink = screen.getByText(/Skip to main content/i);
    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute('href')).toBe('#main-content');

    const mainContent = document.getElementById('main-content');
    expect(mainContent).toBeTruthy();
    expect(mainContent?.tagName).toBe('MAIN');
  });
});
