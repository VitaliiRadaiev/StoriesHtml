{
    const storiesNavigation = document.querySelector('[data-slider="stories-nav"]');
    if (storiesNavigation) {

        const swiper = new Swiper(storiesNavigation.querySelector('.swiper'), {
            navigation: {
                nextEl: storiesNavigation.querySelector('.btn-left'),
                prevEl: storiesNavigation.querySelector('.btn-right'),
            },
            speed: 400,
            breakpoints: {
                0: {
                    slidesPerView: 'auto',
                    spaceBetween: 0,
                    slidesPerGroup: 2,
                    touchRatio: 1,
                    freeMode: true,
                },
                920: {
                    slidesPerView: 10,
                    spaceBetween: 20,
                    slidesPerGroup: 5,
                    touchRatio: 0,
                    freeMode: false,
                }
            }

        });
    }
}