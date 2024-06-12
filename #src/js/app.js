@@include('../components/stories-card/stories-card.js')
@@include('../components/stories-carousel/stories-carousel.js')

function isSafari() {
    let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    return isSafari;
}
function Android() {
    return navigator.userAgent.match(/Android/i);
}
function BlackBerry() {
    return navigator.userAgent.match(/BlackBerry/i);
}
function iOS() {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
}
function Opera() {
    return navigator.userAgent.match(/Opera Mini/i);
}
function Windows() {
    return navigator.userAgent.match(/IEMobile/i);
}

function isMobile() {
    return (Android() || BlackBerry() || iOS() || Opera() || Windows());
}

function slideUp(target, duration = 500) {
    target.style.transitionProperty = 'height, margin, padding';
    target.style.transitionDuration = duration + 'ms';
    target.style.height = target.offsetHeight + 'px';
    target.offsetHeight;
    target.style.overflow = 'hidden';
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    window.setTimeout(() => {
        target.style.display = 'none';
        target.style.removeProperty('height');
        target.style.removeProperty('padding-top');
        target.style.removeProperty('padding-bottom');
        target.style.removeProperty('margin-top');
        target.style.removeProperty('margin-bottom');
        target.style.removeProperty('overflow');
        target.style.removeProperty('transition-duration');
        target.style.removeProperty('transition-property');
        target?.classList.remove('_slide');
    }, duration);
}
function slideDown(target, duration = 500) {
    target.style.removeProperty('display');
    let display = window.getComputedStyle(target).display;
    if (display === 'none')
        display = 'block';

    target.style.display = display;
    let height = target.offsetHeight;
    target.style.overflow = 'hidden';
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    target.offsetHeight;
    target.style.transitionProperty = "height, margin, padding";
    target.style.transitionDuration = duration + 'ms';
    target.style.height = height + 'px';
    target.style.removeProperty('padding-top');
    target.style.removeProperty('padding-bottom');
    target.style.removeProperty('margin-top');
    target.style.removeProperty('margin-bottom');
    window.setTimeout(() => {
        target.style.removeProperty('height');
        target.style.removeProperty('overflow');
        target.style.removeProperty('transition-duration');
        target.style.removeProperty('transition-property');
        target?.classList.remove('_slide');
    }, duration);
}
function slideToggle(target, duration = 500) {
    if (!target?.classList.contains('_slide')) {
        target?.classList.add('_slide');
        if (window.getComputedStyle(target).display === 'none') {
            return this.slideDown(target, duration);
        } else {
            return this.slideUp(target, duration);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (isMobile()) {
        document.body.classList.add('mobile-device');
    }

    @@include('../components/stories-nav/stories-nav.js')
});	