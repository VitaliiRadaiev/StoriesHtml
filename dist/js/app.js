

class ImageStory {
    constructor({ htmlContainer, url, duration }) {
        this.htmlContainer = htmlContainer;
        this.url = url;
        this.progressFns = []
        this.endsFns = []
        this.readyFns = []
        this.canPlay = false;
        this.isInit = false;
        this.duration = duration;
    }

    init() {
        this.htmlContainer.style.setProperty('background-image', `url(${this.url})`);
        this.animation = this._createAnimator({
            duration: this.duration * 1000,
            timing(timeFraction) {
                return timeFraction;
            },
            draw: (progress) => {
                this.progressFns.forEach(fn => fn(progress));
            },
            onEnd: () => {
                this.endsFns.forEach(fn => fn());
            }
        })

        this.canPlay = true;
        this.isInit = true;
        this.readyFns.forEach(fn => fn());
    }


    play() {
        this.animation.start();
    }

    pause() {
        this.animation.pause();
    }

    stop() {
        this.animation?.reset();
    }

    onProgress(fn) {
        this.progressFns.push(fn);
    }

    onEnd(fn) {
        this.endsFns.push(fn);
    }

    onReady(fn) {
        this.readyFns.push(fn);
    }

    _createAnimator = ({ timing, draw, duration, onEnd }) => {
        let start = null;
        let pausedAt = null;
        let rafId = null;

        const animate = time => {
            if (!start) start = time;
            if (pausedAt) {
                start += (time - pausedAt);
                pausedAt = null;
            }
            let timeFraction = (time - start) / duration;
            if (timeFraction > 1) timeFraction = 1;

            let progress = timing(timeFraction);
            draw(progress);

            if (timeFraction < 1) {
                rafId = requestAnimationFrame(animate);
            } else {
                onEnd()
                start = null;
            }
        };

        return {
            start: () => {
                if (!rafId) {
                    rafId = requestAnimationFrame(animate);
                }
            },
            pause: () => {
                if (rafId) {
                    pausedAt = performance.now();
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            },
            reset: () => {
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                start = null;
                pausedAt = null;
            }
        };
    };
}

class VideoStory {
    constructor({ htmlContainer, url, videoType, duration }) {
        this.htmlContainer = htmlContainer;
        this.url = url;
        this.progressFns = [];
        this.endsFns = [];
        this.readyFns = [];
        this.canPlay = false;
        this.isInit = false;
        this.duration = duration;
        this.videoType = videoType;
    }

    init() {
        const videoType = this.videoType;
        const videoEl = document.createElement('video');
        videoEl.setAttribute('muted', 'muted');
        videoEl.setAttribute('playsinline', 'playsinline');
        videoEl.setAttribute('disablepictureinpicture', '');
        videoEl.setAttribute('controlslist', 'nodownload noplaybackrate');
        videoEl.setAttribute('type', videoType);
        this.htmlContainer.append(videoEl);

        this.player = videojs(videoEl);
        this.player.src({ type: videoType, src: this.url });
        this.player.ready(() => {
            this.canPlay = true;
            this.readyFns.forEach(fn => fn());
        });

        this.player.on('timeupdate', (e, i) => {
            const duration = this.duration <= this.player.duration()
                ? this.duration
                : this.player.duration();
            const currentTime = this.player.currentTime();
            const progress = currentTime / duration;
            this.progressFns.forEach(fn => fn(Math.min(progress, 1)));

            if (currentTime >= duration) {
                this.player.pause();
                this.endsFns.forEach(fn => fn());
            }
        })

        this.player.on('ended', () => {
            this.endsFns.forEach(fn => fn());
        })

        this.isInit = true;
    }

    play() {
        this.player.play();
    }

    pause() {
        this.player.pause();
    }

    stop() {
        this.player.currentTime(0);
        this.player.pause();
    }

    onProgress(fn) {
        this.progressFns.push(fn);
    }

    onEnd(fn) {
        this.endsFns.push(fn);
    }

    onReady(fn) {
        this.readyFns.push(fn);
    }
}

class Stories {
    constructor({
        storiesContainer,
        progressLineContainer,
        btnPlayPause
    }) {
        this.storiesContainer = storiesContainer;
        this.progressLineContainer = progressLineContainer;
        this.btnPlayPause = btnPlayPause;
        this.stories = this._initStories();
        this._isEnd = false;
        this._isStart = true;
        this.readyFns = [];
        this.endFns = [];
        this.changeFns = [];
        this.activeStoryIndex = 0;
        this.prevActiveStoryIndex = 0;
        this.prevItems = [];
        this.progressAnimation = true;
    }

