/* eslint-disable camelcase */
import axios from 'axios';
import { SlackLocalStorageData } from './types/slackLocalStorage';

export const BASE_URL = 'https://slack.com/api';

/** emoji.listのレスポンスに標準で含まれる絵文字 */
export const defaultEmojis = [
  'bowtie',
  'cubimal_chick',
  'dusty_stick',
  'glitch_crab',
  'piggy',
  'pride',
  'simple_smile',
  'slack_call',
  'slack',
  'squirrel',
  'thumbsup_all'
];

/** emoji.listのレスポンスに標準で含まれるエイリアス */
export const defaultAliases = ['black_square', 'white_square', 'shipit'];

/** ワークスペース名 */
export const workSpaceName = window.location.href.match(/.*:\/\/(.*).slack.com\/.*/)?.[1];

export interface EmojiListResult extends WebAPICallResult {
  emoji: { [key: string]: string };
}

export interface WebAPICallResult {
  ok: boolean;
  error?: string;
  response_metadata?: {
    warnings?: string[];
    next_cursor?: string;
    scopes?: string[];
    acceptedScopes?: string[];
    retryAfter?: number;
    messages?: string[];
  };
  [key: string]: unknown;
}

/** Slackの情報 */
export const slackBootData = (() => {
  let apiToken = '';
  let versionUid = '';
  let teamId = '';

  // scriptをリストにする
  const scriptList: HTMLElement[] = [];
  document
    .querySelectorAll<HTMLElement>('script[type="text/javascript"]')
    .forEach(script => scriptList.push(script));

  // 埋め込まれているscriptからTokenなどを取得
  scriptList.some(script => {
    const isBootDataScript = /var\sboot_data\s=\s\{/.test(script.innerText);

    if (!isBootDataScript) {
      return false;
    }

    const apiTokenResult = /"?api_token"?:\s*"(.+?)"/g.exec(script.innerText);
    const versionUidResult = /"?version_uid"?:\s*"(.+?)"/g.exec(script.innerText);
    const teamIdResult = /"?team_id"?:\s*"(.+?)"/g.exec(script.innerText);

    apiToken = apiTokenResult?.[1] ?? '';
    versionUid = versionUidResult?.[1] ?? '';
    teamId = teamIdResult?.[1] ?? '';
    return true;
  });

  return {
    apiToken,
    versionUid,
    teamId
  };
})();

/**
 * 絵文字とエイリアスの一覧を取得
 * @return [絵文字, エイリアス]
 */
export const fetchEmojiImageAndAlias = async (): Promise<[
  { [k: string]: string },
  { [k: string]: string }
]> => {
  const res = await axios.get<EmojiListResult>(`${BASE_URL}/emoji.list`, {
    params: { token: slackBootData.apiToken }
  });

  // エイリアスかのチェック
  const isAlias = (url: string) => url.match(/alias:.*/);

  // 絵文字
  const emojiMap = Object.entries(res.data.emoji)
    .filter(([name, url]: [string, string]) => !isAlias(url) && !defaultEmojis.includes(name))
    .reduce<{ [k: string]: string }>((emojis, [name, url]) => ({ [name]: url, ...emojis }), {});
  // エイリアス
  const aliasMap = Object.entries(res.data.emoji)
    .filter(([name, url]: [string, string]) => isAlias(url) && !defaultAliases.includes(name))
    .reduce<{ [k: string]: string }>(
      (aliases, [name, alias]) => ({
        [name]: alias.match(/alias:(.*)/)?.[1] ?? '',
        ...aliases
      }),
      {}
    );

  return [emojiMap, aliasMap];
};

/**
 * 絵文字を追加します
 * @param name 名前
 * @param fileName ファイル名
 * @param image 画像
 */
export const uploadEmoji = (name: string, fileName: string, image: Blob) => {
  const form = new FormData();
  form.append('mode', 'data');
  form.append('name', name);
  form.append('image', image, fileName);
  form.append('token', slackBootData.apiToken);

  return axios.post<WebAPICallResult>(`${BASE_URL}/emoji.add`, form);
};

/**
 * エイリアスを追加します
 * @param target 対象
 * @param alias エイリアス
 */
export const uploadAlias = (target: string, alias: string) => {
  const form = new FormData();
  form.append('mode', 'alias');
  form.append('name', alias);
  form.append('alias_for', target);
  form.append('token', slackBootData.apiToken);

  return axios.post<WebAPICallResult>(`${BASE_URL}/emoji.add`, form);
};

/**
 * 絵文字/エイリアスを削除します
 * @param name 絵文字名/エイリアス名
 * @return レスポンス
 */
export const deleteEmoji = (name: string) => {
  const form = new FormData();
  form.append('name', name);
  form.append('token', slackBootData.apiToken);

  return axios.post<WebAPICallResult>(`${BASE_URL}/emoji.remove`, form);
};

/**
 * Slackで保存されているLocalStorageのデータを取得します
 * @returns LocalStorageのデータ
 */
export const getLocalStorageData = () => {
  const data = localStorage.getItem('localConfig_v2');
  if (!data) {
    return undefined;
  }
  return JSON.parse(data) as SlackLocalStorageData;
};
