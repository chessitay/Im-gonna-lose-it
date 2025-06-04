// Get the extension URL from the data attribute
const extensionUrl = document.currentScript.getAttribute('data-extension-url');

// Set up the BetterMint configuration
window.BETTERMINT_CONFIG = {
    extensionUrl: extensionUrl
}; 