    init() {

        this._createProgressLines();
        this._setEvents();

        const firstStory = this.stories[0];
        firstStory.onReady(() => {
            this.readyFns.forEach(fn => fn());
        })

        this._render();
    }

    play() {
        const story = this.stories[this.activeStoryIndex];
        this.prevItems.forEach((st, index) => {
            if (!st) return;

            if (st === story) return;
            st.stop();
        })

        // this._removeProgressAnimation();
        // const linePrev = this.progressLineContainer.children[this.activeStoryIndex - 1];
        // if(linePrev) {
        //     linePrev.classList.add('viewed');
        //     linePrev.classList.remove('active');
        // }
        // //linePrev && this._setProgress(linePrev, 1);

        // const line = this.progressLineContainer.children[this.activeStoryIndex];
        // if(line) {
        //     line.classList.remove('viewed');
        //     line.classList.add('active');
        // }

        // const lineNext = this.progressLineContainer.children[this.activeStoryIndex + 1];
        // if(lineNext) {
        //     lineNext.classList.remove('viewed');
        //     lineNext.classList.remove('active');
        // }
        //lineNext && this._setProgress(lineNext, 0);

        const play = () => {
            if (story.canPlay) {
                story.play();
                this.btnPlayPause && this.btnPlayPause.classList.add('pause');
            } else {
                setTimeout(() => {
                    play();
                }, 200)
            }
        }
        play();
    }

    pause() {
        const story = this.stories[this.activeStoryIndex];
        story.pause();
        this.btnPlayPause && this.btnPlayPause.classList.remove('pause');
    }

    next() {
        if (this.activeStoryIndex === this.stories.length - 1) return;
        this.activeStoryIndex++;
        this._updateProgressLines();
        this._render();
        this.play();
        this.changeFns.forEach(fn => fn());
    }

    prev() {
        if (this.activeStoryIndex === 0) return;
        this.activeStoryIndex--;
        this._updateProgressLines();
        this._render();
        this.play();
        this.changeFns.forEach(fn => fn());
    }

    stop() {
        const story = this.stories[this.activeStoryIndex];
        story.stop();
    }

    get isEnd() {
        return this._isEnd;
    }
    get isStart() {
        return this._isStart;
    }

    onReady(fn) {
        this.readyFns.push(fn);
    }

    onEnd(fn) {
        this.endFns.push(fn);
    }

    onStoryChange(fn) {
        this.changeFns.push(fn);
    }

    _createProgressLines() {
        const lines = this.stories.map(story => {
            const line = document.createElement('div');
            line.className = 'progress-line';
            line.style.setProperty('--value', '0%');

            return line;
        })

        this.progressLineContainer.append(...lines);
    }

    _updateProgressLines() {
        Array.from(this.progressLineContainer.children).forEach((line, index) => {
            const activeIndex = this.activeStoryIndex;
            if (index < activeIndex) {
                line.classList.add('viewed');
                line.classList.remove('active');
                this._setProgress(line, 0);
            } else if (index === activeIndex) {
                line.classList.remove('viewed');
                line.classList.add('active');
                this._setProgress(line, 0);
            } else if (index > activeIndex) {
                line.classList.remove('viewed');
                line.classList.remove('active');
                this._setProgress(line, 0);
            }
        })
    }

    _initStories() {
        return Array.from(this.storiesContainer.children).map(storyItem => {
            const storyType = storyItem.getAttribute('data-story-type');
            let story;
            if (storyType === 'image') {
                story = new ImageStory({
                    htmlContainer: storyItem,
                    url: storyItem.getAttribute('data-url'),
                    duration: storyItem.getAttribute('data-story-duration') || 6
                })
            }

            if (storyType === 'video') {
                story = new VideoStory({
                    htmlContainer: storyItem,
                    url: storyItem.getAttribute('data-url'),
                    videoType: storyItem.getAttribute('data-video-type'),
                    duration: storyItem.getAttribute('data-story-duration') || 6
                });
            }
            storyItem.remove();
            return story;
        });
    }

