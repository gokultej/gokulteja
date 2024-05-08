document.addEventListener("DOMContentLoaded", function() {
    const blackBox = document.querySelector('.black-box');
    const initialMarginTop = parseFloat(getComputedStyle(blackBox).marginTop);
    let lastScrollTop = 0;

    function updateBoxPosition() {
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        const scrollDirection = scrollY > lastScrollTop ? 'down' : 'up';
    
        // Adjust the margin-top based on scroll direction
        if (scrollDirection === 'down' || scrollDirection === 'up') {
            if (scrollDirection === 'down') {
                blackBox.style.marginTop = Math.max(0, parseFloat(blackBox.style.marginTop) + 5) + 'px';
            } else {
                blackBox.style.marginTop = Math.max(initialMarginTop, parseFloat(blackBox.style.marginTop) - 5) + 'px';
            }
            // Update the last scroll position only for vertical scrolling
            lastScrollTop = scrollY;
        }
    }
    

    window.addEventListener('scroll', function() {
        // Update the position of the black box
        updateBoxPosition();
    });

    // Initial position update
    updateBoxPosition();
});

function autoSlide() {
    plusDivs(1); // Increment slide index by 1
}
setInterval(autoSlide, 5000);
var dots = document.getElementsByClassName("dot");
var slideIndex = 1;
    showSlides(slideIndex);
  
    function plusDivs(n) {
        showSlides(slideIndex += n);
    }
    

    function currentDiv(n) {
        showSlides(slideIndex = n);
    }
    
    
    function showSlides(n) {
        var i;
        var slides = document.getElementsByClassName("slide");
        var dots = document.getElementsByClassName("demo");
        if (n > slides.length) { slideIndex = 1 }
        if (n < 1) { slideIndex = slides.length }
        for (i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        for (i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" w3-white", "");
        }
        slides[slideIndex - 1].style.display = "block"; // Display the entire set of images
        dots[slideIndex - 1].className += " w3-white"; 
         // Update active dot
    }
    