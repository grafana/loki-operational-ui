import React from 'react';
import { ServiceState } from '../../types/cluster';
import { Badge, Tooltip, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

interface StatusBadgeProps {
  services: ServiceState[];
  error?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ services, error }) => {
  const styles = useStyles2(getStyles);

  const getStatusInfo = () => {
    if (error) {
      return {
        color: 'red' as const,
        status: 'error',
      };
    }

    const allRunning = services.every((s) => s.status === 'Running');
    const onlyStartingOrRunning = services.every((s) => s.status === 'Starting' || s.status === 'Running');

    if (allRunning) {
      return {
        color: 'green' as const,
        status: 'healthy',
      };
    } else if (onlyStartingOrRunning) {
      return {
        color: 'orange' as const,
        status: 'pending',
      };
    } else {
      return {
        color: 'red' as const,
        status: 'unhealthy',
      };
    }
  };

  const getStatusColor = (status: string, theme: GrafanaTheme2) => {
    switch (status) {
      case 'Running':
        return theme.colors.success.text;
      case 'Starting':
        return theme.colors.warning.text;
      case 'Failed':
        return theme.colors.error.text;
      case 'Terminated':
        return theme.colors.text.secondary;
      case 'Stopping':
        return theme.colors.warning.text;
      case 'New':
        return theme.colors.info.text;
      default:
        return theme.colors.text.secondary;
    }
  };

  const { color } = getStatusInfo();

  const tooltipContent = (
    <div className={styles.tooltipContent}>
      <div className={styles.tooltipHeader}>Service Status</div>
      <div className={styles.serviceList}>
        {services.map((service, idx) => (
          <div key={idx} className={styles.serviceItem}>
            <span className={styles.serviceName}>{service.service}</span>
            <span style={{ color: getStatusColor(service.status, useStyles2(getStyles).theme) }}>
              {service.status}
            </span>
          </div>
        ))}
      </div>
      {error && <div className={styles.errorText}>{error}</div>}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} placement="bottom">
      <span>
        <Badge text={`${services.length} services`} color={color} />
      </span>
    </Tooltip>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  theme,
  tooltipContent: css`
    min-width: 250px;
  `,
  tooltipHeader: css`
    font-weight: ${theme.typography.fontWeightMedium};
    border-bottom: 1px solid ${theme.colors.border.weak};
    padding-bottom: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(1)};
  `,
  serviceList: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(0.5)};
  `,
  serviceItem: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  serviceName: css`
    margin-right: ${theme.spacing(2)};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  errorText: css`
    margin-top: ${theme.spacing(1)};
    padding-top: ${theme.spacing(1)};
    border-top: 1px solid ${theme.colors.border.weak};
    color: ${theme.colors.error.text};
  `,
});

export default StatusBadge;
