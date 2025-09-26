import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { routes } from "config/routes";

import { AppLayout } from "../../layout/layout";
import { ThemeProvider } from "../../features/theme/components/theme-provider";
import { QueryProvider } from "../../providers/query-provider";
import { ClusterProvider } from "../../contexts/cluster-provider";


function App(_: AppRootProps) {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="dark" storageKey="loki-ui-theme">
          <ClusterProvider>
            <AppLayout>
              <Routes>
                {routes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={route.element}
                  />
                ))}
              </Routes>
            </AppLayout>
          </ClusterProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
