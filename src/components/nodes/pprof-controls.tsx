import React from 'react';
import { Button, Tooltip, useStyles2 } from '@grafana/ui';
import { absolutePath } from '../../util';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

interface PprofControlsProps {
  nodeName: string;
}

const pprofTypes = [
  {
    name: 'allocs',
    description: 'A sampling of all past memory allocations',
  },
  {
    name: 'block',
    description: 'Stack traces that led to blocking on synchronization primitives',
  },
  {
    name: 'heap',
    description: 'A sampling of memory allocations of live objects',
  },
  {
    name: 'mutex',
    description: 'Stack traces of holders of contended mutexes',
  },
  {
    name: 'profile',
    urlSuffix: '?seconds=15',
    description: 'CPU profile (15 seconds)',
    displayName: 'profile',
  },
  {
    name: 'goroutine',
    description: 'Stack traces of all current goroutines (debug=1)',
    variants: [
      {
        suffix: '?debug=0',
        label: 'Basic',
        description: 'Basic goroutine info',
      },
      {
        suffix: '?debug=1',
        label: 'Standard',
        description: 'Standard goroutine stack traces',
      },
      {
        suffix: '?debug=2',
        label: 'Full',
        description: 'Full goroutine stack dump with additional info',
      },
    ],
  },
  {
    name: 'threadcreate',
    description: 'Stack traces that led to the creation of new OS threads',
    urlSuffix: '?debug=1',
    displayName: 'threadcreate',
  },
  {
    name: 'trace',
    description: 'A trace of execution of the current program',
    urlSuffix: '?debug=1',
    displayName: 'trace',
  },
];

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }),
  label: css({
    fontSize: 14,
    fontWeight: 500,
  }),
  buttonsContainer: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  }),
});

export function PprofControls({ nodeName }: PprofControlsProps) {
  const styles = useStyles2(getStyles);
  
  const downloadPprof = (type: string) => {
    window.open(absolutePath(`/api/v1/proxy/${nodeName}/debug/pprof/${type}`), '_blank');
  };

  return (
    <div className={styles.container}>
      <span className={styles.label}>Profiling Tools:</span>
      <div className={styles.buttonsContainer}>
        {pprofTypes.map((type) => {
          if (type.variants) {
            return type.variants.map((variant) => (
              <Tooltip 
                key={`${type.name}${variant.suffix}`}
                content={variant.description}
              >
                <Button variant="secondary" size="sm" onClick={() => downloadPprof(`${type.name}${variant.suffix}`)}>
                  {`${type.name} (${variant.label})`}
                </Button>
              </Tooltip>
            ));
          }

          return (
            <Tooltip 
              key={type.name}
              content={type.description}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadPprof(`${type.name}${type.urlSuffix || ''}`)}
              >
                {type.displayName || type.name}
              </Button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
