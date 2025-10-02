import React from 'react';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Whether to add vertical spacing between children
   * @default true
   */
  spacing?: boolean;
}

const getStyles = (theme: GrafanaTheme2, spacing: boolean) => ({
  container: css({
    maxWidth: '100%',
    margin: '0 auto',
    padding: 24,
  }),
  content: css({
    ...(spacing && {
      '& > * + *': {
        marginTop: 24,
      },
    }),
  }),
});

export function PageContainer({ children, className, spacing = true, ...props }: PageContainerProps) {
  const styles = useStyles2((theme) => getStyles(theme, spacing));

  return (
    <div className={styles.container}>
      <div className={`${styles.content} ${className || ''}`} {...props}>
        {children}
      </div>
    </div>
  );
}
