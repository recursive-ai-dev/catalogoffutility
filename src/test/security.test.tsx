import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { Chamber } from '../Chamber';
import { AppEntry } from '../data';

const makeApp = (overrides: Partial<AppEntry> = {}): AppEntry => ({
  id: 'test-app',
  title: 'TEST APP',
  description: 'A test description',
  image: 'https://example.com/img.jpg',
  url: '/test-app.html',
  tags: ['Narrative'],
  tech: ['HTML'],
  version: 'v.1.0',
  size: '10 KB',
  ...overrides,
});

describe('Security Hardening — isSafeImageSrc', () => {
  it('rejects https URLs with embedded credentials via prefix short-circuit', async () => {
    const { container } = render(<Chamber app={makeApp()} onBack={vi.fn()} />);

    // Initialize to render the iframe
    fireEvent.click(screen.getByText('Initialize'));

    const iframe = container.querySelector('iframe')!;
    expect(iframe).not.toBeNull();

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: 'https://user:password@example.com/leak.jpg' },
        origin: window.location.origin,
        source: iframe.contentWindow,
      }));
    });

    // Asset viewer modal should NOT appear
    expect(screen.queryByText(/Asset_Viewer/i)).toBeNull();
  });

  it('rejects URLs with credentials in the URL parser fallback', async () => {
    const { container } = render(<Chamber app={makeApp()} onBack={vi.fn()} />);

    fireEvent.click(screen.getByText('Initialize'));

    const iframe = container.querySelector('iframe')!;
    expect(iframe).not.toBeNull();

    // Using a non-https scheme that might still trigger the URL parser
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: 'http://user:password@localhost/leak.jpg' },
        origin: window.location.origin,
        source: iframe.contentWindow,
      }));
    });

    expect(screen.queryByText(/Asset_Viewer/i)).toBeNull();
  });

  it('accepts legitimate https URLs without credentials', async () => {
    const { container } = render(<Chamber app={makeApp()} onBack={vi.fn()} />);

    fireEvent.click(screen.getByText('Initialize'));

    const iframe = container.querySelector('iframe')!;
    expect(iframe).not.toBeNull();

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: 'https://example.com/safe.jpg' },
        origin: window.location.origin,
        source: iframe.contentWindow,
      }));
    });

    await waitFor(() => expect(screen.getByText(/Asset_Viewer/i)).toBeTruthy());
  });
});
