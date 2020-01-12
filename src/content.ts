import { allDeleteDialog, deleteAllEmojiButton, downloadAllEmojiButton } from './element';
import { deleteEmoji, fetchEmojiImageAndAlias, workSpaceName } from './slack';

import JSZip from 'jszip';
import axios from 'axios';
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
 */
const deleteAllEmoji = async () => {
  const [emojis, aliases] = await fetchEmojiImageAndAlias();

  for (const name of [...Object.keys(aliases), ...Object.keys(emojis)]) {
    // 削除
    await deleteEmoji(name).catch(async () => {
      // 失敗したら3秒後に再度投げる
      await sleep(3000);
      await deleteEmoji(name).catch(async () => {
        // 失敗したら10秒後に再度投げる
        await sleep(10000);
        await deleteEmoji(name);
      });
    });
    await sleep(200);
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
  if (!closeButton || !cancelButton || !confirmButton) return;

  // ×ボタン/キャンセルボタン押下時
  [closeButton, cancelButton].forEach(b => b.addEventListener('click', dialog.remove));

  // 削除ボタン押下時処理
  confirmButton.addEventListener('click', async () => {
    cancelButton.addEventListener('click', () => window.location.reload());
    // ×ボタン/キャンセルボタンを押下不可にする
    [closeButton, cancelButton].forEach(b => {
      b.setAttribute('disabled', 'disabled');
      b.classList.add('c-button--disabled');
    });
    // スピナーを表示
    confirmButton.querySelector('.c-infinite_spinner')?.classList.remove('c-button--loading_spinner--hidden');

    // 削除処理
    await deleteAllEmoji().catch(window.location.reload);
    window.location.reload();
  });
});
