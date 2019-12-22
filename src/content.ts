import { BASE_URL, EmojiListResult, WebAPICallResult, slackApiData } from './slack';
import { allDeleteDialog, deleteAllEmojiButton, downloadAllEmojiButton } from './element';

import JSZip from 'jszip';
import axios from 'axios';
import elementReady from 'element-ready';

const ELEMENT_TO_INSERT_BEFORE_SELECTOR = '.p-customize_emoji_wrapper';

/**
 * 処理を指定時間中断します
 * @param ms 止める時間
 */
const sleep = (ms: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

/**
 * 絵文字とエイリアスの一覧を取得
 * @return [絵文字, エイリアス]
 */
const fetchEmojiImageAndAlias = async (): Promise<[{ [k: string]: string }, { [k: string]: string }]> => {
  const res = await axios.get<EmojiListResult>(`${BASE_URL}/emoji.list`, {
    params: { token: slackApiData.apiToken }
  });

  // 絵文字
  const emojiMap = Object.entries(res.data.emoji)
    .filter(([_, url]: [string, string]) => !url.match(/alias:.*/))
    .reduce((emojis, [name, url]) => ({ [name]: url, ...emojis }), {} as { [k: string]: string });
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
  downLoadLink.dataset.downloadurl = ['blob', downLoadLink.download, downLoadLink.href].join(':');
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
  saveZipFile(zip, `emoji_${c.getFullYear()}_${c.getMonth() + 1}_${c.getDate()}.zip`);
};

/**
 * 全ての絵文字を削除
 */
const deleteAllEmoji = async () => {
  const [emojis, aliases] = await fetchEmojiImageAndAlias();

  // eslint-disable-next-line no-restricted-syntax
  for (const name of [...Object.keys(aliases), ...Object.keys(emojis)]) {
    // パラメータを作成
    const params = new FormData();
    params.append('name', name);
    params.append('token', slackApiData.apiToken);

    const deleteEmoji = () =>
      axios.post<WebAPICallResult>(`${BASE_URL}/emoji.remove`, params, {
        headers: { 'content-type': 'multipart/form-data' }
      });

    // 削除
    // eslint-disable-next-line no-await-in-loop
    await deleteEmoji().catch(async () => {
      // 失敗したら3秒後に再度投げる
      await sleep(3000);
      await deleteEmoji().catch(async () => {
        // 失敗したら10秒後に再度投げる
        await sleep(10000);
        await deleteEmoji();
      });
    });
  }

  window.location.reload();
};

// ボタンの追加
elementReady(ELEMENT_TO_INSERT_BEFORE_SELECTOR).then(async () => {
  // エイリアス追加ボタン
  const addAliasButton = document.querySelector('button[data-qa=customize_emoji_add_alias]');
  const buttonsWrapper = addAliasButton?.parentElement;

  if (!addAliasButton || !buttonsWrapper) return;

  // ボタンのラッパー要素の配置を修正
  buttonsWrapper.removeAttribute('class');
  buttonsWrapper.style.marginBottom = '12px';

  // ボタンの追加
  buttonsWrapper.appendChild(downloadAllEmojiButton);
  buttonsWrapper.appendChild(deleteAllEmojiButton);
});

// 一括ダウンロード処理
downloadAllEmojiButton.addEventListener('click', downloadAllEmoji);
// 一括削除処理
deleteAllEmojiButton.addEventListener('click', () => {
  // ダイアログ表示
  const dialog = allDeleteDialog.cloneNode(true) as HTMLDivElement;

  document.body.appendChild(dialog);
  dialog.style.display = 'unset';

  const closeButton = dialog.querySelector('button.close');
  const cancelButton = dialog.querySelector('button.cancel');
  const confirmButton = dialog.querySelector('button.confirm');

  if (!closeButton || !cancelButton || !confirmButton) return;

  closeButton.addEventListener('click', () => {
    dialog.remove();
  });
  cancelButton.addEventListener('click', () => {
    dialog.remove();
  });

  // 削除ボタン押下時処理
  confirmButton.addEventListener('click', async () => {
    closeButton.setAttribute('disabled', 'disabled');
    closeButton.classList.add('c-button--disabled');

    cancelButton.addEventListener('click', () => window.location.reload());

    confirmButton.setAttribute('disabled', 'disabled');
    confirmButton.classList.add('c-button--disabled');
    // スピナーを表示
    confirmButton.querySelector('.c-infinite_spinner')?.classList.remove('c-button--loading_spinner--hidden');
    await deleteAllEmoji().catch(() => {
      window.location.reload();
    });
  });
});
