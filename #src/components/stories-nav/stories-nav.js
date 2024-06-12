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