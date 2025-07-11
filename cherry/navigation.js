document.addEventListener('DOMContentLoaded', () => {
    const componentView = document.querySelector('.component-container');
    const SWIPE_THRESHOLD = 150; // increase to make harder to swipe
    const VERTICAL_THRESHOLD = 5; // threshold to detect vertical scroll vs horizontal swipe

    let currentView = 0;
    let startX = 0;
    let startY = 0;
    let isScrolling = undefined;

    let isDragging = false;
    let currentTranslate = 0;
    let prevTranslate = 0;
    const slideCount = componentView.children.length;

    function setViewPosition(animate = true) {
        if (animate) {
            componentView.style.transition = 'transform 0.3s ease';
        } else {
            componentView.style.transition = 'none';
        }
        componentView.style.transform = `translateX(-${currentView * 100}%)`;
    }

    function touchStart(x, y) {
        isDragging = true;
        startX = x;
        startY = y;
        prevTranslate = -currentView * componentView.clientWidth;
        isScrolling = undefined;  // reset
    }

    function touchMove(x, y) {
        if (!isDragging) return;

        const dx = x - startX;
        const dy = y - startY;

        if (typeof isScrolling === 'undefined') {
            if (Math.abs(dy) > VERTICAL_THRESHOLD) {
                isScrolling = true;  // vertical movement detected, cancel horizontal swipe
                return;
            } else if (Math.abs(dx) > 10) {  // small horizontal threshold to confirm horizontal drag
                isScrolling = false; // horizontal movement confirmed
            } else {
                // movement too small to decide, just ignore
                return;
            }
        }

        if (isScrolling) {
            // vertical scroll - do nothing to the horizontal slider
            return;
        }

        // else horizontal drag:
        currentTranslate = prevTranslate + dx;
        componentView.style.transition = 'none';
        componentView.style.transform = `translateX(${currentTranslate}px)`;
    }


    function touchEnd(x) {
        if (!isDragging) return;
        isDragging = false;
        const dx = x - startX;

        if (dx < -(SWIPE_THRESHOLD) && currentView < slideCount - 1) {
            currentView++;
        } else if (dx > SWIPE_THRESHOLD && currentView > 0) {
            currentView--;
        }
        setViewPosition();
    }

    // Mouse
    componentView.addEventListener('mousedown', e => touchStart(e.pageX));
    componentView.addEventListener('mousemove', e => touchMove(e.pageX));
    componentView.addEventListener('mouseup', e => touchEnd(e.pageX));
    componentView.addEventListener('mouseleave', e => {
        if (isDragging) touchEnd(e.pageX);
    });

    // Touch
    componentView.addEventListener('touchstart', e => touchStart(e.touches[0].clientX, e.touches[0].clientY));
    componentView.addEventListener('touchmove', e => touchMove(e.touches[0].clientX, e.touches[0].clientY));
    componentView.addEventListener('touchend', e => touchEnd(e.changedTouches[0].clientX));
});
