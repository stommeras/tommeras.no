import { isWinter } from './winter';

// Snow falls behind the window during the season, or whenever the visitor turns it on with snø på
const key = 'snø';
let layer: HTMLElement | undefined;

export const snowWanted = () => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return stored === 'på';
  } catch {}
  return isWinter(new Date());
};

export const rememberSnow = (on: boolean) => {
  try {
    localStorage.setItem(key, on ? 'på' : 'av');
  } catch {}
};

export const showSnow = (on: boolean) => {
  layer?.remove();
  layer = undefined;
  if (!on) return;
  layer = document.createElement('div');
  layer.className = 'snow';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 40; i++) {
    const flake = document.createElement('span');
    flake.textContent = Math.random() < 0.5 ? '*' : '·';
    const duration = 10 + Math.random() * 10;
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.fontSize = `${0.6 + Math.random() * 0.8}rem`;
    flake.style.animationDuration = `${duration}s`;
    // A negative delay starts each flake partway down, so the screen doesn't fill from the top
    flake.style.animationDelay = `${-Math.random() * duration}s`;
    flake.style.setProperty('--drift', `${(Math.random() - 0.5) * 80}px`);
    layer.append(flake);
  }
  document.body.append(layer);
};