    _render() {
        const i = this.activeStoryIndex;
        const prevIndex = this.prevActiveStoryIndex;
        const stories = this.stories;
        const prevItems = this.prevItems;

        const items = [stories[i - 1], stories[i], stories[i + 1]];

        items.forEach((story, index) => {
            if (!story) return;

            if (index === 1) {
                story.htmlContainer.classList.add('active');
            } else {
                story.htmlContainer.classList.remove('active');
            }

            if (!prevItems.includes(story)) {
                story.isInit || story.init();
                prevIndex < i
                    ? this.storiesContainer.append(story.htmlContainer)
                    : this.storiesContainer.prepend(story.htmlContainer)
            }

        })

        prevItems.forEach(story => {
            if (!story) return;

            if (!items.includes(story)) {
                story.htmlContainer.remove();
            }
        })

        this.prevItems = items;
        this.prevActiveStoryIndex = i;

        this._checkIndexPosition();
    }

    _checkIndexPosition() {
        if (this.activeStoryIndex === this.stories.length - 1) {
            this._isEnd = true
        } else {
            this._isEnd = false
        }

        if (this.activeStoryIndex === 0) {
            this._isStart = true
        } else {
            this._isStart = false
        }
    }

    _setEvents() {
        this.stories.forEach((story, index) => {
            const line = this.progressLineContainer.children[index];
            story.onProgress((progress) => {
                if (this.activeStoryIndex !== index) return;
                this._setProgress(line, progress);
            })

            story.onEnd(() => {
                if (!this.isEnd) {
                    this.next();
                } else {
                    this.endFns.forEach(fn => fn());
                }
            })

            story.onReady(() => {

            })
        })
    }

    _setProgress(line, progress) {
        if (this.progressAnimation) {
            line.style.removeProperty('transition');
        } else {
            line.style.setProperty('transition', 'all 0s linear');
        }
        line.style.setProperty('--value', 100 * progress + '%');
    }

    _removeProgressAnimation() {
        this.progressAnimation = false;

        setTimeout(() => {
            this.progressAnimation = true;;
        }, 300)
    }
}

class StoryCard {
    constructor(htmlContainer) {
        this.htmlContainer = htmlContainer;
        this.previewHtmlContainer = htmlContainer.querySelector('.stories-card__preview')
        this.stories = null;
        this.canPlayFns = [];
        this.onEndFns = [];
        this.changeFns = [];
        this.onBeforeStartFns = [];
        this.isCanPlay = false;
    }

    init() {
        this._initStories();
        this._initBottomSlidePanel();
        this._initEvents();

        this.htmlContainer.classList.add('stories-card-initialized');
    }

    onCanPlay(fn) {
        this.canPlayFns.push(fn);
    }

    onEnd(fn) {
        this.onEndFns.push(fn);
    }

    onBeforeStart(fn) {
        this.onBeforeStartFns.push(fn);
    }

    onStoryChange(fn) {
        this.changeFns.push(fn);
    }

    play() {
        if (!this.stories) return;
        this.stories.play();
    }
    pause() {
        if (!this.stories) return;
        this.stories.pause();
    }

    next() {
        if (!this.stories) return;
        this.stories.next();
    }

    prev() {
        if (!this.stories) return;
        this.stories.prev();
    }

    hidePreview() {
        this.previewHtmlContainer.classList.add('hide');
    }

    showPreview() {
        this.previewHtmlContainer.classList.remove('hide');
    }


    _initStories() {
        this.stories = new Stories({
            storiesContainer: this.htmlContainer.querySelector('.stories-card__stories'),
            progressLineContainer: this.htmlContainer.querySelector('.stories-card__progress-lines'),
            btnPlayPause: this.htmlContainer.querySelector('.stories-card__play-pause-btn')
        });

        this.stories.onReady(() => {
            this.isCanPlay = true;
            this.canPlayFns.forEach(fn => fn());
        })
        this.stories.onEnd(() => {
            this.onEndFns.forEach(fn => fn());
        })
        this.stories.onStoryChange(() => {
            this.changeFns.forEach(fn => fn());
        })
        this.stories.init();

    }

