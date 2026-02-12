import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-svelte'],

  manifest: {
    name: '__MSG_ext_name__',
    short_name: '__MSG_ext_short_name__',
    description: '__MSG_ext_desc__',
    version: '1.3.0',
    default_locale: 'en',

    icons: {
      16: '/icon16.png',
      48: '/icon48.png',
      128: '/icon128.png',
    },

    action: {
      default_icon: {
        19: '/icon24.png',
      },
      default_title: 'Slack Custom Emoji Manager',
    },

    permissions: ['storage', 'webRequest', 'declarativeNetRequest'],
    host_permissions: ['*://*.slack.com/*', '*://emoji.slack-edge.com/*'],

    web_accessible_resources: [
      {
        resources: ['index.html', 'icon128.png'],
        matches: ['*://*.slack.com/*'],
      },
    ],

    declarative_net_request: {
      rule_resources: [
        {
          id: 'ruleset',
          enabled: true,
          path: 'rules.json',
        },
      ],
    },
  },
});
