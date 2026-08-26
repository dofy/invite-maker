import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createTheme, localStorageColorSchemeManager, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './i18n';
import App from './App';
import { PwaStatus } from './components/PwaStatus';
import './styles.css';

const theme = createTheme({
  primaryColor: 'gold',
  colors: {
    gold: ['#fff7e7', '#f7e9cf', '#ead2a3', '#dcb976', '#d1a04e', '#c78e35', '#b97d2a', '#9f6722', '#80511f', '#68431d'],
  },
  fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  headings: { fontFamily: '"Playfair Display", "Songti SC", serif' },
  defaultRadius: 'md',
});

const colorSchemeManager = localStorageColorSchemeManager({ key: 'invite-maker-theme' });

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing application root');
rootElement.replaceChildren();

createRoot(rootElement).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto" colorSchemeManager={colorSchemeManager}>
      <Notifications position="top-right" limit={4} />
      <PwaStatus />
      <App />
    </MantineProvider>
  </StrictMode>,
);
