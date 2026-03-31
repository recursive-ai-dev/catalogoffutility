import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { Chamber } from '../Chamber';

const makeApp = () => ({
  id: 't', title: 'T', description: 'D', image: 'https://e.com/i.jpg', url: '/t.html', tags: ['N'], tech: ['H'], version: '1.0', size: '1K'
});

afterEach(cleanup);

describe('Sentinel: isSafeImageSrc Hardening', () => {
  it('rejects image URLs with embedded credentials (BUG-06d)', async () => {
    const { container } = render(<Chamber app={makeApp() as any} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Initialize'));
    const win = container.querySelector('iframe')!.contentWindow;
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: 'https://u:p@e.com/s.jpg' },
        origin: window.location.origin,
        source: win,
      }));
    });
    expect(screen.queryByText(/Asset_Viewer/i)).toBeNull();
  });

  it('accepts legitimate https: URLs', async () => {
    const { container } = render(<Chamber app={makeApp() as any} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Initialize'));
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: 'https://i.u.com/p' },
        origin: window.location.origin,
        source: container.querySelector('iframe')!.contentWindow,
      }));
    });
    await waitFor(() => expect(screen.getByText(/Asset_Viewer/i)).toBeTruthy());
  });
});
