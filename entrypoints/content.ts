import '@/assets/css/main.scss';

import * as element from '@/lib/element';
import * as storage from '@/lib/storage';

import {
  HttpError,
  deleteEmoji,
  fetchEmojiImageAndAlias,
  getLocalStorageData,
  slackBootData,
  uploadEmoji,
  workSpaceName,
} from '@/lib/slack';
import { formatDate, retry, downloadBlob, sleep } from '@/lib/util';

import Dropzone from 'dropzone';
import JSZip from 'jszip';
import JabQueue from '@/lib/jobQueue';
import elementReady from 'element-ready';

export default defineContentScript({
  matches: ['*://*.slack.com/*'],

  async main() {
    /**
     * 全ての絵文字をダウンロード
     */
    const downloadAllEmoji = async () => {
      const [emojis, aliases] = await fetchEmojiImageAndAlias();
      const zip = new JSZip();

      // 絵文字をダウンロード・zip化
      const jobs = Object.entries(emojis).map(([name, url]) => async () => {
        await retry(
          async () => {
            const res = await fetch(url);
            if (!res.ok) throw new HttpError(res.status);
            const buffer = await res.arrayBuffer();
            const extension = url.match(/.*\.(\w+)/)?.[1];
            zip.file(`${name}.${extension}`, buffer);
          },
          { num: 1, sleep: 3000 }
        );
        // 負荷軽減
        await sleep(100);
      });
      await new Promise(
        (resolve) =>
          new JabQueue(jobs, { concurrency: 5, onComplete: () => resolve(undefined) })
      );

      // エイリアスをJSONファイルとしてzip化
      if (Object.keys(aliases).length) {
        zip.file('_alias.json', JSON.stringify(aliases, null, 2));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      await downloadBlob(content, `emoji_${workSpaceName}_${formatDate(new Date())}.zip`);
    };

    /**
     * 全ての絵文字を削除
     */
    const deleteAllEmoji = async (names: string[], callback: (cnt: number) => unknown) => {
      const condition = (e: HttpError) => e.status === 429;

      const jobs = names.map((name, i) => async () => {
        await retry(() => deleteEmoji(name), { condition, num: 3, sleep: 3000 });
        await sleep(100);
        return i + 1;
      });
      await new Promise(
        (resolve) =>
          new JabQueue(jobs, {
            concurrency: 1,
            onSuccess: (cnt) => callback(cnt),
            onComplete: () => resolve(undefined),
          })
      );
    };

    /**
     * 削除ボタン押下時処理
     */
    const handleClickDeleteAllEmojiButton = async () => {
      const dialog = await element.createAllDeleteDialog();

      document.body.appendChild(dialog);
      dialog.style.display = 'unset';

      const [closeButton, cancelButton, confirmButton] = [
        dialog.querySelector<HTMLButtonElement>('button.close')!,
        dialog.querySelector<HTMLButtonElement>('button.cancel')!,
        dialog.querySelector<HTMLButtonElement>('button.confirm')!,
      ];
      const progressWrapper = dialog.querySelector<HTMLDivElement>('.cem-progress')!;

      closeButton.addEventListener('click', () => dialog.remove());
      cancelButton.addEventListener('click', () => dialog.remove());

      confirmButton.addEventListener('click', async () => {
        confirmButton.disabled = true;

        closeButton.addEventListener('click', () => window.location.reload());
        cancelButton.addEventListener('click', () => window.location.reload());

        confirmButton
          .querySelector('.c-infinite_spinner')
          ?.classList.remove('c-button--loading_spinner--hidden');

        const [emojis, aliases] = await fetchEmojiImageAndAlias();
        const names = [...Object.keys(emojis), ...Object.keys(aliases)];

        progressWrapper.style.display = 'block';
        const [progressBar, progressContent] = [
          progressWrapper.querySelector<HTMLDivElement>('.cem-progress-bar')!,
          progressWrapper.querySelector<HTMLDivElement>('.cem-progress-contents')!,
        ];
        const updateProgress = (cnt: number) => {
          progressBar.style.width = `${(cnt / names.length) * 100}%`;
          progressContent.innerText = `${cnt} / ${names.length}`;
        };
        updateProgress(0);

        await deleteAllEmoji(names, updateProgress).catch(() => window.location.reload());
        window.location.reload();
      });
    };

    /**
     * ドロップゾーンの初期化
     */
    const initDropzone = async (): Promise<[Dropzone, HTMLDivElement]> => {
      Dropzone.autoDiscover = false;
      const dropzoneElm = await element.createDropzone();
      const dropzone = new Dropzone(dropzoneElm, {
        url: 'mock',
        autoProcessQueue: false,
        previewTemplate: (await element.createDropzonePreviewTemplate()).outerHTML,
        acceptedFiles: 'image/*',
        dictDefaultMessage: chrome.i18n.getMessage('dropzone_dict'),
      });

      const queue = new JabQueue<void, HttpError>([], { concurrency: 1 });

      dropzone.on('addedfile', async (file) => {
        const name = file.name.match(/(.*)\.\w+/)?.[1] ?? '';
        const imageWrapper = file.previewElement.querySelector('.cem-dz-image')!;
        const condition = (e: HttpError) => e.status === 429;

        queue.add(async () => {
          await retry(() => uploadEmoji(name, file.name, file), {
            condition,
            num: 3,
            sleep: 3000,
          })
            .then((res) => {
              if (res.error) {
                throw new Error(res.error);
              }
              imageWrapper.classList.remove('loading');
            })
            .catch((e) => {
              if (!(e instanceof Error)) return;
              imageWrapper.classList.replace('loading', 'warning');
              const tooltipContent = imageWrapper.querySelector<HTMLSpanElement>(
                '.warning-mark .cem-tooltip .content'
              )!;
              tooltipContent.innerHTML = `${file.name}<br>[Error] ${e.message}`;
            });
          await sleep(100);
        });
      });

      return [dropzone, dropzoneElm];
    };

    /* 要素の追加イベントの登録を行う */
    elementReady('.p-customize_emoji_wrapper').then(async () => {
      const option =
        (await storage.get('workSpaceOptions'))?.[slackBootData.teamId] || storage.defaultOption;

      document.querySelector('.cem-empty-message')?.remove();

      const emojiCountOrigin = document.querySelector<HTMLHeadingElement>(
        '[data-qa=customize_emoji_count]'
      )!;
      const emojiCount = emojiCountOrigin.cloneNode(true) as HTMLHeadingElement;
      emojiCountOrigin.removeAttribute('class');
      emojiCountOrigin.style.display = 'none';
      emojiCountOrigin.parentElement!.insertBefore(emojiCount, emojiCountOrigin);

      emojiCount.classList.add('cem-emoji-count');

      const addAliasButton = document.querySelector(
        'button[data-qa=customize_emoji_add_alias]'
      )!;
      const buttonsWrapper = addAliasButton.parentElement!;

      buttonsWrapper.removeAttribute('class');
      buttonsWrapper.classList.add('button-list');

      const [_, dropzoneElm] = await initDropzone();
      buttonsWrapper.parentNode!.insertBefore(dropzoneElm, buttonsWrapper.nextSibling);

      const downloadAllEmojiButton = await element.createDownloadAllEmojiButton();
      buttonsWrapper.appendChild(downloadAllEmojiButton);
      downloadAllEmojiButton.addEventListener('click', async () => {
        const spinner = downloadAllEmojiButton.querySelector('.c-infinite_spinner');
        downloadAllEmojiButton.disabled = true;
        spinner?.classList.remove('c-button--loading_spinner--hidden');
        try {
          await downloadAllEmoji();
        } catch (e) {
          alert(e);
        } finally {
          downloadAllEmojiButton.disabled = false;
          spinner?.classList.add('c-button--loading_spinner--hidden');
        }
      });

      if (option.showDeleteButton) {
        const deleteAllEmojiButton = await element.createDeleteAllEmojiButton();
        buttonsWrapper.appendChild(deleteAllEmojiButton);
        deleteAllEmojiButton.addEventListener('click', handleClickDeleteAllEmojiButton);
      }
    });

    // 絵文字が登録されていない場合の、要素の追加イベントの登録を行う
    elementReady('.p-customize_emoji_wrapper__empty_words').then(async () => {
      const emptyMessage = await element.createEmptyMessage();
      const emptyWordsWrapper = document.querySelector<HTMLHeadingElement>(
        '.p-customize_emoji_wrapper__empty_words'
      );
      emptyWordsWrapper?.before(emptyMessage);
    });

    /* 絵文字の総数を増減する */
    const changeEmojiNumber = (diff: number) => () => {
      const emojiCount = document.querySelector<HTMLHeadingElement>('.cem-emoji-count');
      if (!emojiCount) {
        return;
      }
      const txt = emojiCount.innerText || '';
      const nextNum = parseInt(txt, 10) + diff;
      emojiCount.innerHTML = txt.replace(/\d+/, nextNum.toString());

      if (nextNum === 0) {
        window.location.reload();
      }
    };

    /* backgroundとの連携を行う */
    chrome.runtime.sendMessage('cem:init');
    const callbacks: Record<string, () => void> = {
      'cem:add': changeEmojiNumber(1),
      'cem:remove': changeEmojiNumber(-1),
    };
    chrome.runtime.onMessage.addListener(
      (message: string) => callbacks[message]?.()
    );

    /* ローカルストレージの情報を拡張のストレージに保存 */
    const data = getLocalStorageData();
    await storage.set('slack', data);
  },
});
