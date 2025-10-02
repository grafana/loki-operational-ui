import React from 'react';
import { TopNav } from './top-nav';
import { Toaster } from 'components/ui/toaster';
import { ScrollToTop } from 'components/ui/scroll-to-top';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

interface AppLayoutProps {
  children: React.ReactNode;
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    minHeight: '100vh',
    backgroundColor: theme.colors.background.primary,
  }),
  main: css({
    display: 'flex',
    flex: '1 1 0%',
    flexDirection: 'column',
  }),
});

export function AppLayout({ children }: AppLayoutProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <TopNav />
      <main className={styles.main}>{children}</main>
      <Toaster />
      <ScrollToTop />
    </div>
  );
}
