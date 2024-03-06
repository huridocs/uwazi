/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { Translate, t } from 'app/I18N';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { InputField, DatePicker, DateRangePicker } from 'app/V2/Components/Forms';
import * as activityLogAPI from 'V2/api/activityLog';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';
import { ActivityLogTable } from './components/ActivityLogTable';
import { ActivityLogSidePanel } from './components/ActivityLogSidePanel';

const ITEMS_PER_PAGE = 100;

const activityLogLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ request }) => {
    const searchParams = new URLSearchParams(request.url.split('?')[1]);
    const sortingOption = searchParams.has('sort') ? searchParams.get('sort') : undefined;
    const activityLogList = await activityLogAPI.get(
      {
        limit: ITEMS_PER_PAGE,
        ...searchParams,
        ...(sortingOption && { sort: JSON.parse(sortingOption) }),
      },
      headers
    );

    const totalPages =
      (activityLogList.rows.length + activityLogList.remainingRows) / ITEMS_PER_PAGE;
    return {
      activityLogData: activityLogList.rows,
      totalPages,
    };
  };

const ActivityLog = () => {
  const [selectedEntry, setSelectedEntry] = useState<ActivityLogEntryType | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const { register } = useForm<ActivityLogEntryType>({
    mode: 'onSubmit',
  });

  const { activityLogData, totalPages } = useLoaderData() as {
    activityLogData: ActivityLogEntryType[];
    totalPages: number;
  };

  const onCloseSidePanel = () => {
    setShowSidePanel(false);
    setSelectedEntry(null);
  };

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-activity-log"
    >
      <SettingsContent>
        <SettingsContent.Header title="Activity Log" />
        <SettingsContent.Body>
          <div>
            <caption className="p-4 text-base font-semibold text-left text-gray-900 bg-white">
              <Translate>Activity Log</Translate>
            </caption>
            <InputField id="user" label="User" hideLabel placeholder="User" {...register('user')} />
            <InputField
              id="searchText"
              label="searchText"
              hideLabel
              placeholder={t('System', 'by IDs, methods, keywords, etc.', null, false)}
              {...register('user')}
            />
            <DateRangePicker language="en-es" labelToday="today" labelClear="clear" />
            <DatePicker language="en-es" labelToday="today" labelClear="clear" />
          </div>
          <ActivityLogTable
            data={activityLogData}
            totalPages={totalPages}
            setSelectedEntry={setSelectedEntry}
          />
          {selectedEntry && (
            <ActivityLogSidePanel
              selectedEntry={selectedEntry}
              isOpen={showSidePanel}
              onClose={onCloseSidePanel}
            />
          )}
        </SettingsContent.Body>
      </SettingsContent>
    </div>
  );
};

export { ActivityLog, activityLogLoader };
