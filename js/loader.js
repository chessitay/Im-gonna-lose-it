"use strict";

import { DefaultExtensionOptions } from './backend/SettingsManager.js';

// Get extension URL from config
const extensionUrl = window.BETTERMINT_CONFIG.extensionUrl;

// Function to inject a script into the page
function injectScript(file) {
    const script = document.createElement('script');
    script.setAttribute('type', 'module');
    script.setAttribute('src', extensionUrl + file);
    (document.head || document.documentElement).appendChild(script);
    script.onload = function() {
        script.remove();
    };
}

// Function to send messages to the extension
function sendToExtension(message) {
    window.postMessage({
        type: 'FROM_BETTERMINT',
        data: message
    }, '*');
}

// Function to receive messages from the extension
function receiveFromExtension(callback) {
    window.addEventListener('message', function(event) {
        if (event.source !== window) return;
        if (event.data.type && event.data.type === 'TO_BETTERMINT') {
            callback(event.data.data);
        }
    });
}

// Set up message handling
receiveFromExtension(function(message) {
    if (message.type === 'UpdateOptions') {
        window.dispatchEvent(
            new CustomEvent("BetterMintUpdateOptions", {
                detail: message.data,
            })
        );
    } else if (message.type === 'popout') {
        window.postMessage("popout");
    }
});

// Respond to BetterMintGetOptions events
window.addEventListener("BetterMintGetOptions", function (evt) {
    sendToExtension({
        type: 'GetOptions',
        requestId: evt.detail.id
    });
});

// Configuration for Stockfish paths
const configData = {
    threadedEnginePaths: {
        stockfish: {
            multiThreaded: {
                loader: extensionUrl + "stockfish/stockfish-nnue-16.js",
                engine: extensionUrl + "stockfish/stockfish-nnue-16.wasm",
            },
            singleThreaded: {
                loader: extensionUrl + "stockfish/stockfish-nnue-mv.js",
                engine: extensionUrl + "stockfish/stockfish-nnue-mv.wasm",
            },
        },
    },
    pathToEcoJson: extensionUrl + "data/eco.json",
};

// Inject configuration
const configScript = document.createElement("script");
configScript.textContent = `var Config = ${JSON.stringify(configData)};`;
document.documentElement.appendChild(configScript);

// Inject necessary scripts
injectScript("js/main.js");
injectScript("js/analysis-window.js"); // Analysis window functionality