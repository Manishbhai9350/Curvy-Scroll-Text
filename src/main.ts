import "./style.css";
import Data from "./data";
import gsap from "gsap";
import {
  Curve,
  CurveGaussian,
  CurveParabola,
  CurvePower,
  CurveSine,
  CurveSoft,
} from "./Maath";

const main = document.querySelector("main")!;
const Logo = document.querySelector("div.logo")!;

let BaseCurve = Curve;
let BaseCurveLERP = 0.15;

let Texties: {
  el: HTMLDivElement;
  position: {
    y: number;
  };
  initial: {
    y: number;
  };
}[] = [];

let LogoRect = Logo.getBoundingClientRect();

let Radius = (LogoRect.width / 2) * 1.5;

// let Radii = document.createElement("div");
// main.appendChild(Radii);
// gsap.set(Radii, {
//   width: 2 * Radius,
//   height: 2 * Radius,
//   borderRadius: "50%",
//   background: "red",
//   position: "absolute",
//   top: "50%",
//   left: "50%",
//   xPercent: -50,
//   yPercent: -50,
// });

let DataAdded = false;

let OffsetHeight = 100;
let Velocity = {
  current: 0,
  target: 0,
  LERP: 0.3,
  LERP1: 0.1,
  LERP2: 0.2,
};
let MaxVelocity = 100;
let ScrollOffset = 0;

const Elements: {
  el: HTMLParagraphElement;
  curveFactor: number;
  targetX: number;
  X: number;
  LERP: number;
}[] = [];

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

    const ContentsContainer: HTMLParagraphElement[] = [];
    const Content = document.createElement("div");
    Content.classList.add("content");

    content.forEach((c) => {
      const p = document.createElement("p");
      p.dataset.type = "content";
      p.textContent = c;
      ContentsContainer.push(p);
    });

    Elements.push(
      ...ContentsContainer.map((C) => ({
        el: C,
        curveFactor: 1,
        targetX: 0,
        X: 0,
        LERP: BaseCurveLERP,
      })),
    );

    Content.append(...ContentsContainer);

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
      y: innerHeight * 0.3,
    },
    initial: {
      y: innerHeight * 0.3,
    },
  });
  Texties.push({
    el: Texty2,
    position: {
      y: innerHeight * 1.3,
    },
    initial: {
      y: innerHeight * 1.3,
    },
  });
  gsap.set(Texty1, {
    y: innerHeight * 0.3,
  });
  gsap.set(Texty1, {
    y: innerHeight * 1.3,
  });
  main.appendChild(Texty1);
  main.appendChild(Texty2);

  DataAdded = true;
  OnResize();
}

AppendData();

function Render() {
  if (!DataAdded) return;

  const itemHeight = innerHeight;

  // move top → bottom (when fully above viewport)
  while (Texties[0].position.y + ScrollOffset <= -itemHeight) {
    const first = Texties.shift()!;
    const last = Texties[Texties.length - 1];

    first.position.y = last.position.y + itemHeight;
    Texties.push(first);
  }

  // move bottom → top (when fully below viewport)
  while (Texties[Texties.length - 1].position.y + ScrollOffset >= innerHeight) {
    const last = Texties.pop()!;
    const first = Texties[0];

    last.position.y = first.position.y - itemHeight;
    Texties.unshift(last);
  }

  // render
  Texties.forEach((T) => {
    gsap.set(T.el, {
      y: T.position.y + ScrollOffset,
    });
  });

  // Circular Animation
  const velocityFactor = Math.min(Math.abs(Velocity.current) / MaxVelocity, 1);
  const viewportCenter = innerHeight * 0.5;

  Elements.forEach((H) => {
    const rect = H.el.getBoundingClientRect();
    const elementCenter = rect.top + rect.height / 2;

    const deltaY = elementCenter - viewportCenter;

    if (Math.abs(deltaY) <= Radius) {
      const curve = BaseCurve(deltaY, Radius);
      // tiny velocity influence (direction aware)
      const velocityPush = Math.abs(Velocity.current) * 0.015;

      // base curve stays dominant
      H.targetX = curve * H.curveFactor + velocityPush;
    } else {
      H.targetX = 0;
    }

    const dynamicLERP = H.LERP + velocityFactor * 0.25;
    H.X += (H.targetX - H.X) * dynamicLERP;
    gsap.set(H.el, {
      x: H.X,
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

function OnResize() {
  Elements.forEach((E) => {
    const IsHeading = E.el.dataset.type == "heading";
    if (innerWidth <= 1000) {
      E.curveFactor = 0;
    } else {
      E.curveFactor = IsHeading ? -1 : 1;
    }
  });
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

window.addEventListener("resize", OnResize);
