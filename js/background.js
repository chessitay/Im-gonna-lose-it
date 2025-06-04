// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FROM_BETTERMINT') {
        // Forward the message to the tab
        chrome.tabs.sendMessage(sender.tab.id, {
            type: 'TO_BETTERMINT',
            data: message.data
        });
    }
});

// Listen for messages from the page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GetOptions') {
        chrome.storage.sync.get(null, (opts) => {
            chrome.tabs.sendMessage(sender.tab.id, {
                type: 'TO_BETTERMINT',
                data: {
                    type: 'OptionsResponse',
                    requestId: message.requestId,
                    data: opts
                }
            });
        });
    }
}); 