import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme-context';
import { Button, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const styles = useStyles2(getStyles);

  const handleThemeChange = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <Button variant="secondary" fill="text" className={styles.button} onClick={handleThemeChange}>
      {theme === 'light' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  button: css`
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    &:hover {
      background: ${theme.colors.emphasize(theme.colors.background.secondary, 0.03)};
    }
  `,
});
