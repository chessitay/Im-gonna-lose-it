// Lua interpreter module
export class LuaInterpreter {
    constructor() {
        this.initialized = false;
        this.luaPath = chrome.runtime.getURL('js/modules/lua/lua.exe');
        this.luaDllPath = chrome.runtime.getURL('js/modules/lua/lua54.dll');
    }

    async initialize() {
        if (this.initialized) return true;

        try {
            // Load the Lua DLL
            await this.loadLuaDll();
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Lua interpreter:', error);
            return false;
        }
    }

    async loadLuaDll() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.luaDllPath;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async execute(code, context) {
        if (!this.initialized) {
            const initialized = await this.initialize();
            if (!initialized) return null;
        }

        try {
            // Create a temporary file for the Lua code
            const blob = new Blob([code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            // Execute the Lua code using the Lua executable
            const result = await this.executeLuaScript(url, context);
            URL.revokeObjectURL(url);
            return result;
        } catch (error) {
            console.error('Failed to execute Lua code:', error);
            return null;
        }
    }

    async executeLuaScript(url, context) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(this.luaPath);
            
            worker.onmessage = (e) => {
                if (e.data.error) {
                    reject(new Error(e.data.error));
                } else {
                    resolve(e.data.result);
                }
                worker.terminate();
            };

            worker.onerror = (error) => {
                reject(error);
                worker.terminate();
            };

            worker.postMessage({
                code: url,
                context: context
            });
        });
    }
} 