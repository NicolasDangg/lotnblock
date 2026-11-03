/**
 * A tiny spring in Apple's terms: `damping` (1 = no overshoot, <1 bounces) and `response`
 * (seconds to reach the target, roughly). It starts from the current value and velocity, so a
 * running animation can be grabbed and re-targeted without a jump.
 */
export interface SpringOptions {
  damping?: number;
  response?: number;
}

export function animateSpring(
  from: number,
  to: number,
  onUpdate: (v: number) => void,
  { damping = 1, response = 0.4 }: SpringOptions = {},
  initialVelocity = 0,
): () => void {
  const stiffness = (2 * Math.PI / response) ** 2;
  const friction = (4 * Math.PI * damping) / response;
  let x = from;
  let v = initialVelocity;
  let last = performance.now();
  let raf = 0;
  const step = (now: number) => {
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;
    const a = -stiffness * (x - to) - friction * v;
    v += a * dt;
    x += v * dt;
    if (Math.abs(x - to) < 0.1 && Math.abs(v) < 0.1) {
      onUpdate(to);
      return;
    }
    onUpdate(x);
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/** Apple's rubber band: the further past the edge, the less it follows. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
