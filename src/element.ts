/** 一括ダウンロードボタン */
export const downloadAllEmojiButton = (() => {
  const elm = document.createElement('button');
  elm.classList.add('c-button');
  elm.classList.add('c-button--primary');
  elm.classList.add('c-button--medium');
  elm.style.marginLeft = '12px';
  elm.innerText = '絵文字を一括でダウンロード';
  return elm;
})();

/** 一括削除ボタン */
export const deleteAllEmojiButton = (() => {
  const elm = document.createElement('button');
  elm.classList.add('c-button');
  elm.classList.add('c-button--danger');
  elm.classList.add('c-button--medium');
  elm.style.marginLeft = '12px';
  elm.innerText = '絵文字を一括で削除';
  return elm;
})();

/** 確認ダイアログ */
export const allDeleteDialog = (() => {
  const elm = document.createElement('div');
  elm.classList.add('ReactModalPortal');
  elm.innerHTML =
    ' <div class="ReactModal__Overlay ReactModal__Overlay--after-open c-dialog p-customize_emoji__dialog_overlay"> <div class="ReactModal__Content ReactModal__Content--after-open c-dialog__content p-customize_emoji_list__single_delete" tabindex="-1" role="dialog" aria-label="すべての絵文字を削除しますか？"> <div class="c-dialog__header"> <h1 class="c-dialog__title">すべての絵文字を削除しますか？</h1> <button class="c-button-unstyled c-icon_button c-icon_button--light c-icon_button--size_medium c-dialog__close close" type="button" aria-label="閉じる"> <i class="c-icon c-icon--times" type="times" aria-hidden="true"></i> </button> </div><div class="c-dialog__body c-dialog__body--slack_scrollbar"> <div> この操作により、ワークスペースの全メンバーに対して、<b>すべてのカスタム絵文字が削除</b>されます。 </div><div> ※この処理は時間がかかる場合があります。 </div></div><div class="c-dialog__footer c-dialog__footer--has_buttons"> <div class="c-dialog__footer_buttons"> <button class="c-button c-button--outline c-button--medium c-dialog__cancel null--outline null--medium cancel" type="button">キャンセル</button> <button class="c-button c-button--danger c-button--medium c-dialog__go null--danger null--medium confirm" type="button"> 削除する <div class="c-infinite_spinner c-button-loading__spinner c-button--loading_spinner--hidden c-infinite_spinner--medium c-infinite_spinner--blue"> <svg class="c-infinite_spinner__spinner" viewBox="0 0 78 78"> <circle class="c-infinite_spinner__bg" cx="50%" cy="50%" r="35" ></circle> <circle class="c-infinite_spinner__path" cx="50%" cy="50%" r="35"></circle> </svg> <svg class="c-infinite_spinner__spinner c-infinite_spinner__tail" viewBox="0 0 78 78"> <circle class="c-infinite_spinner__path" cx="50%" cy="50%" r="35" ></circle> </svg> <span aria-live="polite" class="offscreen"></span> </div></button> </div></div></div></div>';
  return elm;
})();
