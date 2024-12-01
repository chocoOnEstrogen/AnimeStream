document.addEventListener('DOMContentLoaded', () => {
    // Wait for all images to load
    Promise.all(
        Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
                img.onload = img.onerror = resolve;
            }))
    )
    .then(() => {
        // Add small delay for smoother transition
        setTimeout(() => {
            const preloader = document.querySelector('.preloader');
            preloader.classList.add('fade-out');
            
            // Remove preloader from DOM after animation
            preloader.addEventListener('transitionend', () => {
                preloader.remove();
            });
        }, 500);
    });
}); 