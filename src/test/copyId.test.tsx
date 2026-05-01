import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProductPage } from '../ProductPage';
import { AppEntry } from '../data';

const makeApp = (overrides: Partial<AppEntry> = {}): AppEntry => ({
  id: 'test-app-id',
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

describe('ProductPage - Copy Entry ID', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('copies the app ID to clipboard when clicked', async () => {
    const app = makeApp();
    render(<ProductPage app={app} onBack={vi.fn()} onEnter={vi.fn()} onTagSelect={vi.fn()} />);

    const copyBtn = screen.getByLabelText('Copy entry ID');
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-app-id');
  });

  it('shows success feedback and then resets after 2000ms', async () => {
    const app = makeApp();
    render(<ProductPage app={app} onBack={vi.fn()} onEnter={vi.fn()} onTagSelect={vi.fn()} />);

    const copyBtn = screen.getByLabelText('Copy entry ID');
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(screen.getByLabelText('ID copied')).toBeTruthy();
    expect(screen.getByText('COPIED')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByLabelText('Copy entry ID')).toBeTruthy();
    expect(screen.queryByText('COPIED')).toBeNull();
  });
});
