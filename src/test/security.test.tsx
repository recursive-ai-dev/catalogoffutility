import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';
import { Chamber } from '../Chamber';
import { AppEntry } from '../data';

// Mock clock for deterministic testing
const mockClock = {
  timeString: () => '12:00:00',
  now: () => new Date(),
};

const makeApp = (overrides: Partial<AppEntry> = {}): AppEntry => ({
  id: 'test-app',
  title: 'TEST APP',
  description: 'A test description',
  image: 'https://example.com/img.jpg',
  url: '/test-app.html',
  ...overrides,
});

describe('Security Constraints — isSafeImageSrc & Chamber hotlinking', () => {
  it('rejects remote URLs longer than 8KB', async () => {
    const { container } = render(<Chamber app={makeApp()} onBack={() => {}} clock={mockClock} />);

    // Initialize the chamber
    fireEvent.click(screen.getByText('Initialize'));
    const iframe = container.querySelector('iframe');

    // Create a URL longer than 8192 characters
    const longUrl = 'https://example.com/image.jpg?' + 'a'.repeat(8193);

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: longUrl },
        origin: window.location.origin,
        source: iframe?.contentWindow,
      }));
    });

    // Asset viewer should NOT appear
    expect(screen.queryByLabelText('Asset viewer')).toBeNull();
  });

  it('accepts remote URLs exactly 8KB or shorter', async () => {
    const { container } = render(<Chamber app={makeApp()} onBack={() => {}} clock={mockClock} />);

    fireEvent.click(screen.getByText('Initialize'));
    const iframe = container.querySelector('iframe');

    // Exactly 8KB (8192 chars)
    const baseUrl = 'https://example.com/image.jpg?';
    const maxLengthUrl = baseUrl + 'a'.repeat(8192 - baseUrl.length);

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: maxLengthUrl },
        origin: window.location.origin,
        source: iframe?.contentWindow,
      }));
    });

    await waitFor(() => expect(screen.getByLabelText('Asset viewer')).toBeTruthy());
  });

  it('accepts data URLs up to 2MB', async () => {
    const { container } = render(<Chamber app={makeApp()} onBack={() => {}} clock={mockClock} />);

    fireEvent.click(screen.getByText('Initialize'));
    const iframe = container.querySelector('iframe');

    // ~1MB data URL (well within 2MB)
    const dataUrl = 'data:image/png;base64,' + 'a'.repeat(1024 * 1024);

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: dataUrl },
        origin: window.location.origin,
        source: iframe?.contentWindow,
      }));
    });

    await waitFor(() => expect(screen.getByLabelText('Asset viewer')).toBeTruthy());
  });

  it('rejects data URLs longer than 2MB', async () => {
    const { container } = render(<Chamber app={makeApp()} onBack={() => {}} clock={mockClock} />);

    fireEvent.click(screen.getByText('Initialize'));
    const iframe = container.querySelector('iframe');

    // > 2MB data URL
    const hugeDataUrl = 'data:image/png;base64,' + 'a'.repeat(2 * 1024 * 1024 + 1);

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: hugeDataUrl },
        origin: window.location.origin,
        source: iframe?.contentWindow,
      }));
    });

    expect(screen.queryByLabelText('Asset viewer')).toBeNull();
  });

  it('rejects URLs with embedded credentials (regression)', async () => {
    const { container } = render(<Chamber app={makeApp()} onBack={() => {}} clock={mockClock} />);

    fireEvent.click(screen.getByText('Initialize'));
    const iframe = container.querySelector('iframe');

    const credentialUrl = 'https://user:password@malicious.com/image.jpg';

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: credentialUrl },
        origin: window.location.origin,
        source: iframe?.contentWindow,
      }));
    });

    expect(screen.queryByLabelText('Asset viewer')).toBeNull();
  });
});
