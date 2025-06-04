import { LuaInterpreter } from '../lua/LuaInterpreter.js';

// Lua scripting interface
export class LuaInterface {
  constructor() {
    this.scripts = new Map();
    this.enabled = false;
    this.context = {
      game: null,
      engine: null,
      ui: null,
      config: null,
      storage: null,
      events: new Map()
    };
    this.interpreter = new LuaInterpreter();
  }

  async loadScript(name, code) {
    try {
      // Initialize the interpreter if needed
      if (!this.interpreter.initialized) {
        const initialized = await this.interpreter.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Lua interpreter');
        }
      }

      // Store the script
      this.scripts.set(name, code);
      return true;
    } catch (error) {
      console.error(`Failed to load Lua script ${name}:`, error);
      return false;
    }
  }

  setContext(context) {
    this.context = {
      ...this.context,
      ...context
    };
  }

  async executeScript(name, ...args) {
    if (!this.enabled || !this.scripts.has(name)) return null;
    
    try {
      const code = this.scripts.get(name);
      const result = await this.interpreter.execute(code, {
        ...this.context,
        args: args
      });
      return result;
    } catch (error) {
      console.error(`Error executing Lua script ${name}:`, error);
      return null;
    }
  }

  // UI Management
  addCustomTab(name, content) {
    if (!this.enabled || !this.context.ui) return false;
    
    try {
      this.context.ui.addTab(name, content);
      return true;
    } catch (error) {
      console.error(`Failed to add custom tab ${name}:`, error);
      return false;
    }
  }

  addCustomSetting(tab, setting) {
    if (!this.enabled || !this.context.ui) return false;
    
    try {
      this.context.ui.addSetting(tab, setting);
      return true;
    } catch (error) {
      console.error(`Failed to add custom setting:`, error);
      return false;
    }
  }

  // Engine Control
  modifyEngineBehavior(behavior) {
    if (!this.enabled || !this.context.engine) return false;
    
    try {
      this.context.engine.setCustomBehavior(behavior);
      return true;
    } catch (error) {
      console.error('Failed to modify engine behavior:', error);
      return false;
    }
  }

  setEngineOption(name, value) {
    if (!this.enabled || !this.context.engine) return false;
    
    try {
      this.context.engine.setOption(name, value);
      return true;
    } catch (error) {
      console.error(`Failed to set engine option ${name}:`, error);
      return false;
    }
  }

  // Game Control
  makeMove(move) {
    if (!this.enabled || !this.context.game) return false;
    
    try {
      this.context.game.move(move);
      return true;
    } catch (error) {
      console.error('Failed to make move:', error);
      return false;
    }
  }

  getPosition() {
    if (!this.enabled || !this.context.game) return null;
    return this.context.game.getFEN();
  }

  // Event System
  on(event, callback) {
    if (!this.enabled) return false;
    
    try {
      if (!this.context.events.has(event)) {
        this.context.events.set(event, new Set());
      }
      this.context.events.get(event).add(callback);
      return true;
    } catch (error) {
      console.error(`Failed to register event handler for ${event}:`, error);
      return false;
    }
  }

  off(event, callback) {
    if (!this.enabled || !this.context.events.has(event)) return false;
    
    try {
      this.context.events.get(event).delete(callback);
      return true;
    } catch (error) {
      console.error(`Failed to remove event handler for ${event}:`, error);
      return false;
    }
  }

  emit(event, ...args) {
    if (!this.enabled || !this.context.events.has(event)) return false;
    
    try {
      for (const callback of this.context.events.get(event)) {
        callback(...args);
      }
      return true;
    } catch (error) {
      console.error(`Failed to emit event ${event}:`, error);
      return false;
    }
  }

  // Storage
  saveData(key, value) {
    if (!this.enabled || !this.context.storage) return false;
    
    try {
      this.context.storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to save data for key ${key}:`, error);
      return false;
    }
  }

  loadData(key) {
    if (!this.enabled || !this.context.storage) return null;
    
    try {
      const data = this.context.storage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to load data for key ${key}:`, error);
      return null;
    }
  }

  // Analysis Tools
  addAnalysisTool(name, tool) {
    if (!this.enabled || !this.context.ui) return false;
    
    try {
      this.context.ui.addAnalysisTool(name, tool);
      return true;
    } catch (error) {
      console.error(`Failed to add analysis tool ${name}:`, error);
      return false;
    }
  }

  // Opening Book and Tablebase
  loadOpeningBook(url) {
    if (!this.enabled || !this.context.engine) return false;
    
    try {
      this.context.engine.loadOpeningBook(url);
      return true;
    } catch (error) {
      console.error('Failed to load opening book:', error);
      return false;
    }
  }

  loadTablebase(url) {
    if (!this.enabled || !this.context.engine) return false;
    
    try {
      this.context.engine.loadTablebase(url);
      return true;
    } catch (error) {
      console.error('Failed to load tablebase:', error);
      return false;
    }
  }

  // Utility Functions
  log(message) {
    console.log(`[Lua] ${message}`);
  }

  error(message) {
    console.error(`[Lua] ${message}`);
  }

  warn(message) {
    console.warn(`[Lua] ${message}`);
  }
} 