chrome.webRequest.onBeforeSendHeaders.addListener(
  details => {
    const requestHeaders = details.requestHeaders?.filter(h => h.name !== 'User-Agent');
    return { requestHeaders };
  },
  { urls: ['<all_urls>'] },
  ['blocking', 'requestHeaders']
);
