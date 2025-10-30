chrome.runtime.onInstalled.addListener(() => {
  console.info("Codex Voice Agent installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "codex:ping") {
    sendResponse({ ok: true });
    return true;
  }
  return false;
});
