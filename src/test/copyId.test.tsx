import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProductPage } from '../ProductPage';

const mockApp = {
  id: 'test-app-id',
  title: 'Test App',
  description: 'Test description',
  image: 'test-image.jpg',
  tags: ['Tag1'],
  version: 'v1.0.0',
};

describe('ProductPage - Copy ID UX', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the copy button with initial state', () => {
    render(
      <ProductPage
        app={mockApp}
        onBack={() => {}}
        onEnter={() => {}}
        onTagSelect={() => {}}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy entry id/i });
    expect(copyButton).toBeDefined();
    expect(screen.getByText(/COPY ID/i)).toBeDefined();
  });

  it('copies the ID and shows success feedback on click', async () => {
    render(
      <ProductPage
        app={mockApp}
        onBack={() => {}}
        onEnter={() => {}}
        onTagSelect={() => {}}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy entry id/i });

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-app-id');
    expect(screen.getByText(/COPIED/i)).toBeDefined();
    expect(copyButton.getAttribute('aria-label')).toBe('ID copied');
  });

  it('resets the feedback after 2 seconds', async () => {
    render(
      <ProductPage
        app={mockApp}
        onBack={() => {}}
        onEnter={() => {}}
        onTagSelect={() => {}}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy entry id/i });

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(screen.getByText(/COPIED/i)).toBeDefined();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText(/COPIED/i)).toBeNull();
    expect(screen.getByText(/COPY ID/i)).toBeDefined();
    expect(copyButton.getAttribute('aria-label')).toBe('Copy entry ID');
  });
});
