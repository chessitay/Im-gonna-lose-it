// Get the extension URL
const extensionUrl = chrome.runtime.getURL('');

// Create and inject the URL reader script first
const urlReaderScript = document.createElement('script');
urlReaderScript.src = chrome.runtime.getURL('js/url-reader.js');
// Pass the extension URL to the page context
urlReaderScript.setAttribute('data-extension-url', extensionUrl);
urlReaderScript.onload = () => {
    // After URL reader is loaded, inject the loader script
    const loaderScript = document.createElement('script');
    loaderScript.src = chrome.runtime.getURL('js/loader.js');
    loaderScript.type = 'module';
    document.documentElement.appendChild(loaderScript);
    loaderScript.onload = () => {
        // Remove the scripts after they're loaded
        urlReaderScript.remove();
        loaderScript.remove();
    };
};
document.documentElement.appendChild(urlReaderScript);

// Listen for messages from the page
window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'BETTERMINT_READY') {
        // Handle ready message
        console.log('BetterMint is ready');
    }
}); 