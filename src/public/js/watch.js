class VideoPlayer {
	constructor() {
		this.player = videojs('videoPlayer', {
			fluid: true,
			autoplay: true,
			playbackRates: [0.5, 1, 1.25, 1.5, 2],
			controlBar: {
				children: [
					'playToggle',
					'volumePanel',
					'currentTimeDisplay',
					'timeDivider',
					'durationDisplay',
					'progressControl',
					'playbackRateMenuButton',
					'fullscreenToggle',
				],
			},
		})

		this.favoriteBtn = document.getElementById('favoriteBtn')
		this.animeId = window.location.pathname.split('/')[2]
		this.season = window.location.pathname.split('/')[3]
		this.episode = window.location.pathname.split('/')[4]
		this.lastUpdate = 0
		this.nextUpdateDelay = this.getRandomDelay()

		this.initializePlayer()
	}

	initializePlayer() {
		// Update progress periodically with throttling
		this.player.on('timeupdate', () => {
			const now = Date.now()
			if (
				this.player.currentTime() > 0 &&
				now - this.lastUpdate >= this.nextUpdateDelay
			) {
				this.updateProgress(
					(this.player.currentTime() / this.player.duration()) * 100,
				)
				this.lastUpdate = now
				this.nextUpdateDelay = this.getRandomDelay()
			}
		})

		// Handle keyboard shortcuts
		document.addEventListener('keydown', (e) => {
			if (document.activeElement.tagName === 'INPUT') return

			switch (e.key.toLowerCase()) {
				case 'f':
					this.player.isFullscreen() ?
						this.player.exitFullscreen()
					:	this.player.requestFullscreen()
					break
				case ' ':
					this.player.paused() ? this.player.play() : this.player.pause()
					e.preventDefault()
					break
				case 'arrowleft':
					this.player.currentTime(this.player.currentTime() - 5)
					break
				case 'arrowright':
					this.player.currentTime(this.player.currentTime() + 5)
					break
			}
		})

		// Handle favorite button
		if (this.favoriteBtn) {
			this.favoriteBtn.addEventListener('click', () => this.toggleFavorite())
		}
	}

	// Get random delay between 1-20 seconds in milliseconds
	getRandomDelay() {
		return (Math.floor(Math.random() * 20) + 1) * 1000
	}

	async updateProgress(progress) {
		try {
			const response = await fetch(
				`/watch/${this.animeId}/${this.season}/${this.episode}/progress`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ progress }),
				},
			)

			if (!response.ok) {
				throw new Error('Failed to update progress')
			}
		} catch (error) {
			console.error('Progress update failed:', error)
		}
	}

	async toggleFavorite() {
		try {
			const response = await fetch(`/watch/${this.animeId}/favorite`, {
				method: 'POST',
			})

			if (!response.ok) {
				throw new Error('Failed to toggle favorite')
			}

			const { isFavorite } = await response.json()

			// Update button state
			this.favoriteBtn.classList.toggle('active', isFavorite)
			this.favoriteBtn.querySelector('i').className =
				isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart'
		} catch (error) {
			console.error('Favorite toggle failed:', error)
		}
	}
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	new VideoPlayer()
})
