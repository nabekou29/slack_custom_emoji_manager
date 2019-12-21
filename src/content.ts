import * as $ from 'jquery';

import {
  BASE_URL,
  EmojiListResult,
  WebAPICallResult,
  slackApiData
} from './slack';

import JSZip from 'jszip';
import axios from 'axios';
import elementReady from 'element-ready';

const ELEMENT_TO_INSERT_BEFORE_SELECTOR = '.p-customize_emoji_wrapper';

/** 一括ダウンロードボタン */
const $downloadAllEmojiButton = $('<button></button>')
  .addClass(['c-button', 'c-button--primary', 'c-button--medium'])
  .css('margin-left', 12)
  .text('絵文字を一括でダウンロード');

/** 一括削除ボタン */
const $deleteAllEmojiButton = $('<button></button>')
  .addClass(['c-button', 'c-button--danger', 'c-button--medium'])
  .css('margin-left', 12)
  .text('絵文字を一括で削除');

/**
 * 絵文字とエイリアスの一覧を取得
 * @return [絵文字, エイリアス]
 */
const fetchEmojiImageAndAlias = async (): Promise<[
  { [k: string]: string },
  { [k: string]: string }
]> => {
  const res = await axios.get<EmojiListResult>(`${BASE_URL}/emoji.list`, {
    params: { token: slackApiData.apiToken }
  });

  // 絵文字
  const emojiMap = Object.entries(res.data.emoji)
    .filter(([_, url]: [string, string]) => !url.match(/alias:.*/))
    .reduce(
      (emojis, [name, url]) => ({ [name]: url, ...emojis }),
      {} as { [k: string]: string }
    );
  // エイリアス
  const aliasMap = Object.entries(res.data.emoji)
    .filter(([_, url]: [string, string]) => url.match(/alias:.*/))
    .reduce(
      (aliases, [name, alias]) => ({
        [name]: alias.match(/alias:(.*)/)?.[1] ?? '',
        ...aliases
      }),
      {} as { [k: string]: string }
    );

  return [emojiMap, aliasMap];
};

/**
 * ZIPオブジェクトを保存
 * @param zip ZIP
 * @param fileName ファイル名
 */
const saveZipFile = async (zip: JSZip, fileName: string) => {
  const content = await zip.generateAsync({ type: 'blob' });

  const downLoadLink = document.createElement('a');
  downLoadLink.download = fileName;
  downLoadLink.href = URL.createObjectURL(content);
  downLoadLink.dataset.downloadurl = [
    'blob',
    downLoadLink.download,
    downLoadLink.href
  ].join(':');
  downLoadLink.click();
};

/**
 * 全ての絵文字をダウンロード
 */
const downloadAllEmoji = async () => {
  const [emojis, aliases] = await fetchEmojiImageAndAlias();
  const zip = new JSZip();

  // 絵文字をダウンロード・zip化
  await Promise.all(
    Object.entries(emojis).map(async ([name, url]) => {
      const res = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer'
      });
      const extension = url.match(/.*\.(\w+)/)?.[1];
      zip.file(`${name}.${extension}`, res.data);
    })
  );

  // エイリアスをJSONファイルとしてzip化
  zip.file('_alias.json', JSON.stringify(aliases));

  const c = new Date();
  saveZipFile(
    zip,
    `emoji_${c.getFullYear()}_${c.getMonth() + 1}_${c.getDate()}.zip`
  );
};

/**
 * 全ての絵文字を削除
 */
const deleteAllEmoji = async () => {
  const [emojis, aliases] = await fetchEmojiImageAndAlias();

  await Promise.all(
    [...Object.keys(emojis), ...Object.keys(aliases)].map(async name => {
      // パラメータを作成
      const params = new FormData();
      params.append('name', name);
      params.append('token', slackApiData.apiToken);
      // 削除
      await axios.post<WebAPICallResult>(`${BASE_URL}/emoji.remove`, params, {
        headers: { 'content-type': 'multipart/form-data' }
      });
    })
  );

  window.location.reload();
};

// ボタンの追加
elementReady(ELEMENT_TO_INSERT_BEFORE_SELECTOR).then(async () => {
  const $addAliasButton = $('button[data-qa=customize_emoji_add_alias]');
  const $buttonsWrapper = $addAliasButton.parent('div');

  $buttonsWrapper.removeAttr('class').css({ 'margin-bottom': 12 });
  $buttonsWrapper.append($downloadAllEmojiButton).append($deleteAllEmojiButton);
});

// 一括ダウンロード処理
$downloadAllEmojiButton.on('click', downloadAllEmoji);
// 一括削除処理
$deleteAllEmojiButton.on('click', deleteAllEmoji);
