import { Button, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

const OFFLINE_READY_ID = 'pwa-offline-ready';
const UPDATE_READY_ID = 'pwa-update-ready';

export function PwaStatus() {
  const { t } = useTranslation();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('Service Worker registration failed', error);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;

    notifications.show({
      id: OFFLINE_READY_ID,
      color: 'green',
      title: t('pwa.offlineTitle'),
      message: t('pwa.offlineMessage'),
      onClose: () => setOfflineReady(false),
    });
  }, [offlineReady, setOfflineReady, t]);

  useEffect(() => {
    if (!needRefresh) return;

    notifications.show({
      id: UPDATE_READY_ID,
      color: 'gold',
      title: t('pwa.updateTitle'),
      autoClose: false,
      withCloseButton: false,
      message: (
        <Stack gap="xs">
          <Text size="sm">{t('pwa.updateMessage')}</Text>
          <Group gap="xs">
            <Button
              size="xs"
              onClick={() => {
                void updateServiceWorker(true);
              }}
            >
              {t('pwa.updateNow')}
            </Button>
            <Button
              size="xs"
              variant="subtle"
              onClick={() => {
                notifications.hide(UPDATE_READY_ID);
                setNeedRefresh(false);
              }}
            >
              {t('pwa.later')}
            </Button>
          </Group>
        </Stack>
      ),
    });
  }, [needRefresh, setNeedRefresh, t, updateServiceWorker]);

  return null;
}
