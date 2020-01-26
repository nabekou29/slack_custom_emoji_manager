import axios, { AxiosError } from 'axios';
import {
  createAllDeleteDialog,
  createDeleteAllEmojiButton,
  createDownloadAllEmojiButton,
  createDropzone,
  createDropzonePreviewTemplate
} from './element';
import { deleteEmoji, fetchEmojiImageAndAlias, workSpaceName } from './slack';

import Dropzone from 'dropzone';
import JSZip from 'jszip';
import elementReady from 'element-ready';

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
  if (Object.keys(aliases).length) {
    zip.file('_alias.json', JSON.stringify(aliases, null, 2));
  }

  const current = new Date();
  // yyyy_MM_dd の形式で日付を取得
  const formatedCurrentDate = [
    `000${current.getFullYear()}`.slice(-4),
    `0${current.getMonth() + 1}`.slice(-2),
    `0${current.getDate()}`.slice(-2)
  ].join('_');
  saveZipFile(zip, `emoji_${workSpaceName}_${formatedCurrentDate}.zip`);
};

/**
 * 全ての絵文字を削除
 * @prams names 名前の一覧
 * @prams callback 削除が1つ完了する度に呼ばれる関数
 */
const deleteAllEmoji = async (names: string[], callback: (cnt: number) => void) => {
  // 失敗時にリクエストを投げ直す回数
  const RE_POST_NUM = 3;

  let cnt = 0;
  for (const name of names) {
    for (const i of [...Array(RE_POST_NUM + 1).keys()]) {
      try {
        // 削除
        await deleteEmoji(name);
        break;
      } catch (e) {
        const err = e as AxiosError;
        // リクエスト過多で失敗した場合3秒後に再度投げる
        if (i !== RE_POST_NUM && err.response?.status === 429) {
          await sleep(3000);
          // eslint-disable-next-line no-continue
          continue;
        }
        throw e;
      }
    }
    cnt += 1;
    callback(cnt);
    // 負荷軽減
    await sleep(100);
  }
};

/**
 * 削除ボタン押下時処理
 */
const onClickDeleteAllEmojiButton = async () => {
  // ダイアログ表示
  const dialog = await createAllDeleteDialog();
  document.body.appendChild(dialog);
  dialog.style.display = 'unset';

  // 各ボタンを取得
  const [closeButton, cancelButton, confirmButton] = ['button.close', 'button.cancel', 'button.confirm'].map(selector =>
    dialog.querySelector<HTMLButtonElement>(selector)
  );
  // プログレスバーを取得
  const progressWrapper = dialog.querySelector<HTMLDivElement>('.progress');
  if (!closeButton || !cancelButton || !confirmButton || !progressWrapper) return;

  // ×ボタン/キャンセルボタン押下時にダイアログを閉じる
  [closeButton, cancelButton].forEach(b => b.addEventListener('click', () => dialog.remove()));

  // 削除ボタン押下時処理
  confirmButton.addEventListener('click', async () => {
    // ×ボタン/キャンセルボタン押下に画面を更新
    [closeButton, cancelButton].forEach(b => b.addEventListener('click', () => window.location.reload()));
    // スピナーを表示
    confirmButton.querySelector('.c-infinite_spinner')?.classList.remove('c-button--loading_spinner--hidden');
    // プログレスバーを表示
    progressWrapper.style.display = 'block';
    const progressBar = progressWrapper.querySelector<HTMLDivElement>('.progress-bar');
    const progressContent = progressWrapper.querySelector<HTMLDivElement>('.progress-contents');
    if (!progressBar || !progressContent) return;

    const [emojis, aliases] = await fetchEmojiImageAndAlias();
    const names = [...Object.keys(emojis), ...Object.keys(aliases)];
    const updateProgress = (cnt: number) => {
      progressBar.style.width = `${(cnt / names.length) * 100}%`;
      progressContent.innerText = `${cnt} / ${names.length}`;
    };
    updateProgress(0);

    // 削除処理
    await deleteAllEmoji(names, updateProgress).catch(() => window.location.reload());
    window.location.reload();
  });
};

// ボタンの追加
elementReady('.p-customize_emoji_wrapper').then(async () => {
  // エイリアス追加ボタン
  const addAliasButton = document.querySelector('button[data-qa=customize_emoji_add_alias]');
  const buttonsWrapper = addAliasButton?.parentElement;
  if (!addAliasButton || !buttonsWrapper) return;

  // ボタンのラッパー要素のクラスを修正
  buttonsWrapper.removeAttribute('class');
  buttonsWrapper.classList.add('button-list');

  // ドロップゾーンを追加
  Dropzone.autoDiscover = false;
  const dropzoneElm = await createDropzone();
  buttonsWrapper.parentNode?.insertBefore(dropzoneElm, buttonsWrapper.nextSibling);
  const dropzone = new Dropzone(dropzoneElm, {
    url: 'mock',
    autoProcessQueue: false,
    previewTemplate: (await createDropzonePreviewTemplate()).outerHTML,
    acceptedFiles: 'image/*',
    dictDefaultMessage: 'ここに追加したい絵文字をドラッグ＆ドロップ'
  });
  dropzone.on('addedfiles', file => {
    console.log(file);
  });

  // ボタンを作成
  const downloadAllEmojiButton = await createDownloadAllEmojiButton();
  const deleteAllEmojiButton = await createDeleteAllEmojiButton();
  // ボタンの追加
  buttonsWrapper.appendChild(downloadAllEmojiButton);
  buttonsWrapper.appendChild(deleteAllEmojiButton);
  // 一括ダウンロード処理
  downloadAllEmojiButton.addEventListener('click', downloadAllEmoji);
  // 一括削除処理
  deleteAllEmojiButton.addEventListener('click', onClickDeleteAllEmojiButton);
});
