import React, { useEffect, useState } from 'react';
import { Button, useStyles2 } from '@grafana/ui';
import { Loader2, Pause } from 'lucide-react';
import { GrafanaTheme2 } from '@grafana/data';
import { css, keyframes } from '@emotion/css';

interface RefreshLoopProps {
  onRefresh: () => void;
  isPaused?: boolean;
  isLoading: boolean;
  className?: string;
}

const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: theme.colors.text.secondary,
  }),
  refreshButton: css({
    height: 24,
    padding: '0 8px',
    fontSize: 12,
  }),
  icon: css({
    height: 12,
    width: 12,
  }),
  pauseIcon: css({
    height: 12,
    width: 12,
    color: theme.colors.warning.main,
  }),
  loadingIcon: css({
    height: 12,
    width: 12,
    color: theme.colors.success.main,
  }),
  spinning: css({
    animation: `${spin} 1s linear infinite`,
  }),
  hidden: css({
    opacity: 0,
    transition: 'opacity 1s',
  }),
  statusText: css({
    transition: 'opacity 1s',
  }),
});

export function RefreshLoop({ onRefresh, isPaused = false, isLoading, className }: RefreshLoopProps) {
  const [delayedLoading, setDelayedLoading] = useState(isLoading);
  const styles = useStyles2(getStyles);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isLoading) {
      setDelayedLoading(true);
    } else {
      timeoutId = setTimeout(() => {
        setDelayedLoading(false);
      }, 1000); // Keep loading state for 1 second after isLoading becomes false
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Button variant="secondary" size="sm" className={styles.refreshButton} onClick={onRefresh}>
        Refresh now
      </Button>
      {isPaused ? (
        <Pause className={styles.pauseIcon} />
      ) : (
        <Loader2
          className={`${styles.loadingIcon} ${
            delayedLoading ? styles.spinning : styles.hidden
          }`}
        />
      )}
      <span className={styles.statusText}>
        {isPaused ? 'Auto-refresh paused' : delayedLoading ? 'Refreshing...' : ''}
      </span>
    </div>
  );
}
