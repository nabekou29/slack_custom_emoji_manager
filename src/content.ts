import { allDeleteDialog, deleteAllEmojiButton, downloadAllEmojiButton } from './element';
import axios, { AxiosError } from 'axios';
import { deleteEmoji, fetchEmojiImageAndAlias, workSpaceName } from './slack';

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
const deleteAllEmoji = async (names: string[], callback: () => void) => {
  // 失敗時にリクエストを投げ直す回数
  const RE_POST_NUM = 3;
  for (const name of names) {
    [...Array(RE_POST_NUM + 1).keys()].some(async i => {
      try {
        // 削除
        await deleteEmoji(name);
        return true;
      } catch (e) {
        const err = e as AxiosError;
        // リクエスト過多で失敗した場合3秒後に再度投げる
        if (i !== RE_POST_NUM && err.response?.status === 429) {
          await sleep(3000);
          return false;
        }
        throw e;
      }
    });
    callback();
    // 負荷軽減
    await sleep(100);
  }
};

// ボタンの追加
elementReady('.p-customize_emoji_wrapper').then(async () => {
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

  // 各ボタンを取得
  const [closeButton, cancelButton, confirmButton] = ['button.close', 'button.cancel', 'button.confirm'].map(selector =>
    dialog.querySelector<HTMLButtonElement>(selector)
  );
  // プログレスバーを取得
  const progress = dialog.querySelector<HTMLProgressElement>('.progress');
  if (!closeButton || !cancelButton || !confirmButton || !progress) return;

  // ×ボタン/キャンセルボタン押下時にダイアログを閉じる
  [closeButton, cancelButton].forEach(b => b.addEventListener('click', () => dialog.remove()));

  // 削除ボタン押下時処理
  confirmButton.addEventListener('click', async () => {
    // ×ボタン/キャンセルボタン押下に画面を更新
    [closeButton, cancelButton].forEach(b => b.addEventListener('click', () => window.location.reload()));
    // スピナーを表示
    confirmButton.querySelector('.c-infinite_spinner')?.classList.remove('c-button--loading_spinner--hidden');
    // プログレスバーを表示
    progress.style.display = 'unset';

    const [emojis, aliases] = await fetchEmojiImageAndAlias();
    const names = [...Object.keys(emojis), ...Object.keys(aliases)];
    progress.max = names.length;
    const callback = (() => {
      let cnt = 0;
      return () => {
        cnt += 1;
        progress.value = cnt;
      };
    })();

    // 削除処理
    await deleteAllEmoji(names, callback).catch(() => window.location.reload());
    window.location.reload();
  });
});
