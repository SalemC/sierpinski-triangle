export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const generateRandomIntBetween = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};
