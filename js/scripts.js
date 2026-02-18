
// Animation au scroll
document.addEventListener('DOMContentLoaded', function () {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const revealPoint = 100;

        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;

            if (elementTop < windowHeight - revealPoint) {
                element.classList.add('active');
            }
        });
    };

    // Observer moderne (meilleure performance)
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Optionnel : arrêter d'observer après animation
                    // observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        revealElements.forEach(element => observer.observe(element));
    } else {
        // Fallback pour navigateurs anciens
        window.addEventListener('scroll', revealOnScroll);
        revealOnScroll(); // Initial check
    }
});

document.getElementById('year').textContent = new Date().getFullYear();


function copyToClipboard(text, event) {
    event.preventDefault(); // Empêche le comportement par défaut du lien
    navigator.clipboard.writeText(text)
        .then(() => {
            // Optionnel : afficher une confirmation visuelle
            const originalText = event.target.innerHTML;
            event.target.innerHTML = "✓ Copié !";
            setTimeout(() => {
                event.target.innerHTML = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error("Échec de la copie : ", err);
        });
}

