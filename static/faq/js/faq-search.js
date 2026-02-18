class WayistFAQSearch {
    constructor() {
        this.index = [];
        this.searchInput = null;
        this.searchResults = null;
        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    async setup() {
        this.searchInput = document.getElementById('faq-search');
        this.searchResults = document.getElementById('search-results');
        
        if (!this.searchInput) return;
        
        await this.loadIndex();
        this.setupEventListeners();
    }

    async loadIndex() {
        try {
            const response = await fetch('/faq/index.json');
            this.index = await response.json();
        } catch (error) {
            console.error('Failed to load search index:', error);
        }
    }

    setupEventListeners() {
        let searchTimeout;
        
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                this.clearResults();
                return;
            }
            
            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });

        // Clear results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.clearResults();
            }
        });
    }

    performSearch(query) {
        const results = this.search(query);
        this.displayResults(results);
    }

    search(query) {
        const terms = query.toLowerCase().split(' ').filter(term => term.length > 1);
        
        return this.index.filter(faq => {
            const searchText = `${faq.title} ${faq.description} ${faq.content} ${faq.keywords ? faq.keywords.join(' ') : ''} ${faq.foundation_problem || ''} ${faq.quick_answer || ''}`.toLowerCase();
            
            return terms.some(term => searchText.includes(term));
        }).slice(0, 8);
    }

    displayResults(results) {
        if (!this.searchResults) return;
        
        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="no-results">No FAQs found matching your question. Try different keywords.</div>';
            this.searchResults.style.display = 'block';
            return;
        }

        const resultsHTML = results.map(faq => `
            <div class="search-result">
                <h3><a href="${faq.url}">${faq.title}</a></h3>
                ${faq.foundation_problem ? `<p class="foundation-snippet"><strong>Foundation Issue:</strong> ${faq.foundation_problem.substring(0, 120)}...</p>` : ''}
                ${faq.quick_answer ? `<p class="quick-snippet">${faq.quick_answer.substring(0, 150)}...</p>` : ''}
                <div class="result-meta">
                    ${faq.category ? `<span class="category-tag">${faq.category}</span>` : ''}
                    ${faq.street_level ? '<span class="street-level-tag">Aplicación Real</span>' : ''}
                </div>
            </div>
        `).join('');

        this.searchResults.innerHTML = resultsHTML;
        this.searchResults.style.display = 'block';
    }

    clearResults() {
        if (this.searchResults) {
            this.searchResults.innerHTML = '';
            this.searchResults.style.display = 'none';
        }
    }
}

// Initialize search when script loads
new WayistFAQSearch();