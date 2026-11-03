const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ';
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function setUpHero(hero: Element) {
  const name = hero.querySelector<HTMLElement>('.name')!;
  const target = name.querySelector<HTMLElement>('[data-value]')!;
  const value = target.dataset.value!;
  let interval: number | undefined;

  function scramble() {
    if (reducedMotion.matches) return;
    let iteration = 0;
    clearInterval(interval);
    interval = setInterval(() => {
      target.textContent = [...value]
        .map((letter, index) => (index < iteration ? letter : letters[Math.floor(Math.random() * letters.length)]))
        .join('');
      if (iteration >= value.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);
  }

  name.addEventListener('pointerenter', scramble);

  for (const [i, star] of hero.querySelectorAll<HTMLElement>('.star').entries()) {
    const move = () => {
      star.style.left = `${rand(-10, 100)}%`;
      star.style.top = `${rand(-40, 80)}%`;
      star.style.rotate = `${rand(0, 360)}deg`;
    };
    move();
    star.addEventListener('animationiteration', move);
    star.style.animationDelay = `calc(var(--pulse) * ${i} / 3)`;
  }

  return scramble;
}
