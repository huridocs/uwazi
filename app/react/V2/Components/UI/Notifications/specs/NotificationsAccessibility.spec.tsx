/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidepanel } from '#V2/Components/UI/Sidepanel.js';
import { StatusDot } from '#V2/Components/UI/Notifications/StatusDot.js';
import { NotificationItem } from '#V2/Components/UI/Notifications/NotificationItem.js';
import { NotificationFlash } from '#V2/Components/UI/Notifications/NotificationFlash.js';
import { TaskItem } from '#V2/Components/UI/Notifications/TaskItem.js';
import { RequestStatus } from '#V2/Components/UI/Notifications/RequestStatus.js';
import { NotificationsPanel } from '#V2/Components/UI/Notifications/NotificationsPanel.js';
import { requestStatusAtom } from '#V2/atoms/requestStatusAtom.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => ({ lang: 'en' }),
}));

jest.mock('#V2/CustomHooks/useContrastColor.js', () => ({
  useContrastColor: () => '#000000',
}));

describe('Notifications accessibility', () => {
  it('wires status trigger and panel expanded relationship', () => {
    render(
      <StatusDot
        overallStatus="success"
        isConnected
        hasRunningTasks={false}
        onClick={jest.fn()}
        controlsId="notifications-panel-dialog"
        isExpanded
      />
    );

    expect(screen.getByTestId('status-dot')).toHaveAttribute(
      'aria-controls',
      'notifications-panel-dialog'
    );
    expect(screen.getByTestId('status-dot')).toHaveAttribute('aria-expanded', 'true');
  });

  it('adds disclosure semantics for notification details', async () => {
    const user = userEvent.setup();
    render(
      <ul>
        <li>
          <NotificationItem
            notification={{
              id: 'n1',
              type: 'error',
              title: 'Failed',
              message: 'Request failed.',
              details: 'Error stack details',
              timestamp: new Date(),
            }}
            onDismiss={jest.fn()}
          />
        </li>
      </ul>
    );

    const toggle = screen.getByRole('button', { name: 'Show details' });
    const detailsId = toggle.getAttribute('aria-controls');
    expect(detailsId).toBeTruthy();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(detailsId || '')).toBeInTheDocument();
  });

  it('exposes task progressbar semantics', () => {
    render(
      <TaskItem
        task={{
          id: 't1',
          label: 'Importing records',
          progress: 45,
          status: 'running',
        }}
        onRemove={jest.fn()}
      />
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-valuenow', '45');
    expect(progressbar).toHaveAttribute('aria-valuetext', 'Running - 45%');
  });

  it('keeps flash visual content hidden from assistive tech', () => {
    render(<NotificationFlash title="Saved successfully" type="success" phase="showing" />);
    expect(screen.getByTestId('notification-flash')).toHaveAttribute('aria-hidden', 'true');
  });

  it('announces new flash notifications through a live region', () => {
    render(
      <TestAtomStoreProvider
        initialValues={[
          [
            requestStatusAtom,
            {
              notifications: [
                {
                  id: 'n1',
                  type: 'error',
                  title: 'Save failed',
                  timestamp: new Date(),
                },
              ],
              unreadNotificationIds: ['n1'],
              tasks: [],
              isConnected: true,
              isPanelOpen: false,
              isLoading: false,
            },
          ],
        ]}
      >
        <RequestStatus />
      </TestAtomStoreProvider>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Error: Save failed');
  });

  it('moves between notifications with arrow keys', async () => {
    const user = userEvent.setup();

    render(
      <TestAtomStoreProvider
        initialValues={[
          [
            requestStatusAtom,
            {
              notifications: [
                {
                  id: 'n1',
                  type: 'success',
                  title: 'Older notification',
                  message: 'First message',
                  timestamp: new Date(),
                },
                {
                  id: 'n2',
                  type: 'error',
                  title: 'Newest notification',
                  message: 'Second message',
                  timestamp: new Date(),
                },
              ],
              unreadNotificationIds: ['n1', 'n2'],
              tasks: [],
              isConnected: true,
              isPanelOpen: true,
              isLoading: false,
            },
          ],
        ]}
      >
        <NotificationsPanel />
      </TestAtomStoreProvider>
    );

    const notifications = screen.getAllByRole('article');
    await waitFor(() => expect(notifications[0]).toHaveFocus());

    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(notifications[1]).toHaveFocus());

    await user.keyboard('{ArrowUp}');
    await waitFor(() => expect(notifications[0]).toHaveFocus());
  });

  it('supports dialog semantics, escape close, and focus return', async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [open, setOpen] = useState(false);

      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Open notifications
          </button>
          <Sidepanel
            panelId="notifications-panel-dialog"
            isOpen={open}
            closeSidepanelFunction={() => setOpen(false)}
            title="Notifications"
          >
            <Sidepanel.Body>
              <button type="button">Inner action</button>
            </Sidepanel.Body>
          </Sidepanel>
        </div>
      );
    };

    render(<Harness />);

    const openButton = screen.getByRole('button', { name: 'Open notifications' });
    await user.click(openButton);

    const dialog = await screen.findByRole('dialog', { name: 'Notifications' });
    expect(dialog).toHaveAttribute('id', 'notifications-panel-dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const focusableElements = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    lastFocusable.focus();

    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(firstFocusable).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument()
    );
    expect(openButton).toHaveFocus();
  });
});
