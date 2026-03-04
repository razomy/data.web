import { initializeApp, getApps } from 'firebase-admin/app';
import { useRuntimeConfig } from '#imports';

const config = useRuntimeConfig();

const apps = getApps();

// initializeApp() with no credential argument automatically uses Application Default Credentials.
// We pass projectId just to be absolutely sure it connects to the right project.
const appAdmin = apps.length
  ? apps[0]
  : initializeApp({
    projectId: config.public.firebaseConfig.projectId,
  });

export {appAdmin};