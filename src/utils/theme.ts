export const getGrafanaTheme = (): 'light' | 'dark' => {
  try {
    // Check if we're running in Grafana context
    if (typeof window !== 'undefined' && (window as any).grafanaBootData?.user?.theme) {
      const userTheme = (window as any).grafanaBootData.user.theme;
      console.log('userTheme', userTheme);

      if (userTheme === 'dark') {
        return 'dark';
      } else if (userTheme === 'light') {
        return 'light';
      } else if (userTheme === 'system') {
        // Check system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    }
  } catch (error) {
    console.warn('Could not access Grafana theme, falling back to dark theme:', error);
  }

  // Default fallback
  return 'dark';
};
