import "./style.css";
import Data from "./data";
import gsap from "gsap";

const main = document.querySelector("main")!;
let Texties: {
  el: HTMLDivElement;
  position: {
    y: number;
  };
}[] = [];

let DataAdded = false;

let OffsetHeight = 100
let Velocity = {
  current: 0,
  target: 0,
  LERP: 0.3,
  LERP1: 0.1,
  LERP2: 0.2,
};
let MaxVelocity = 100;
let ScrollOffset = 0;

function AddTexty(): HTMLDivElement {
  const Texty = document.createElement("div");
  Texty.classList.add("texty");

  for (const key in Data) {
    if (!Object.hasOwn(Data, key)) continue;

    const Text = document.createElement("div");
    Text.classList.add("text");

    const { heading, content } = Data[key] as {
      heading: string;
      content: string[];
    };

    const Heading = document.createElement("div");
    Heading.classList.add("heading");
    Heading.innerHTML = `<p>${heading}</p>`;

    const Contents: HTMLParagraphElement[] = [];
    const Content = document.createElement("div");
    Content.classList.add("content");

    content.forEach((c) => {
      const p = document.createElement("p");
      p.textContent = c;
      Contents.push(p);
    });

    Content.append(...Contents);

    Text.appendChild(Heading);
    Text.appendChild(Content);
    Texty.appendChild(Text);
  }

  return Texty;
}

function AppendData() {
  const Texty1 = AddTexty();
  const Texty2 = AddTexty();
  Texties.push({
    el: Texty1,
    position: {
      y: innerHeight * 0.5,
    },
  });
  Texties.push({
    el: Texty2,
    position: {
      y: innerHeight * 1.5,
    },
  });
  gsap.set(Texty1, {
    y: innerHeight * 0.5,
  });
  gsap.set(Texty1, {
    y: innerHeight * 1.5,
  });
  main.appendChild(Texty1);
  main.appendChild(Texty2);

  DataAdded = true;
}

AppendData();

function Render() {
  if (!DataAdded) return;
  Texties.forEach((T) => {
    const y = T.position.y + ScrollOffset;

    gsap.set(T.el, {
      y,
    });
  });
}

gsap.ticker.add((_, dt) => {
  if (!DataAdded) return;

  Velocity.current += (Velocity.target - Velocity.current) * Velocity.LERP;
  ScrollOffset -= Velocity.current * (dt / 60);

  Render();
});

let lastTouchY = 0;
let lastTouchTime = 0;

/* --------------------------- TOUCH EVENTS --------------------------- */

let IsTouching = false;

function TouchStartHover() {
  IsTouching = true;
}

function TouchEndHover() {
  IsTouching = false;
}

function TouchStart(e: TouchEvent) {
  if (!e.touches.length) return;

  lastTouchY = e.touches[0].clientY;
  lastTouchTime = performance.now();

  Velocity.target = 0;
}

function TouchMoveScroll(e: TouchEvent) {
  if (!e.touches.length) return;

  const now = performance.now();
  const y = e.touches[0].clientY;

  const dy = lastTouchY - y;
  const dt = now - lastTouchTime || 16;

  lastTouchY = y;
  lastTouchTime = now;

  Velocity.target = Math.max(
    -MaxVelocity * 3,
    Math.min((dy / dt) * 50, MaxVelocity * 3),
  );
}

function TouchEnd() {
  Velocity.target = 0;
  Velocity.LERP = Velocity.LERP2;
}

function MouseMove(e: MouseEvent) {}

function TouchMove(e: TouchEvent) {
  if (!e.touches.length) return;
  const t = e.touches[0];
}

let lastTime = performance.now();
let scrollEndTimer: number | undefined;

function OnMouse(ev: WheelEvent) {
  Velocity.LERP = Velocity.LERP1;

  const now = performance.now();
  const dt = now - lastTime || 16;
  lastTime = now;

  let delta = ev.deltaY;

  if (ev.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
  if (ev.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= innerHeight;

  Velocity.target = Math.max(
    -MaxVelocity,
    Math.min((delta / dt) * 20, MaxVelocity),
  );

  if (scrollEndTimer) clearTimeout(scrollEndTimer);

  scrollEndTimer = window.setTimeout(() => {
    Velocity.target = 0;
    Velocity.LERP = Velocity.LERP2;
  }, 200);
}

window.addEventListener("mousemove", MouseMove);
window.addEventListener("wheel", OnMouse, { passive: true });
window.addEventListener(
  "touchstart",
  (e) => {
    TouchStart(e);
    TouchStartHover();
  },
  { passive: true },
);

window.addEventListener(
  "touchmove",
  (e) => {
    TouchMove(e);
    TouchMoveScroll(e);
  },
  { passive: true },
);

window.addEventListener(
  "touchend",
  () => {
    TouchEnd();
    TouchEndHover();
  },
  { passive: true },
);
