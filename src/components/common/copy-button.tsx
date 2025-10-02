import React, { useState } from 'react';
import { Button, useStyles2 } from '@grafana/ui';
import { Copy, Check } from 'lucide-react';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

interface CopyButtonProps {
  text: string;
  className?: string;
  onCopy?: () => void;
}

const getStyles = (theme: GrafanaTheme2) => ({
  copyButton: css({
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    height: 32,
    padding: '0 8px',
  }),
  icon: css({
    height: 16,
    width: 16,
  }),
});

export function CopyButton({ text, className, onCopy }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const styles = useStyles2(getStyles);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text).then(() => {
      setHasCopied(true);
      onCopy?.();
      setTimeout(() => setHasCopied(false), 2000);
    });
  };

  return (
    <Button variant="secondary" size="sm" onClick={copyToClipboard} className={`${styles.copyButton} ${className || ''}`}>
      {hasCopied ? (
        <>
          <Check className={styles.icon} />
          Copied
        </>
      ) : (
        <>
          <Copy className={styles.icon} />
          Copy
        </>
      )}
    </Button>
  );
}
