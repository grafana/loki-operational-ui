import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppRootProps, PluginType } from '@grafana/data';
import { render, waitFor } from '@testing-library/react';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  config: {
    bootData: {
      user: {
        orgRole: 'Admin'
      }
    }
  },
  PluginPage: ({
    children,
    renderTitle,
    actions,
  }: {
    children: React.ReactNode;
    renderTitle?: () => React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <div>
      {renderTitle?.()}
      {actions}
      {children}
    </div>
  ),
  getDataSourceSrv: () => ({
    getInstanceSettings: () => null,
    getList: () => [],
  }),
  DataSourcePicker: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="datasource-picker">{placeholder}</div>
  ),
}));

import App from './App';

describe('Components/App', () => {
  let props: AppRootProps;

  beforeEach(() => {
    jest.resetAllMocks();

    props = {
      basename: 'a/sample-app',
      meta: {
        id: 'sample-app',
        name: 'Sample App',
        type: PluginType.app,
        enabled: true,
        jsonData: {},
      },
      query: {},
      path: '',
      onNavChanged: jest.fn(),
    } as unknown as AppRootProps;
  });

  test('renders without an error"', async () => {
    const { queryByText } = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App {...props} />
      </MemoryRouter>
    );

    // Application is lazy loaded, so we need to wait for the component and routes to be rendered
    await waitFor(() => expect(queryByText('Nodes')).toBeInTheDocument(), { timeout: 2000 });
  });
});
