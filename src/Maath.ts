export const Curve = (y: number, r: number) => {
  return Math.sqrt(r * r - y * y);
};

export const CurveSoft = (y: number, r: number) => {
  const t = y / r;
  return r * (1 - t * t);
};

export const CurveParabola = (y: number, r: number) => {
  const t = y / r;
  return r * (1 - Math.abs(t));
};

export const CurveGaussian = (y: number, r: number) => {
  const sigma = r * 0.5;
  return r * Math.exp(-(y * y) / (2 * sigma * sigma));
};

export const CurvePower = (y: number, r: number) => {
  const t = Math.abs(y) / r;
  return r * (1 - Math.pow(t, 3));
};

export const CurveSine = (y: number, r: number) => {
  const t = y / r;
  return r * Math.cos((Math.PI / 2) * t);
};
