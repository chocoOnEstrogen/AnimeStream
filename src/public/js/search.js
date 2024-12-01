class AnimeSearch {
	constructor() {
		this.grid = document.getElementById('animeGrid')
		this.cards = document.querySelectorAll('.anime-card')
		this.sortSelect = document.getElementById('sort')
		this.typeCheckboxes = document.querySelectorAll(
			'input[type="checkbox"][id^="type"]',
		)
		this.genreCheckboxes = document.querySelectorAll(
			'input[type="checkbox"][id^="genre"]',
		)
		this.clearButton = document.getElementById('clearFilters')
		this.viewButtons = document.querySelectorAll('[data-view]')

		this.initializeEventListeners()
		this.loadFiltersFromURL()
	}

	initializeEventListeners() {
		// Sort change
		this.sortSelect.addEventListener('change', () => this.applyFilters())

		// Type filter change
		this.typeCheckboxes.forEach((checkbox) => {
			checkbox.addEventListener('change', () => this.applyFilters())
		})

		// Genre filter change
		this.genreCheckboxes.forEach((checkbox) => {
			checkbox.addEventListener('change', () => this.applyFilters())
		})

		// Clear filters
		this.clearButton.addEventListener('click', () => this.clearFilters())

		// View toggle
		this.viewButtons.forEach((button) => {
			button.addEventListener('click', () =>
				this.toggleView(button.dataset.view),
			)
		})
	}

	applyFilters() {
		// Get selected filters
		const selectedTypes = Array.from(this.typeCheckboxes)
			.filter((cb) => cb.checked)
			.map((cb) => cb.value)

		const selectedGenres = Array.from(this.genreCheckboxes)
			.filter((cb) => cb.checked)
			.map((cb) => cb.value)

		// Filter cards
		this.cards.forEach((card) => {
			const type = card.dataset.type
			const genres = card.dataset.genres.split(',')

			const typeMatch =
				selectedTypes.length === 0 || selectedTypes.includes(type)
			const genreMatch =
				selectedGenres.length === 0 ||
				selectedGenres.every((genre) => genres.includes(genre))

			card.style.display = typeMatch && genreMatch ? '' : 'none'
		})

		// Apply sorting
		this.sortCards()

		// Update URL
		this.updateURL()
	}

	sortCards() {
		const cards = Array.from(this.cards)
		const [sortBy, sortOrder] = this.sortSelect.value.split('-')

		cards.sort((a, b) => {
			const titleA = a.querySelector('.card-title').textContent.trim()
			const titleB = b.querySelector('.card-title').textContent.trim()

			if (sortOrder === 'asc') {
				return titleA.localeCompare(titleB)
			} else {
				return titleB.localeCompare(titleA)
			}
		})

		// Reorder DOM
		cards.forEach((card) => this.grid.appendChild(card))
	}

	clearFilters() {
		this.sortSelect.value = 'title-asc'
		this.typeCheckboxes.forEach((cb) => (cb.checked = false))
		this.genreCheckboxes.forEach((cb) => (cb.checked = false))
		this.applyFilters()
	}

	toggleView(view) {
		this.viewButtons.forEach((btn) => {
			btn.classList.toggle('active', btn.dataset.view === view)
		})

		if (view === 'list') {
			this.grid.classList.remove('row-cols-md-2', 'row-cols-xl-3')
			this.grid.classList.add('row-cols-1')
			this.cards.forEach((card) => {
				card.querySelector('.card').classList.add('flex-row')
				card.querySelector('.card-img-top').style.width = '150px'
			})
		} else {
			this.grid.classList.add('row-cols-md-2', 'row-cols-xl-3')
			this.grid.classList.remove('row-cols-1')
			this.cards.forEach((card) => {
				card.querySelector('.card').classList.remove('flex-row')
				card.querySelector('.card-img-top').style.width = ''
			})
		}
	}

	loadFiltersFromURL() {
		const params = new URLSearchParams(window.location.search)

		// Load sort
		if (params.has('sort')) {
			this.sortSelect.value = params.get('sort')
		}

		// Load type filters
		const types = params.get('types')?.split(',') || []
		this.typeCheckboxes.forEach((cb) => {
			cb.checked = types.includes(cb.value)
		})

		// Load genre filters
		const genres = params.get('genres')?.split(',') || []
		this.genreCheckboxes.forEach((cb) => {
			cb.checked = genres.includes(cb.value)
		})

		// Apply filters
		this.applyFilters()
	}

	updateURL() {
		const params = new URLSearchParams()

		// Add sort
		params.set('sort', this.sortSelect.value)

		// Add type filters
		const selectedTypes = Array.from(this.typeCheckboxes)
			.filter((cb) => cb.checked)
			.map((cb) => cb.value)
		if (selectedTypes.length) {
			params.set('types', selectedTypes.join(','))
		}

		// Add genre filters
		const selectedGenres = Array.from(this.genreCheckboxes)
			.filter((cb) => cb.checked)
			.map((cb) => cb.value)
		if (selectedGenres.length) {
			params.set('genres', selectedGenres.join(','))
		}

		// Update URL without reloading
		window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
	}
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	new AnimeSearch()
})
