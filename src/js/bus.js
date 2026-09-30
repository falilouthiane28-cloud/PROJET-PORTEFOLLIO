// État partagé entre le scroll, le pointeur et la planète (lu une fois par image sur gsap.ticker).
export const bus = { px: 0, py: 0, scroll: 0, vel: 0 };
