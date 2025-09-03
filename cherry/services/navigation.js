// Houses the navigation logic for transitioning between the three different components
// (display, audioControl, cameraControl) in the main view.
// also controls the swipe gestures for changing views
document.addEventListener("UILoaded", () => {
    const componentView = document.querySelector('.component-container');
    const SWIPE_THRESHOLD = 200; // how far must swipe to change slide
    const SLOPE_THRESHOLD = 0.5; // ratio: vertical/horizontal movement; <0.5 means mostly horizontal

    let currentView = 0;
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let isScrolling = undefined;
    let currentTranslate = 0;
    let prevTranslate = 0;



    // Clicking tabs moves to the right view
    document.querySelectorAll('.tab').forEach((tab, index) => {
        if (tab.classList.contains('hidden')) return; // skip hidden tabs
        console.log("tabs");
        tab.addEventListener('click', () => {
            window.CommandService.buttonPress(`clicked ${tab.textContent} tab`, {});
            currentView = index;
            setViewPosition();
            updateActiveTab(index);
        });
    });

    function getVisibleSlides() {
        return Array.from(componentView.children).filter(
            slide => !slide.classList.contains("hidden")
        );
    }

    function updateActiveTab(index) {
        document.querySelectorAll('.tab').forEach((tab, i) => {
            if (tab.classList.contains('hidden')) return; // skip hidden tabs
            if (i === index) {
                tab.classList.add('active-tab');
            } else {
                tab.classList.remove('active-tab');
            }
        });
    }

    function setViewPosition(animate = true) {
        const visibleSlides = Array.from(componentView.children).filter(
            slide => !slide.classList.contains("hidden")
        );

        const targetSlide = visibleSlides[currentView];
        if (!targetSlide) return;

        const offset = targetSlide.offsetLeft;

        componentView.style.transition = animate ? "transform 0.3s ease" : "none";
        componentView.style.transform = `translateX(-${offset}px)`;
    }


    // Touch and drag events
    function touchStart(x, y) {
        isDragging = true;
        startX = x;
        startY = y;
        prevTranslate = -currentView * componentView.clientWidth;
        isScrolling = undefined;
    }

    function touchMove(x, y) {
        if (!isDragging) return;

        const dx = x - startX;
        const dy = y - startY;

        if (typeof isScrolling === 'undefined') {
            // determine if movement is more vertical or horizontal by ratio
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                return; // not enough movement to decide
            }
            const slope = Math.abs(dy) / Math.abs(dx);
            if (slope > SLOPE_THRESHOLD) {
                isScrolling = true; // mostly vertical, ignore horizontal swipe
                return;
            } else {
                isScrolling = false; // mostly horizontal                
            }
        }

        if (isScrolling) return;

        // else horizontal drag:
        currentTranslate = prevTranslate + dx;
        componentView.style.transition = 'none';
        componentView.style.transform = `translateX(${currentTranslate}px)`;
    }

    function touchEnd(x) {
        if (!isDragging) return;
        isDragging = false;
        if (isScrolling) return;

        const dx = x - startX;
        const visibleSlides = getVisibleSlides();
        const maxIndex = visibleSlides.length - 1;

        if (dx < -SWIPE_THRESHOLD && currentView < maxIndex) {
            currentView++;
        } else if (dx > SWIPE_THRESHOLD && currentView > 0) {
            currentView--;
        }
        setViewPosition();
        updateActiveTab(currentView);
    }
    // Mouse
    componentView.addEventListener('mousedown', e => touchStart(e.pageX, e.pageY));
    componentView.addEventListener('mousemove', e => touchMove(e.pageX, e.pageY));
    componentView.addEventListener('mouseup', e => touchEnd(e.pageX));
    componentView.addEventListener('mouseleave', e => {
        if (isDragging) touchEnd(e.pageX);
    });

    // Touch
    componentView.addEventListener('touchstart', e => touchStart(e.touches[0].clientX, e.touches[0].clientY));
    componentView.addEventListener('touchmove', e => touchMove(e.touches[0].clientX, e.touches[0].clientY));
    componentView.addEventListener('touchend', e => touchEnd(e.changedTouches[0].clientX));

    function resetViewPosition() {
        currentView = 0;
        setViewPosition();
        updateActiveTab(currentView);
    }

    // Export the function for use in other parts of the app
    window.resetViewPosition = resetViewPosition;
});
