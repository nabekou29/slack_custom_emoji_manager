import axios, { AxiosError } from 'axios';
import {
  createAllDeleteDialog,
  createDeleteAllEmojiButton,
  createDownloadAllEmojiButton,
  createDropzone,
  createDropzonePreviewTemplate
} from './element';
import { deleteEmoji, fetchEmojiImageAndAlias, workSpaceName } from './slack';
import { formatDate, runTasksSequential, saveZipFile } from './util';

import Dropzone from 'dropzone';
import JSZip from 'jszip';
import elementReady from 'element-ready';

/**
 * 絵文字の数を1増加します
 */
const countUpEmoji = () => {
  const emojiNum = document.querySelector<HTMLElement>('[data-qa=customize_emoji_count]')!;
  const txt = emojiNum.innerText || '';
  const nextNum = parseInt(txt, 10) + 1;
  emojiNum.innerText = txt.replace(/\d+/, nextNum.toString());
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

  saveZipFile(zip, `emoji_${workSpaceName}_${formatDate(new Date())}.zip`);
};

/**
 * 全ての絵文字を削除
 * @prams names 名前の一覧
 * @prams callback 削除が1つ完了する度に呼ばれる関数
 */
const deleteAllEmoji = async (names: string[], callback: (cnt: number) => void) => {
  const tasks = names.map(name => () => deleteEmoji(name));
  const rePostCondition = (e: AxiosError) => e.response?.status === 429;
  await runTasksSequential(tasks, {
    callback: (_, cnt) => callback(cnt),
    rePostCondition
  });
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
  const [closeButton, cancelButton, confirmButton] = [
    dialog.querySelector<HTMLButtonElement>('button.close')!,
    dialog.querySelector<HTMLButtonElement>('button.cancel')!,
    dialog.querySelector<HTMLButtonElement>('button.confirm')!
  ];
  // プログレスバーを取得
  const progressWrapper = dialog.querySelector<HTMLDivElement>('.progress')!;

  // ×ボタン/キャンセルボタン押下時にダイアログを閉じる
  closeButton.addEventListener('click', () => dialog.remove());
  cancelButton.addEventListener('click', () => dialog.remove());

  // 削除ボタン押下時処理
  confirmButton.addEventListener('click', async () => {
    // ×ボタン/キャンセルボタン押下に画面を更新
    closeButton.addEventListener('click', () => window.location.reload());
    cancelButton.addEventListener('click', () => window.location.reload());

    // スピナーを表示
    confirmButton
      .querySelector('.c-infinite_spinner')
      ?.classList.remove('c-button--loading_spinner--hidden');

    const [emojis, aliases] = await fetchEmojiImageAndAlias();
    const names = [...Object.keys(emojis), ...Object.keys(aliases)];

    // プログレスバーの更新
    progressWrapper.style.display = 'block';
    const [progressBar, progressContent] = [
      progressWrapper.querySelector<HTMLDivElement>('.progress-bar')!,
      progressWrapper.querySelector<HTMLDivElement>('.progress-contents')!
    ];
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
  const addAliasButton = document.querySelector('button[data-qa=customize_emoji_add_alias]')!;
  const buttonsWrapper = addAliasButton.parentElement!;

  // ボタンのラッパー要素のクラスを修正
  buttonsWrapper.removeAttribute('class');
  buttonsWrapper.classList.add('button-list');

  // ドロップゾーンを追加
  (async () => {
    Dropzone.autoDiscover = false;
    const dropzoneElm = await createDropzone();
    buttonsWrapper.parentNode!.insertBefore(dropzoneElm, buttonsWrapper.nextSibling);
    const dropzone = new Dropzone(dropzoneElm, {
      url: 'mock',
      autoProcessQueue: false,
      previewTemplate: (await createDropzonePreviewTemplate()).outerHTML,
      acceptedFiles: 'image/*',
      dictDefaultMessage: 'ここに追加したい絵文字をドラッグ＆ドロップ'
    });
    dropzone.on('addedfiles', file => {
      console.log(file);
      countUpEmoji();
    });
  })();

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
