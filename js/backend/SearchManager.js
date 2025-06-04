export class SearchManager {
    constructor() {
        this.searchOverlay = null;
        this.searchBar = null;
        this.searchResults = null;
        this.searchClose = null;
        this.searchShortcut = null;
    }

    init() {
        // Get DOM elements
        this.searchOverlay = document.getElementById('search-overlay');
        this.searchBar = document.getElementById('settings-search');
        this.searchResults = document.getElementById('search-results');
        this.searchClose = document.getElementById('search-close');
        this.searchShortcut = document.getElementById('search-shortcut');
        
        if (!this.searchOverlay || !this.searchBar || !this.searchResults || !this.searchShortcut) {
            console.warn('Search elements not found in DOM');
            return;
        }
        
        // Search bar input handler
        this.searchBar.addEventListener('input', () => this.searchSettings(this.searchBar.value));

        // Close button handler
        if (this.searchClose) {
            this.searchClose.addEventListener('click', () => this.closeSearch());
        }

        // Search shortcut handler
        this.searchShortcut.addEventListener('click', () => this.openSearch());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.openSearch();
            } else if (e.key === 'Escape' && this.searchOverlay.classList.contains('active')) {
                this.closeSearch();
            }
        });

        // Close on outside click
        this.searchOverlay.addEventListener('click', (e) => {
            if (e.target === this.searchOverlay) {
                this.closeSearch();
            }
        });
    }

    openSearch() {
        this.searchOverlay.classList.add('active');
        setTimeout(() => {
            this.searchBar.focus();
        }, 100);
    }

    closeSearch() {
        this.searchOverlay.classList.remove('active');
        this.searchBar.value = '';
        this.searchResults.innerHTML = '';
    }

    searchSettings(term) {
        if (!term) {
            this.searchResults.innerHTML = '';
            return;
        }

        const searchTerms = term.toLowerCase().split(' ').filter(t => t.length > 0);
        const results = [];

        // Search through all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            const tabId = tab.id.replace('-tab', '');
            const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
            const tabName = tabButton?.textContent || 'Settings';

            // Search through form groups
            tab.querySelectorAll('.form-group, .checkbox-group').forEach(group => {
                const label = group.querySelector('label');
                const input = group.querySelector('input, select');
                if (!label || !input) return;

                const labelText = label.textContent.toLowerCase();
                const inputId = input.id.toLowerCase();
                const sectionTitle = this.findSectionTitle(group) || 'Settings';

                // Check if any search term matches
                const matches = searchTerms.some(term => 
                    labelText.includes(term) || 
                    inputId.includes(term) || 
                    sectionTitle.toLowerCase().includes(term)
                );

                if (matches) {
                    results.push({
                        label: label.textContent,
                        id: input.id,
                        tab: tabId,
                        tabName: tabName,
                        section: sectionTitle
                    });
                }
            });
        });

        this.displayResults(results);
    }

    findSectionTitle(element) {
        let current = element;
        while (current && !current.classList.contains('section-title')) {
            current = current.previousElementSibling;
        }
        return current ? current.textContent : null;
    }

    displayResults(results) {
        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="search-result">No settings found</div>';
            return;
        }

        const html = results.map(result => `
            <div class="search-result" data-id="${result.id}" data-tab="${result.tab}">
                <div class="search-result-label">${result.label}</div>
                <div class="search-result-category">${result.section} → ${result.tabName}</div>
            </div>
        `).join('');

        this.searchResults.innerHTML = html;

        // Add click handlers
        this.searchResults.querySelectorAll('.search-result').forEach(result => {
            result.addEventListener('click', () => {
                const tabId = result.dataset.tab;
                const settingId = result.dataset.id;

                // Switch to correct tab
                const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
                if (tabButton) {
                    // Remove active class from all tabs and contents
                    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    
                    // Add active class to selected tab and content
                    tabButton.classList.add('active');
                    const tabContent = document.getElementById(`${tabId}-tab`);
                    if (tabContent) {
                        tabContent.classList.add('active');
                    }

                    // Find and scroll to setting
                    const setting = document.getElementById(settingId);
                    if (setting) {
                        // Wait for tab switch animation
                        setTimeout(() => {
                            setting.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            setting.focus();
                        }, 100);
                    }
                }

                this.closeSearch();
            });
        });
    }

    highlightText(text) {
        const searchTerms = this.searchBar.value.toLowerCase().split(' ').filter(t => t.length > 0);
        let highlighted = text;
        
        searchTerms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlighted = highlighted.replace(regex, '<mark>$1</mark>');
        });
        
        return highlighted;
    }
} 