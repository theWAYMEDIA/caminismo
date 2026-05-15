class CaminismoSearch {
    constructor() {
        this.index = [];
        this.input = null;
        this.results = null;
        this.init();
    }

    async init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    async setup() {
        this.input = document.getElementById('site-search');
        this.results = document.getElementById('site-search-results');
        if (!this.input) return;
        await this.loadIndex();
        this.bindEvents();
    }

    async loadIndex() {
        try {
            const res = await fetch('/index.json');
            this.index = await res.json();
        } catch (e) {
            console.error('Error al cargar el índice de búsqueda:', e);
        }
    }

    bindEvents() {
        let timer;

        this.input.addEventListener('input', e => {
            clearTimeout(timer);
            const q = e.target.value.trim();
            if (q.length < 2) { this.hide(); return; }
            timer = setTimeout(() => this.render(this.search(q)), 300);
        });

        this.input.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                this.hide();
                this.input.value = '';
                this.input.blur();
            }
        });

        document.addEventListener('click', e => {
            if (!e.target.closest('.site-search-wrap')) this.hide();
        });
    }

    search(query) {
        const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
        const SECTION_ORDER = ['filosofia', 'practica', 'faq', 'blog', 'libros', 'descripcion-general'];

        return this.index
            .map(page => {
                const title = (page.title || '').toLowerCase();
                const body = [
                    page.description || '',
                    page.content || '',
                    (page.tags || []).join(' ')
                ].join(' ').toLowerCase();

                let score = 0;
                for (const term of terms) {
                    if (title.includes(term)) score += 4;
                    if ((page.description || '').toLowerCase().includes(term)) score += 2;
                    if (body.includes(term)) score += 1;
                }
                return { page, score };
            })
            .filter(r => r.score > 0)
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                const ai = SECTION_ORDER.indexOf(a.page.section);
                const bi = SECTION_ORDER.indexOf(b.page.section);
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            })
            .slice(0, 8)
            .map(r => r.page);
    }

    render(results) {
        if (!this.results) return;

        const LABELS = {
            'filosofia': 'Filosofía',
            'practica': 'Práctica',
            'blog': 'Blog',
            'faq': 'FAQ',
            'descripcion-general': 'Descripción General',
            'libros': 'Libros',
            'glosario': 'Glosario',
            'comienza-aqui': 'Comienza Aquí',
            'para-ia': 'Para IA'
        };

        if (results.length === 0) {
            this.results.innerHTML = '<p class="srs-none">No se encontraron resultados.</p>';
        } else {
            this.results.innerHTML = results.map(p => {
                const label = LABELS[p.section] || p.section || '';
                const snippet = (p.description || p.content || '').substring(0, 120);
                return `<a class="sr-item" href="${p.url}">
                    <span class="sr-title">${p.title}</span>
                    ${label ? `<span class="sr-tag">${label}</span>` : ''}
                    ${snippet ? `<span class="sr-snippet">${snippet}…</span>` : ''}
                </a>`;
            }).join('');
        }

        this.results.style.display = 'block';
    }

    hide() {
        if (this.results) this.results.style.display = 'none';
    }
}

new CaminismoSearch();
