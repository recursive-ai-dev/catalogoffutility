import { describe, it, expect } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Chamber } from '../Chamber';
import { AppEntry } from '../data';

const mockApp: AppEntry = {
  id: 'test-app',
  title: 'Test App',
  description: 'Test description',
  image: 'test.jpg',
  url: '/test.html'
};

describe('isSafeImageSrc Security', () => {
  it('rejects URLs with embedded credentials (vulnerability check)', async () => {
    const { container } = render(<Chamber app={mockApp} onBack={() => {}} />);

    // Initialize to render iframe
    fireEvent.click(screen.getByText('Initialize'));
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'IMAGE_CLICKED', src: 'https://user:password@example.com/image.png' },
        origin: window.location.origin,
        source: iframe.contentWindow,
      }));
    });

    // If it's vulnerable, the Asset Viewer will appear.
    // We want it to NOT appear.
    // Use waitFor to assert that it remains null
    await waitFor(() => {
      expect(screen.queryByText(/Asset_Viewer/i)).toBeNull();
    });
  });
});