    _initEvents() {
        if (!this.stories) return;
        if (!this.htmlContainer) return;

        const playPauseBtn = this.htmlContainer.querySelector('.stories-card__play-pause-btn');
        const storiesContainer = this.htmlContainer.querySelector('.stories-card__stories');
        const dropDown = this.htmlContainer.querySelector('.drop-down');
        const copyLink = this.htmlContainer.querySelector('[data-copy-link]');
        const slidePanel = this.htmlContainer.querySelector('.stories-card__description');
        const toggleSlidePanelVisibleBtn = this.htmlContainer.querySelector('.stories-card__description-btn');
        const swipePanelBtn = this.htmlContainer.querySelector('.description__top-anchor');
        const swipePanelScrollContainer = this.htmlContainer.querySelector('.description__scroll-container');
        let isSwipePanelBtnActive = false;

        playPauseBtn.addEventListener('click', () => {
            if (playPauseBtn.classList.contains('pause')) {
                this.stories.pause();
            } else {
                this.stories.play();
            }
        })

        const touchArea = storiesContainer;
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let touchStartTime = 0;
        let longPressTimeout;
        const LONG_PRESS_DURATION = 150;

        // touchArea.addEventListener('pointerdown', (e) => {
        //     touchStartX = e.clientX;
        //     touchStartY = e.clientY;
        //     touchStartTime = performance.now();

        //     this.stories.pause();

        //     longPressTimeout = setTimeout(() => {

        //         //console.log('long click');
        //     }, LONG_PRESS_DURATION);

        //     this.stories.pause();
        // });

        // touchArea.addEventListener('pointerup', (e) => {
        //     clearTimeout(longPressTimeout);
        //     touchEndX = e.clientX;
        //     touchEndY = e.clientY;
        //     const timeDiff = performance.now() - touchStartTime;

        //     this.stories.play();

        //     if (timeDiff < LONG_PRESS_DURATION) {
        //         if (Math.abs(touchEndX - touchStartX) < 5 && Math.abs(touchEndY - touchStartY) < 5) {
        //             //console.log('fast click');

        //             if (isMobile() && document.documentElement.clientWidth < 920) {
        //                 const leftSide = storiesContainer.clientWidth * 0.75;

        //                 if (e.clientX > leftSide) {
        //                     if (this.stories.isStart) {
        //                         this.onBeforeStartFns.forEach(fn => fn());
        //                         return;
        //                     }
        //                     this.stories.prev();
        //                 } else {
        //                     if (this.stories.isEnd) {
        //                         this.onEndFns.forEach(fn => fn());
        //                         return;
        //                     }
        //                     this.stories.next();
        //                 }
        //             }
        //         }
        //     }
        // });

        // touchArea.addEventListener('pointermove', (e) => {
        //     if (performance.now() - touchStartTime < LONG_PRESS_DURATION) {
        //         touchEndX = e.clientX;
        //         touchEndY = e.clientY;
        //         if (Math.abs(touchEndX - touchStartX) > 10 || Math.abs(touchEndY - touchStartY) > 10) {
        //             clearTimeout(longPressTimeout);
        //             //console.log('swipe');
        //         }
        //     }
        // });

        touchArea.addEventListener('pointercancel', () => {
            clearTimeout(longPressTimeout);
        });

        touchArea.addEventListener('pointerleave', () => {
            clearTimeout(longPressTimeout);
        });


        dropDown.addEventListener('click', () => {
            dropDown.classList.add('drop-down--open');
            storiesContainer.style.setProperty('pointer-events', 'none');
            this.pause();
        })


        copyLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (!copyLink.href) return;
            navigator.clipboard.writeText(copyLink.href);
            copyLink?.classList.add('copied');

            setTimeout(() => {
                copyLink?.classList.remove('copied');
            }, 1000)
        })

        toggleSlidePanelVisibleBtn.addEventListener('click', () => {
            if(toggleSlidePanelVisibleBtn.classList.contains('active')) {
                this._animateNumberValue({
                    start: 0,
                    end: 100,
                    duration: 150,
                    callback: (progress) => {
                        slidePanel.style.setProperty('transform', `translate3d(0, ${progress}%, 0)`)
                    }
                })

                toggleSlidePanelVisibleBtn.classList.remove('active');

                storiesContainer.style.removeProperty('pointer-events');
                this.play();
            } else {
                this._animateNumberValue({
                    start: 100,
                    end: 0,
                    duration: 150,
                    callback: (progress) => {
                        slidePanel.style.setProperty('transform', `translate3d(0, ${progress}%, 0)`)
                    }
                })

                toggleSlidePanelVisibleBtn.classList.add('active');

                storiesContainer.style.setProperty('pointer-events', 'none');
                this.pause();
            }
        })


        let touchPanelStartY = 0;
        let touchPanelEndY = 0;

