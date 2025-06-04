class ThreatsAndRefutations {
    constructor() {
        this.threatHighlights = new Map();
        this.refutationArrows = new Map();
        this.settings = {
            showThreats: true,
            showRefutations: true,
            threatColor: '#ff0000',
            refutationColor: '#ff0000'
        };
    }

    init(settings) {
        this.settings = {
            ...this.settings,
            ...settings
        };
    }

    updateSettings(settings) {
        this.settings = {
            ...this.settings,
            ...settings
        };
        this.clearAll();
    }

    clearAll() {
        this.threatHighlights.forEach(highlight => highlight.remove());
        this.refutationArrows.forEach(arrow => arrow.remove());
        this.threatHighlights.clear();
        this.refutationArrows.clear();
    }

    showThreats(analysis) {
        if (!this.settings.showThreats) return;
        
        this.clearThreats();
        
        // Get the best move from analysis
        const bestMove = analysis.bestMove;
        if (!bestMove) return;

        // Create threat highlight
        const highlight = document.createElement('div');
        highlight.className = 'threat-highlight';
        highlight.style.position = 'absolute';
        highlight.style.backgroundColor = this.settings.threatColor;
        highlight.style.opacity = '0.3';
        highlight.style.pointerEvents = 'none';
        highlight.style.zIndex = '1000';
        
        // Position the highlight on the target square
        const square = document.querySelector(`[data-square="${bestMove.to}"]`);
        if (square) {
            const rect = square.getBoundingClientRect();
            highlight.style.width = rect.width + 'px';
            highlight.style.height = rect.height + 'px';
            highlight.style.left = rect.left + 'px';
            highlight.style.top = rect.top + 'px';
            document.body.appendChild(highlight);
            this.threatHighlights.set(bestMove.to, highlight);
        }
    }

    showRefutations(analysis) {
        if (!this.settings.showRefutations) return;
        
        this.clearRefutations();
        
        // Get the refutation moves from analysis
        const refutations = analysis.refutations || [];
        if (refutations.length === 0) return;

        refutations.forEach(refutation => {
            const arrow = document.createElement('div');
            arrow.className = 'refutation-arrow';
            arrow.style.position = 'absolute';
            arrow.style.borderColor = this.settings.refutationColor;
            arrow.style.borderWidth = '2px';
            arrow.style.borderStyle = 'solid';
            arrow.style.pointerEvents = 'none';
            arrow.style.zIndex = '1000';
            
            // Get the squares for the arrow
            const fromSquare = document.querySelector(`[data-square="${refutation.from}"]`);
            const toSquare = document.querySelector(`[data-square="${refutation.to}"]`);
            
            if (fromSquare && toSquare) {
                const fromRect = fromSquare.getBoundingClientRect();
                const toRect = toSquare.getBoundingClientRect();
                
                // Calculate arrow position and rotation
                const fromCenter = {
                    x: fromRect.left + fromRect.width / 2,
                    y: fromRect.top + fromRect.height / 2
                };
                const toCenter = {
                    x: toRect.left + toRect.width / 2,
                    y: toRect.top + toRect.height / 2
                };
                
                const angle = Math.atan2(toCenter.y - fromCenter.y, toCenter.x - fromCenter.x);
                const length = Math.sqrt(
                    Math.pow(toCenter.x - fromCenter.x, 2) + 
                    Math.pow(toCenter.y - fromCenter.y, 2)
                );
                
                arrow.style.width = length + 'px';
                arrow.style.left = fromCenter.x + 'px';
                arrow.style.top = fromCenter.y + 'px';
                arrow.style.transform = `rotate(${angle}rad)`;
                arrow.style.transformOrigin = '0 0';
                
                document.body.appendChild(arrow);
                this.refutationArrows.set(`${refutation.from}-${refutation.to}`, arrow);
            }
        });
    }

    clearThreats() {
        this.threatHighlights.forEach(highlight => highlight.remove());
        this.threatHighlights.clear();
    }

    clearRefutations() {
        this.refutationArrows.forEach(arrow => arrow.remove());
        this.refutationArrows.clear();
    }

    onAnalysisUpdate(analysis) {
        this.showThreats(analysis);
        this.showRefutations(analysis);
    }
}

export default ThreatsAndRefutations; 