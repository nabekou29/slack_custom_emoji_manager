const onGetEmojiImage = ({
  responseHeaders,
}: chrome.webRequest.WebResponseHeadersDetails): {
  responseHeaders?: chrome.webRequest.HttpHeader[];
} => {
  if (!responseHeaders) {
    return { responseHeaders };
  }
  responseHeaders.push({
    name: 'Access-Control-Allow-Origin',
    value: '*',
  });
  return { responseHeaders };
};

chrome.webRequest.onHeadersReceived.addListener(
  onGetEmojiImage,
  {
    urls: ['*://emoji.slack-edge.com/*'],
  },
  ['blocking', 'responseHeaders', 'extraHeaders']
);