        swipePanelBtn.addEventListener('pointerdown', (e) => {
            console.log('down');
            isSwipePanelBtnActive = true;
            touchPanelStartY = e.pageY;

            const moveSlide = (e) => {
                console.log('move');
                if(e.pageY < touchPanelStartY) return;
                touchPanelEndY = e.pageY;
    
                const progress = touchPanelEndY - touchPanelStartY;
                slidePanel.style.setProperty('transition', 'none');
                slidePanel.style.setProperty('transform', `translate3d(0, ${progress}px, 0)`);
            }

            const handlerUp = (e) => {
                console.log('up');
                const isSwipeUp = e.pageY < touchPanelStartY;
                const value = touchPanelEndY - touchPanelStartY;
                
                slidePanel.style.removeProperty('transition');
                if(!isSwipeUp) {
                    if ( value > 40) {
                        slidePanel.style.removeProperty('transform');
                        toggleSlidePanelVisibleBtn.classList.remove('active');
    
                        storiesContainer.style.removeProperty('pointer-events');
                        this.play();
                    } else {
                        this._animateNumberValue({
                            start: value,
                            end: 0,
                            duration: 70,
                            callback: (progress) => {
                                slidePanel.style.setProperty('transform', `translate3d(0, ${progress}px, 0)`)
                            }
                        })
                    }
                }

                setTimeout(() => {
                    isSwipePanelBtnActive = false;
                }, 100)

                this.htmlContainer.removeEventListener('pointermove', moveSlide);
                this.htmlContainer.removeEventListener('pointerup', handlerUp);
            }

            this.htmlContainer.addEventListener('pointermove', moveSlide);

            this.htmlContainer.addEventListener('pointerup', handlerUp);
        })

        // this.htmlContainer.addEventListener('pointermove', (e) => {
        //     console.log('test');
        // });


        document.addEventListener('click', (e) => {
            if(isSwipePanelBtnActive) return;

            if (!e.target.closest('.drop-down')) {
                if (dropDown.classList.contains('drop-down--open')) {
                    dropDown.classList.remove('drop-down--open');
                    this.play();
                    storiesContainer.style.removeProperty('pointer-events');
                }
            } else {
                return;
            }

            if(!(e.target.closest('.stories-card__description') || e.target.closest('.stories-card__description-btn') )) {
                if (toggleSlidePanelVisibleBtn.classList.contains('active')) {
                    this._animateNumberValue({
                        start: 0,
                        end: 100,
                        duration: 150,
                        callback: (progress) => {
                            slidePanel.style.setProperty('transform', `translate3d(0, ${progress}%, 0)`)
                        }
                    })
                    toggleSlidePanelVisibleBtn.classList.remove('active');
                    this.play();
                    storiesContainer.style.removeProperty('pointer-events');
                }
            }
        })
    }

    _initBottomSlidePanel() {
        if (!this.htmlContainer) return;

        const slidePanel = this.htmlContainer.querySelector('.stories-card__description');

        new Swiper(slidePanel.querySelector('.swiper'), {
            direction: "vertical",
            slidesPerView: "auto",
            freeMode: true,
            scrollbar: {
                el: slidePanel.querySelector('.swiper-scrollbar'),
            },
            mousewheel: true,
            nested: true
        });
    }

    _animateNumberValue({ start, end, duration, callback }) {
        const startTime = performance.now();
    
        function updateNumberValue(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const currentNumber = Math.floor(start + (end - start) * progress);
            
            callback(currentNumber);
    
            if (progress < 1) {
                requestAnimationFrame(updateNumberValue);
            }
        }
        
        requestAnimationFrame(updateNumberValue);
    }
}

class StoriesCarousel {
    constructor(htmlContainer) {
        this.htmlContainer = htmlContainer;
        this.carousel = this.htmlContainer.querySelector('[data-slider="stories-carousel"]');
        this.btnLeft = this.htmlContainer.querySelector('.btn-left');
        this.btnRight = this.htmlContainer.querySelector('.btn-right');
        this.swiper = null;
        this.isMobile = document.documentElement.clientWidth < 920;
        this.prevStoryCard = null;

        this._init();
    }

    _init() {
        this._initSlider();
        this._initStoriesCards();
        this._addEvents();
    }

