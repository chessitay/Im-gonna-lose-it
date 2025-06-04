export class ThemeManager {
    constructor() {
        this.themes = {
            default: {
                primary: '#5d3fd3',
                primaryDark: '#4a30a8',
                bg: '#292A2D',
                bgLight: '#3A3B3E',
                text: '#FFFFFF',
                textMuted: '#AAAAAA',
                border: '#444444'
            },
            dark: {
                primary: '#2c2c2c',
                primaryDark: '#1a1a1a',
                bg: '#121212',
                bgLight: '#1e1e1e',
                text: '#FFFFFF',
                textMuted: '#888888',
                border: '#333333'
            },
            light: {
                primary: '#ffffff',
                primaryDark: '#f0f0f0',
                bg: '#f5f5f5',
                bgLight: '#ffffff',
                text: '#333333',
                textMuted: '#666666',
                border: '#dddddd'
            },
            blue: {
                primary: '#2196F3',
                primaryDark: '#1976D2',
                bg: '#1A237E',
                bgLight: '#283593',
                text: '#FFFFFF',
                textMuted: '#B3E5FC',
                border: '#3949AB'
            },
            green: {
                primary: '#4CAF50',
                primaryDark: '#388E3C',
                bg: '#1B5E20',
                bgLight: '#2E7D32',
                text: '#FFFFFF',
                textMuted: '#C8E6C9',
                border: '#43A047'
            },
            purple: {
                primary: '#9C27B0',
                primaryDark: '#7B1FA2',
                bg: '#4A148C',
                bgLight: '#6A1B9A',
                text: '#FFFFFF',
                textMuted: '#E1BEE7',
                border: '#8E24AA'
            },
            orange: {
                primary: '#FF9800',
                primaryDark: '#F57C00',
                bg: '#E65100',
                bgLight: '#EF6C00',
                text: '#FFFFFF',
                textMuted: '#FFE0B2',
                border: '#FB8C00'
            },
            red: {
                primary: '#F44336',
                primaryDark: '#D32F2F',
                bg: '#B71C1C',
                bgLight: '#C62828',
                text: '#FFFFFF',
                textMuted: '#FFCDD2',
                border: '#E53935'
            },
            teal: {
                primary: '#009688',
                primaryDark: '#00796B',
                bg: '#004D40',
                bgLight: '#00695C',
                text: '#FFFFFF',
                textMuted: '#B2DFDB',
                border: '#00897B'
            },
            gray: {
                primary: '#607D8B',
                primaryDark: '#455A64',
                bg: '#263238',
                bgLight: '#37474F',
                text: '#FFFFFF',
                textMuted: '#CFD8DC',
                border: '#546E7A'
            }
        };
        this.storage = chrome?.storage?.sync || {
            get: (keys, callback) => callback && callback({}),
            set: (items, callback) => callback && callback(),
            clear: (callback) => callback && callback()
        };
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        document.documentElement.style.setProperty('--primary', theme.primary);
        document.documentElement.style.setProperty('--primary-dark', theme.primaryDark);
        document.documentElement.style.setProperty('--bg', theme.bg);
        document.documentElement.style.setProperty('--bg-light', theme.bgLight);
        document.documentElement.style.setProperty('--text', theme.text);
        document.documentElement.style.setProperty('--text-muted', theme.textMuted);
        document.documentElement.style.setProperty('--border', theme.border);

        // Save theme preference
        this.storage.set({ 'selected-theme': themeName });
    }

    createCustomTheme(colors) {
        const customTheme = {
            primary: colors.primary,
            primaryDark: this.adjustColor(colors.primary, -20),
            bg: colors.bg,
            bgLight: this.adjustColor(colors.bg, 20),
            text: colors.text,
            textMuted: this.adjustColor(colors.text, -40),
            border: this.adjustColor(colors.bg, -10)
        };
        
        this.themes.custom = customTheme;
        return customTheme;
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    exportTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return null;
        
        return JSON.stringify({
            name: themeName,
            colors: theme
        }, null, 2);
    }

    importTheme(jsonString) {
        try {
            const theme = JSON.parse(jsonString);
            this.themes[theme.name] = theme.colors;
            return theme;
        } catch (error) {
            throw new Error('Invalid theme file');
        }
    }

    getThemeNames() {
        return Object.keys(this.themes);
    }

    getTheme(themeName) {
        return this.themes[themeName];
    }
} 