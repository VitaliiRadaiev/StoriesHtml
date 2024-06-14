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
        this.prevStoryCard?.stop();

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
        storyCard.stop();
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
