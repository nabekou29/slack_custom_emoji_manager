/**
 * htmlから要素を取得
 * セレクタにより要素を絞る事ができます
 * @param resource htmlファイル名
 * @param selector セレクタ
 */
const fetchHtml = async <T extends HTMLElement>(resource: string, selector?: string) => {
  const res = await fetch(chrome.runtime.getURL(resource), { method: 'GET' });
  const html = await res.text();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  if (selector) {
    return wrapper.querySelector(selector) as T;
  }
  return wrapper.firstChild as T;
};

/** 一括ダウンロードボタン */
export const createDownloadAllEmojiButton = () =>
  fetchHtml<HTMLDivElement>('buttons.html', '.download-all');
/** 一括削除ボタン */
export const createDeleteAllEmojiButton = () =>
  fetchHtml<HTMLDivElement>('buttons.html', '.delete-all');
/** 確認ダイアログ */
export const createAllDeleteDialog = () => fetchHtml<HTMLDivElement>('all_delete_dialog.html');
/** ドロップゾーン */
export const createDropzone = () => fetchHtml<HTMLDivElement>('dropzone.html', '#upload-dropzone');
/** ドロップゾーン用プレビュー */
export const createDropzonePreviewTemplate = () =>
  fetchHtml<HTMLDivElement>('dropzone.html', '.preview-template');
