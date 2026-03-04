import {defineNuxtConfig} from 'nuxt/config'
import {defaultNuxtConfig} from '@razomy/nuxt/runtime/functions';
import {c} from './content/context';

const cf = defaultNuxtConfig(c) as any;
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ...cf as any,
  runtimeConfig: {
    public: {
      firebaseConfig: JSON.parse(process.env['FIREBASE_CONFIG_JSON']!),
    }
  }
})
