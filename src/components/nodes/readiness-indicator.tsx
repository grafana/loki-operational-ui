import React from 'react';
import { Tooltip, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

interface ReadinessIndicatorProps {
  isReady?: boolean;
  message?: string;
  className?: string;
}

export function ReadinessIndicator({ isReady, message, className }: ReadinessIndicatorProps) {
  const styles = useStyles2(getStyles);

  return (
    <Tooltip content={message || (isReady ? 'Ready' : 'Not Ready')} placement="top">
      <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className={isReady ? styles.indicatorReady : styles.indicatorNotReady} />
      </div>
    </Tooltip>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  indicatorReady: css`
    height: 10px;
    width: 10px;
    border-radius: 50%;
    background-color: ${theme.colors.success.main};
  `,
  indicatorNotReady: css`
    height: 10px;
    width: 10px;
    border-radius: 50%;
    background-color: ${theme.colors.error.main};
  `,
});
