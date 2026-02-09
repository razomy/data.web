import {i18n} from './translates';
// import {directoriesTree, directoryToNavigationNode} from '../razomy/db';
import type {NavigationNode, RzmNuxtConfig} from '@razomy/nuxt/runtime/functions';

// import type {Category} from '@razomy/nuxt/runtime/functions';
// import {lT} from '../razomy/db/alies';

const subdomainName = 'data' as const;
const domain = `${subdomainName}.razomy.org` as const;
const url = `https://${domain}` as const;
const cookie = {
  session: {locale: `${subdomainName}.razomy.org-session-locale`,}
} as const;

const externalNavigationRoot = {
  id: 'data.razomy.org',
  meta: {
    key: 'data',
    labelText: 'data.web.navbar.products.data',
    iconName: 'https://data.razomy.org/favicon.svg',
    url: 'https://data.razomy.org'
  },
  children: [
    {
      id: 'io.razomy.org',
      children: [],
      meta: {
        key: 'io',
        labelText: 'data.web.navbar.products.io',
        iconName: 'https://io.razomy.org/favicon.svg',
        url: 'https://io.razomy.org'
      },
    },
    {
      id: 'data.razomy.org',
      children: [],
      meta: {
        key: 'data',
        labelText: 'data.web.navbar.products.data',
        iconName: 'https://data.razomy.org/favicon.svg',
        url: 'https://data.razomy.org'
      },
    },
    // {
    //   key: 'razomy',
    //   labelText: 'data.web.navbar.products.razomy',
    //   iconName: 'https://www.razomy.org/favicon.svg',
    //   url: 'https://razomy.org'
    // },
    // {
    //   key: 'id',
    //   labelText: 'data.web.navbar.products.id',
    //   iconName: 'https://id.razomy.org/favicon.svg',
    //   url: 'https://id.razomy.org'
    // },
    // {
    //   key: 'data',
    //   labelText: 'data.web.navbar.products.id',
    //   iconName: 'https://data.razomy.org/favicon.svg',
    //   url: 'https://data.razomy.org'
    // },
    // {
    //   key: 'monster-match',
    //   labelText: 'data.web.navbar.products.monster-match',
    //   iconName: 'https://monster-match.razomy.org/favicon.svg',
    //   url: 'https://monster-match.razomy.org'
    // },
  ] as NavigationNode[],
} as const satisfies NavigationNode;

export const c = {
  headerNavigationNodes: [],
  footerNavigationNodes: [{
    meta: {
      labelText: 'data.web.footer.github',
      url: 'https://github.com/razomy/data.web',
      iconName: 'mdi-github',
      key: 'github.com/razomy/data.web'
    },
    children: [],
    id: 'github.com/razomy/data.web'
  }],
  externalNavigationRoot: externalNavigationRoot,
  navigationRoot: {
    meta: {
      key: 'root',
      iconName: 'mdi-home',
      url: '/',
      labelText: '' //lT('home').fullText,
    },
    id: 'root',
    children: [] //directoriesTree.map(directoryToNavigationNode),
  },
  url,
  cookie,
  i18n,
} as const satisfies RzmNuxtConfig;
