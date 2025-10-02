import React from 'react';
import { Button, Card, useStyles2 } from '@grafana/ui';
import { Home, RotateCcw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { prefixRoute } from 'utils/utils.routing';
import { GrafanaTheme2 } from '@grafana/data';
import { css, keyframes } from '@emotion/css';

const shake = keyframes({
  '0%, 100%': { transform: 'rotate(180deg)' },
  '25%': { transform: 'rotate(170deg)' },
  '75%': { transform: 'rotate(190deg)' },
});

const swing = keyframes({
  '0%, 100%': { transform: 'rotate(180deg)' },
  '50%': { transform: 'rotate(190deg)' },
});

const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

const bounce = keyframes({
  '0%, 20%, 53%, 80%, 100%': { transform: 'translateY(0)' },
  '40%, 43%': { transform: 'translateY(-8px)' },
  '70%': { transform: 'translateY(-4px)' },
  '90%': { transform: 'translateY(-2px)' },
});

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    minHeight: 'calc(100vh - 12rem)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 16px',
    backgroundImage: `radial-gradient(circle at 1px 1px, ${theme.colors.text.secondary}20 1px, transparent 0)`,
    backgroundSize: '32px 32px',
  }),
  card: css({
    width: '100%',
    maxWidth: '450px',
    overflow: 'hidden',
  }),
  header: css({
    textAlign: 'center',
    paddingBottom: 0,
  }),
  logoContainer: css({
    position: 'relative',
    marginBottom: 32,
  }),
  logoWrapper: css({
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    padding: '16px 0',
  }),
  logoBackground: css({
    backgroundColor: theme.colors.background.primary,
    padding: 8,
    borderRadius: '50%',
  }),
  logo: css({
    height: 64,
    width: 64,
    transform: 'rotate(180deg)',
    animation: `${swing} 1s ease-in-out infinite`,
    cursor: 'pointer',
    transition: 'all 0.3s',
    '&:hover': {
      animation: `${shake} 0.3s ease-in-out`,
    },
    '@media (min-width: 640px)': {
      height: 96,
      width: 96,
    },
  }),
  title: css({
    fontSize: 80,
    fontWeight: 'bold',
    background: `linear-gradient(to right, ${theme.colors.primary.main}, ${theme.colors.primary.main}80)`,
    backgroundClip: 'text',
    color: 'transparent',
    '@media (min-width: 640px)': {
      fontSize: 112,
    },
  }),
  content: css({
    textAlign: 'center',
    paddingBottom: 32,
    '& > *': {
      marginBottom: 12,
    },
  }),
  heading: css({
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: '-0.025em',
    '@media (min-width: 640px)': {
      fontSize: 24,
    },
  }),
  description: css({
    fontSize: 14,
    color: theme.colors.text.secondary,
    '@media (min-width: 640px)': {
      fontSize: 16,
    },
  }),
  errorMessage: css({
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    '@media (min-width: 640px)': {
      fontSize: 14,
    },
  }),
  footer: css({
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 32,
  }),
  button: css({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }),
  buttonIcon: css({
    height: 16,
    width: 16,
  }),
  backIcon: css({
    height: 16,
    width: 16,
    '&:hover': {
      animation: `${spin} 0.5s linear`,
    },
  }),
  homeIcon: css({
    height: 16,
    width: 16,
    '&:hover': {
      animation: `${bounce} 1s`,
    },
  }),
});

export function NotFound() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pathToShow = searchParams.get('path') || window.location.pathname;
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Card.Heading className={styles.header}>
          <div className={styles.logoContainer}>
            <div className={styles.logoWrapper}>
              <div className={styles.logoBackground}>
                <img
                  src="https://grafana.com/media/docs/loki/logo-grafana-loki.png"
                  alt="Loki Logo"
                  className={styles.logo}
                />
              </div>
            </div>
          </div>
          <div className={styles.title}>404</div>
        </Card.Heading>
        <Card.Description className={styles.content}>
          <h2 className={styles.heading}>Oops! Page Not Found</h2>
          <p className={styles.description}>
            Even with our powerful log aggregation, we couldn&apos;t find this page in any of our streams!
          </p>
          <p className={styles.errorMessage}>
            Error: LogQL query returned 0 results for label {`{path="${pathToShow}"}`}
          </p>
        </Card.Description>
        <Card.Tags className={styles.footer}>
          <Button variant="secondary" onClick={() => navigate(-1)} className={styles.button} size="sm">
            <RotateCcw className={styles.backIcon} />
            Go Back
          </Button>
          <Button onClick={() => navigate(prefixRoute(''))} className={styles.button} size="sm">
            <Home className={styles.homeIcon} />
            Go Home
          </Button>
        </Card.Tags>
      </Card>
    </div>
  );
}