    _initSlider() {
        const slider = this.carousel.querySelector('.swiper');
        let isMobile = document.documentElement.clientWidth < 920;

        const initSlider = () => {
            if (document.documentElement.clientWidth >= 920 && !isMobile) {
                if (slider.classList.contains('swiper-initialized')) {
                    this.swiper.destroy();
                }

                this.swiper = new Swiper(slider, {
                    grabCursor: true,
                    centeredSlides: true,
                    slidesPerView: 1,
                    touchRatio: 0,
                    grabCursor: false,
                    speed: 400,
                    on: {
                        init: (swiper) => {
                            this._checkButtonsVisibility(swiper);
                        },
                        slideChangeTransitionStart: async (swiper) => {
                            await this._startActiveCard();

                            this._checkButtonsVisibility(swiper);
                        }
                    }
                });

                isMobile = true;
            }

            if (document.documentElement.clientWidth < 920 && isMobile) {
                if (slider.classList.contains('swiper-initialized')) {
                    this.swiper.destroy();
                }
                this.swiper = new Swiper(slider, {
                    effect: "cube",
                    grabCursor: true,
                    speed: 400,
                    threshold: 10,
                    cubeEffect: {
                        shadow: false,
                        slideShadows: false,
                        shadowOffset: 20,
                        shadowScale: 0.94,
                    },
                    on: {
                        slideChangeTransitionStart: async () => {
                            await this._startActiveCard();
                        }
                    }
                });

                isMobile = false;
            }
        }

        initSlider();

        window.addEventListener('resize', () => {
            initSlider();
        });
    }

    _initStoriesCards() {
        this.swiper.slides.forEach(slide => {
            const storyCardEl = slide.querySelector('.stories-card');
            if (storyCardEl.classList.contains('stories-card-initialized')) return;
            slide.storyCard = new StoryCard(storyCardEl);
            
            slide.storyCard.onEnd(() => {
                this.swiper.slideNext();
            })

            slide.storyCard.onBeforeStart(() => {
                this.swiper.slidePrev();
            })

            slide.storyCard.onStoryChange(() => {
                this._checkButtonsVisibility(this.swiper);
            })

            slide.storyCard.init();
        })
    }

    _addEvents() {
        this.carousel.addEventListener('click', (e) => {
            if (this.isMobile) return;

            if (e.target.closest('.stories-card')) {
                const slide = e.target.closest('.swiper-slide');

                if (!slide.classList.contains('swiper-slide-active')) {
                    const index = this.swiper.slides.indexOf(slide);
                    this.swiper.slideTo(index);
                }
            }
        })

        this.btnLeft.addEventListener('click', () => {
            if (this.isMobile) return;
            this.next();
        })

        this.btnRight.addEventListener('click', () => {
            if (this.isMobile) return;
            this.prev();
        })

        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="open-stories"]')) {
                e.preventDefault();
                const btn = e.target.closest('[data-action="open-stories"]');
                const id = btn.getAttribute('data-id');
                if (!id) return;

