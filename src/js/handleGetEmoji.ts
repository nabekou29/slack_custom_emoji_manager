type WebResponseHeadersDetails = chrome.webRequest.WebResponseHeadersDetails;

const onGetEmojiImage = ({
  responseHeaders
}: WebResponseHeadersDetails): { responseHeaders?: HttpHeader[] } => {
  if (!responseHeaders) {
    return { responseHeaders };
  }
  responseHeaders.push({
    name: 'Access-Control-Allow-Origin',
    value: '*'
  });
  return { responseHeaders };
};

chrome.webRequest.onHeadersReceived.addListener(
  onGetEmojiImage,
  {
    urls: ['*://emoji.slack-edge.com/*']
  },
  ['blocking', 'responseHeaders', 'extraHeaders']
);
