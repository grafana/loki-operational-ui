import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { routes } from 'config/routes';

import { AppLayout } from '../../layout/layout';
import { ThemeProvider } from '../../features/theme/components/theme-provider';
import { QueryProvider } from '../../providers/query-provider';
import { ClusterProvider } from '../../contexts/cluster-provider';
import { VersionDisplay } from 'components/version-display';
import { PluginPage } from '@grafana/runtime';
import { HeaderActions } from '../../layout/header-actions';
import { TooltipProvider } from 'components/ui/tooltip';
import { getGrafanaTheme } from '../../utils/theme';

function App(_: AppRootProps) {
  const grafanaTheme = getGrafanaTheme();

  return (
    <QueryProvider>
      <ThemeProvider defaultTheme={grafanaTheme}>
        <ClusterProvider>
          <TooltipProvider>
            <PluginPage
              renderTitle={() => (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-lg font-semibold leading-none">Grafana Loki</span>
                      <VersionDisplay />
                    </div>
                  </div>
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
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