                this.show(id);
            }

            if (e.target.closest('[data-action="close-stories"]')) {
                e.preventDefault();
                this.hide();
            }
        })

        const swiperWrapper = this.htmlContainer.querySelector('.swiper-wrapper');
        let observer = new MutationObserver(mutationRecords => {
            this._initStoriesCards();
        });

        observer.observe(swiperWrapper, {
            childList: true,
        });

        document.addEventListener('contextmenu', function (event) {
            if (event.target.tagName === 'IMG') {
                event.preventDefault();
            }
            if (event.target.tagName === 'VIDEO') {
                event.preventDefault();
            }
        })
    }

    _checkButtonsVisibility(swiper) {
        swiper.isBeginning ? this.btnRight.classList.add('hidden') : this.btnRight.classList.remove('hidden');
        swiper.isEnd ? this.btnLeft.classList.add('hidden') : this.btnLeft.classList.remove('hidden');

        const storyCard = swiper.slides[swiper.realIndex]?.storyCard;
        if (!storyCard) return;
        if (!storyCard.stories) return;
        storyCard.stories.isStart ? this.btnRight.classList.add('stories-start') : this.btnRight.classList.remove('stories-start');
        storyCard.stories.isEnd ? this.btnLeft.classList.add('stories-end') : this.btnLeft.classList.remove('stories-end');
    }

    _getScrollbarWidth() {
        return window.innerWidth - document.querySelector('body').offsetWidth;
    }
    _toggleDisablePageScroll(state) {
        if (state) {
            const offsetValue = this._getScrollbarWidth();
            document.documentElement?.classList.add('overflow-hidden');
            document.body?.classList.add('overflow-hidden');
            document.documentElement.style.paddingRight = offsetValue + 'px';
        } else {
            document.documentElement?.classList.remove('overflow-hidden');
            document.body?.classList.remove('overflow-hidden');
            document.documentElement.style.removeProperty('padding-right');
        }
    }
    _compensateWidthOfScrollbar(isAddPadding) {
        if (isAddPadding) {
            const scrollbarWidth = this._getScrollbarWidth();
            document.documentElement.style.paddingRight = scrollbarWidth + 'px';
        } else {
            document.documentElement.style.paddingRight = '0px';
        }
    }

    async _startActiveCard() {
        const storyCard = this.swiper.slides[this.swiper.realIndex]?.storyCard;
        if (!storyCard) return;
        if (!storyCard.isCanPlay) {
            await new Promise(res => {
                storyCard.onCanPlay(() => {
                    res();
                })
            })
        }
        if (!storyCard.stories) return;
        storyCard.hidePreview();
        storyCard.play();

        if (storyCard === this.prevStoryCard) return;

        this.prevStoryCard?.showPreview();
        this.prevStoryCard?.stories?.stop();

        this.prevStoryCard = storyCard;
    }

    pause() {
        const storyCard = this.swiper.slides[this.swiper.realIndex]?.storyCard;
        if (!storyCard) return;
        storyCard.pause();
    }

    play() {
        const storyCard = this.swiper.slides[this.swiper.realIndex]?.storyCard;
        if (!storyCard) return;
        storyCard.play();
    }

    show(id) {
        const activeSlide = this.swiper.slides.find(slide => slide.classList.contains('swiper-slide-active'));
        const storyCardEl = activeSlide.querySelector('.stories-card');

        if (storyCardEl.getAttribute('data-id') === id) {
            this._startActiveCard();
        } else {
            const index = id
                ? this.swiper.slides.findIndex(slide => {
                    const card = slide.querySelector('.stories-card');
                    return card.getAttribute('data-id') === id;
                })
                : 0;
            this.swiper.slideTo(index, 0);
        }

        this._toggleDisablePageScroll(true);
        this._compensateWidthOfScrollbar(true);
        this.htmlContainer.classList.add('stories-popup--open');
    }

    hide() {
        this._toggleDisablePageScroll(false);
        this._compensateWidthOfScrollbar(false);
        this.htmlContainer.classList.remove('stories-popup--open');

        const storyCard = this.swiper.slides[this.swiper.realIndex]?.storyCard;
        if (!storyCard) return;
        storyCard.pause();
        storyCard.stories.stop();
    }

    next() {
        const storyCard = this.swiper.slides[this.swiper.realIndex]?.storyCard;
        if (!storyCard) return;
        if (!storyCard.stories) return;

        if (storyCard.stories.isEnd) {
            this.swiper.slideNext();
        } else {
            storyCard.stories.next();
        }
    }

    prev() {
        const storyCard = this.swiper.slides[this.swiper.realIndex]?.storyCard;
        if (!storyCard) return;
        if (!storyCard.stories) return;

        if (storyCard.stories.isStart) {
            this.swiper.slidePrev();
        } else {
            storyCard.stories.prev();
        }
    }
}


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

    {
    const storiesNavigation = document.querySelector('[data-slider="stories-nav"]');
    if (storiesNavigation) {
        const slider = storiesNavigation.querySelector('.swiper');
        let swiper;

        function desktopSlider() {
            if (document.documentElement.clientWidth >= 920 && storiesNavigation.dataset.mobile == 'false') {
                swiper = new Swiper(storiesNavigation.querySelector('.swiper'), {
                    speed: 500,
                    watchSlidesProgress: true,
                    watchSlidesVisibility: true,
                    slidesPerView: 10,
                    spaceBetween: 20,
                    slidesPerGroup: 5,
                    touchRatio: 0,
                    navigation: {
                        nextEl: storiesNavigation.querySelector('.btn-left'),
                        prevEl: storiesNavigation.querySelector('.btn-right'),
                    }
                });

                storiesNavigation.dataset.mobile = 'true';
            }

            if (document.documentElement.clientWidth < 920) {
                storiesNavigation.dataset.mobile = 'false';

                if (slider.classList.contains('swiper-initialized')) {
                    swiper.destroy();
                }
            }
        }

        desktopSlider();

        window.addEventListener('resize', () => {
            desktopSlider();
        })
    }
}
});	