import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { routes } from 'config/routes';

import { AppLayout } from '../../layout/layout';
import { ThemeProvider } from '../../features/theme/components/theme-provider';
import { QueryProvider } from '../../providers/query-provider';
import { ClusterProvider } from '../../contexts/cluster-provider';
import { StoreProvider } from '../../contexts/store-provider';
import { VersionDisplay } from 'components/version-display';
import { DatasourcePickerComponent } from 'components/datasource-picker';
import { config, PluginPage } from '@grafana/runtime';
import { HeaderActions } from '../../layout/header-actions';
import { TooltipProvider } from 'components/ui/tooltip';
import { getGrafanaTheme } from '../../utils/theme';
import { Card } from '@grafana/ui';

function App(_: AppRootProps) {
  const grafanaTheme = getGrafanaTheme();
  const isAdmin = config.bootData.user.orgRole === 'Admin' ? true : false;

  return isAdmin ? (
    <QueryProvider>
      <ThemeProvider defaultTheme={grafanaTheme}>
        <StoreProvider>
          <ClusterProvider>
            <TooltipProvider>
              <PluginPage
                renderTitle={() => (
                  <div className="flex justify-between w-full">
                    <div className="flex gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-lg font-semibold leading-none">Loki Operational UI</span>
                        <VersionDisplay />
                      </div>
                    </div>
                    <DatasourcePickerComponent />
                  </div>
                )}
                actions={<HeaderActions />}
              >
                <AppLayout>
                  <Routes>
                    {routes.map((route) => (
                      <Route key={route.path} path={route.path} element={route.element} />
                    ))}
                  </Routes>
                </AppLayout>
              </PluginPage>
            </TooltipProvider>
          </ClusterProvider>
        </StoreProvider>
      </ThemeProvider>
    </QueryProvider>
  ) : (<ThemeProvider defaultTheme={grafanaTheme}>
    <Card noMargin>
      <Card.Heading>
        Loki Operational UI
      </Card.Heading>
      <Card.Description>
        You don&apos;t have sufficient privileges to access this page. You must be an admin.
      </Card.Description>
    </Card>
  </ThemeProvider>)
}

export default App;
