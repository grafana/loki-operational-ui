import React from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Tooltip, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

interface DateHoverProps {
  date: Date;
  className?: string;
}

export const DateHover: React.FC<DateHoverProps> = ({ date, className = '' }) => {
  const styles = useStyles2(getStyles);
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });
  const localTime = format(date, 'yyyy-MM-dd HH:mm:ss');
  const utcTime = format(new Date(date.getTime() + date.getTimezoneOffset() * 60000), 'yyyy-MM-dd HH:mm:ss');

  const tooltipContent = (
    <div className={styles.container}>
      <div className={styles.row}>
        <span className={styles.label}>UTC</span>
        <span className={styles.time}>{utcTime}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Local</span>
        <span className={styles.time}>{localTime}</span>
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} placement="bottom">
      <span className={className} style={{ display: 'inline-block' }}>
        {relativeTime}
      </span>
    </Tooltip>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
    min-width: 250px;
  `,
  row: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1.5)};
  `,
  label: css`
    padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
    font-size: ${theme.typography.bodySmall.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    width: 56px;
    text-align: center;
  `,
  time: css`
    font-family: ${theme.typography.fontFamilyMonospace};
  `,
});
