import "./style.css";
import Data from "./data";
import gsap from "gsap";
import {
  Curve,
  // CurveGaussian,
  // CurveParabola,
  // CurvePower,
  // CurveSine,
  // CurveSoft,
} from "./Maath";

const main = document.querySelector("main")!;
const Logo = document.querySelector("div.logo")!;

let BaseCurve = Curve;
let BaseCurveLERP = 0.15;

/* --------------------------- TEXTY STATE --------------------------- */

let Texties: {
  el: HTMLDivElement;
  height: number;
  position: { y: number };
  initial: { y: number };
}[] = [];

let LogoRect = Logo.getBoundingClientRect();
let Radius = (LogoRect.width / 2) * 1.5;

let DataAdded = false;

/* --------------------------- SCROLL PHYSICS --------------------------- */

let Velocity = {
  current: 0,
  target: 0,
  LERP: 0.3,
  LERP1: 0.1,
  LERP2: 0.2,
};

let MaxVelocity = 100;
let ScrollOffset = 0;

/* --------------------------- CURVE ELEMENTS --------------------------- */

const Elements: {
  el: HTMLParagraphElement;
  curveFactor: number;
  targetX: number;
  X: number;
  LERP: number;
}[] = [];

/* --------------------------- BUILD TEXTY --------------------------- */

function AddTexty(): HTMLDivElement {
  const Texty = document.createElement("div");
  Texty.classList.add("texty");

  Object.values(Data).forEach((v) => {
    const { heading, content } = v;
    const Text = document.createElement("div");
    Text.classList.add("text");

    const Heading = document.createElement("div");
    Heading.dataset.type = "heading";
    Heading.classList.add("heading");
    Heading.innerHTML = `<p>${heading}</p>`;

    Elements.push({
      el: Heading,
      curveFactor: -1,
      targetX: 0,
      X: 0,
      LERP: BaseCurveLERP,
    });

    const Content = document.createElement("div");
    Content.classList.add("content");

    const paragraphs: HTMLParagraphElement[] = [];

    content.forEach((c) => {
      const p = document.createElement("p");
      p.dataset.type = "content";
      p.textContent = c;
      paragraphs.push(p);
    });

    Elements.push(
      ...paragraphs.map((C) => ({
        el: C,
        curveFactor: 1,
        targetX: 0,
        X: 0,
        LERP: BaseCurveLERP,
      })),
    );

    Content.append(...paragraphs);
    Text.appendChild(Heading);
    Text.appendChild(Content);
    Texty.appendChild(Text);
  });

  return Texty;
}

/* --------------------------- APPEND --------------------------- */

function AppendData() {
  const Texty1 = AddTexty();
  const Texty2 = AddTexty();

  main.appendChild(Texty1);
  main.appendChild(Texty2);

  const h1 = Texty1.offsetHeight;
  const h2 = Texty2.offsetHeight;

  const startY = innerHeight * 0.3;

  Texties.push({
    el: Texty1,
    height: h1,
    position: { y: startY },
    initial: { y: startY },
  });

  Texties.push({
    el: Texty2,
    height: h2,
    position: { y: startY + h1 },
    initial: { y: startY + h1 },
  });

  gsap.set(Texty1, { y: startY });
  gsap.set(Texty2, { y: startY + h1 });

  DataAdded = true;
  OnResize();
}

AppendData();

/* --------------------------- RENDER --------------------------- */

function Render() {
  if (!DataAdded) return;

  /* ---------- INFINITE STACK ---------- */

  while (Texties[0].position.y + ScrollOffset <= -Texties[0].height) {
    const first = Texties.shift()!;
    const last = Texties[Texties.length - 1];

    first.position.y = last.position.y + last.height;
    Texties.push(first);
  }

  while (Texties[Texties.length - 1].position.y + ScrollOffset >= innerHeight) {
    const last = Texties.pop()!;
    const first = Texties[0];

    last.position.y = first.position.y - last.height;
    Texties.unshift(last);
  }

  Texties.forEach((T) => {
    gsap.set(T.el, { y: T.position.y + ScrollOffset });
  });

  /* ---------- CURVE ANIMATION ---------- */

  const viewportCenter = innerHeight * 0.5;

  Elements.forEach((H) => {
    const rect = H.el.getBoundingClientRect();
    const elementCenter = rect.top + rect.height / 2;
    const deltaY = elementCenter - viewportCenter;

    if (Math.abs(deltaY) <= Radius) {
      const curve = BaseCurve(deltaY, Radius);

      // tiny velocity influence (direction aware)
      const velocityPush = Velocity.current * 0.02;

      H.targetX = curve * H.curveFactor + velocityPush;
    } else {
      H.targetX = 0;
    }

    H.X += (H.targetX - H.X) * H.LERP;

    gsap.set(H.el, { x: H.X });
  });
}

/* --------------------------- LOOP --------------------------- */

gsap.ticker.add((_, dt) => {
  if (!DataAdded) return;

  Velocity.current += (Velocity.target - Velocity.current) * Velocity.LERP;
  ScrollOffset -= Velocity.current * (dt / 60);

  Render();
});

/* --------------------------- TOUCH --------------------------- */

let lastTouchY = 0;
let lastTouchTime = 0;

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

/* --------------------------- MOUSE --------------------------- */

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

/* --------------------------- RESIZE --------------------------- */

function OnResize() {
  Texties.forEach((T) => {
    T.height = T.el.offsetHeight;
  });

  Elements.forEach((E) => {
    const isHeading = E.el.dataset.type === "heading";
    E.curveFactor = innerWidth <= 1000 ? 0 : isHeading ? -1 : 1;
  });
}

/* --------------------------- EVENTS --------------------------- */

window.addEventListener("wheel", OnMouse, { passive: true });
window.addEventListener("touchstart", TouchStart, { passive: true });
window.addEventListener("touchmove", TouchMoveScroll, { passive: true });
window.addEventListener("touchend", TouchEnd, { passive: true });
window.addEventListener("resize", OnResize);
