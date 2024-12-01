document.addEventListener('DOMContentLoaded', () => {
	const preloader = document.querySelector('.preloader')

	// Function to hide preloader
	const hidePreloader = () => {
		preloader.classList.add('fade-out')
		preloader.addEventListener(
			'transitionend',
			() => {
				preloader.remove()
			},
			{ once: true },
		) // Ensure event listener is only called once
	}

	// Function to check if page is fully loaded
	const checkPageLoad = () => {
		if (document.readyState === 'complete') {
			// Add small delay for smoother transition
			setTimeout(hidePreloader, 500)
		}
	}

	// Handle different loading scenarios
	if (document.readyState === 'complete') {
		// If page is already loaded
		setTimeout(hidePreloader, 500)
	} else {
		// Listen for page load
		window.addEventListener('load', checkPageLoad)

		// Fallback: Hide preloader after 5 seconds maximum
		setTimeout(hidePreloader, 5000)
	}
})
