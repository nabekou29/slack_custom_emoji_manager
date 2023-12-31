// URLのパターン
const Pattern = {
  add: '*://*.slack.com/api/emoji.add*',
  remove: '*://*.slack.com/api/emoji.remove*',
};

// ヘッダーからcontent_lengthを取得する
const getContentLength = (headers: chrome.webRequest.HttpHeader[]) => {
  const contentLengthHeader = headers.find((header) => header.name === 'content-length');
  return Number(contentLengthHeader?.value);
};

// リクエスト完了処理のラッパー
const handleCompleteWrapper = (
  handleComplete: (tabId: number, details: chrome.webRequest.WebResponseCacheDetails) => any
) => {
  return (tabId: number) => (details: chrome.webRequest.WebResponseCacheDetails) => {
    if (
      details.tabId !== tabId ||
      // レスポンスボディを見れないので、content_lengthから成功を判断する
      // 成功時のcontent_lengthは15
      !details.responseHeaders ||
      getContentLength(details.responseHeaders) !== 15
    ) {
      return;
    }
    // 実行
    handleComplete(tabId, details);
  };
};

// 絵文字追加完了時処理
const handleCompleteEmojiAdd = handleCompleteWrapper((tabId, _) =>
  chrome.tabs.sendMessage(tabId, 'cem:add')
);

// 絵文字削除完了時処理
const handleCompleteEmojiRemove = handleCompleteWrapper((tabId, _) =>
  chrome.tabs.sendMessage(tabId, 'cem:remove')
);

(() => {
  // イベント登録済みのタブIDの一覧
  const tabIds: number[] = [];

  // 対象のタブからの初期化メッセージをトリガーにイベントを登録する
  chrome.runtime.onMessage.addListener((message, sender) => {
    const tabId = sender.tab?.id;
    if (message !== 'cem:init' || !tabId || tabIds.includes(tabId)) {
      return;
    }

    tabIds.push(tabId);

    // 絵文字追加
    chrome.webRequest.onCompleted.addListener(
      handleCompleteEmojiAdd(tabId),
      {
        urls: [Pattern.add],
      },
      ['responseHeaders']
    );
    // 絵文字削除
    chrome.webRequest.onCompleted.addListener(
      handleCompleteEmojiRemove(tabId),
      {
        urls: [Pattern.remove],
      },
      ['responseHeaders']
    );
  });
})();
