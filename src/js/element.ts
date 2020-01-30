/** キャッシュ */
const cache: { [key: string]: HTMLDivElement } = {};

/**
 * htmlから要素を取得
 * セレクタにより要素を絞る事ができます
 * @param resource htmlファイル名
 * @param selector セレクタ
 */
const fetchHtml = async <T extends HTMLElement>(resource: string, selector?: string) => {
  const wrapper =
    cache[resource] ??
    (await (async () => {
      const res = await fetch(chrome.runtime.getURL(resource), { method: 'GET' });
      const html = await res.text();
      const div = document.createElement('div');
      div.innerHTML = html;
      cache[resource] = div;
      return div;
    })());

  if (selector) {
    return wrapper.querySelector(selector) as T;
  }
  return wrapper.firstChild as T;
};

/** 一括ダウンロードボタン */
export const createDownloadAllEmojiButton = () =>
  fetchHtml<HTMLDivElement>('index.html', '.download-all');
/** 一括削除ボタン */
export const createDeleteAllEmojiButton = () =>
  fetchHtml<HTMLDivElement>('index.html', '.delete-all');
/** 確認ダイアログ */
export const createAllDeleteDialog = () =>
  fetchHtml<HTMLDivElement>('index.html', '.all-delete-dialog');
/** ドロップゾーン */
export const createDropzone = () => fetchHtml<HTMLDivElement>('index.html', '#upload-dropzone');
/** ドロップゾーン用プレビュー */
export const createDropzonePreviewTemplate = () =>
  fetchHtml<HTMLDivElement>('index.html', '.cem-preview-template');
