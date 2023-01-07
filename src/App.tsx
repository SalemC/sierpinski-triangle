import { useRef, useCallback, useEffect, useLayoutEffect } from "react";

import { generateRandomIntBetween, lerp } from "./helpers";

const DRAW_NEW_POINT_INTERVAL_MILLISECONDS = 1;
const TRIANGLE_HEIGHT_PIXELS = 400;
const MAX_POINTS_TO_RENDER = 5000;

const App = () => {
    const interval = useRef<NodeJS.Timeout | undefined>(undefined);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Get the 2D context from the canvas.
    const getContext = useCallback(() => {
        const { current: canvas } = canvasRef;

        if (!canvas) return;

        return canvas.getContext("2d");
    }, []);

    // Setup the canvas.
    const setupCanvas = useCallback(() => {
        const { current: canvas } = canvasRef;

        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const context = getContext();

        if (!context) return;

        context.fillStyle = "#000000";
        context.fillRect(0, 0, canvas.width, canvas.height);
    }, [getContext]);

    // Draw a 1x1 point on the canvas.
    const drawPoint = useCallback(
        ({ x, y }: { x: number; y: number }) => {
            const context = getContext();

            if (!context) return;

            context.fillStyle = "#ffffff";

            context.moveTo(x, y);
            context.fillRect(x, y, 1, 1);
        },
        [getContext]
    );

    // Render the algorithm.
    const render = useCallback(() => {
        clearInterval(interval.current);

        const { current: canvas } = canvasRef;

        if (!canvas) return;

        setupCanvas();

        // Calculate the three points for the triangle.
        const topCoordinates = {
            x: Math.round(canvas.width / 2),
            y: Math.round(canvas.height / 2 - TRIANGLE_HEIGHT_PIXELS / 2),
        };

        const leftCoordinates = {
            x: Math.round(topCoordinates.x - TRIANGLE_HEIGHT_PIXELS / 2),
            y: Math.round(topCoordinates.y + TRIANGLE_HEIGHT_PIXELS / 2),
        };

        const rightCoordinates = {
            x: Math.round(topCoordinates.x + TRIANGLE_HEIGHT_PIXELS / 2),
            y: Math.round(topCoordinates.y + TRIANGLE_HEIGHT_PIXELS / 2),
        };

        // Draw the three points for the triangle.
        drawPoint(topCoordinates);
        drawPoint(leftCoordinates);
        drawPoint(rightCoordinates);

        const getRandomOriginalCoordinates = () => {
            const originalCoordinates = [topCoordinates, leftCoordinates, rightCoordinates];

            return originalCoordinates[generateRandomIntBetween(0, originalCoordinates.length - 1)];
        };

        // Initialize a starting 'previous' coordinates for the algorithm to use.
        let previousCoordinates = (() => {
            const startCoordinates = getRandomOriginalCoordinates();
            let endCoordinates = null;

            while (
                !endCoordinates ||
                (endCoordinates.x === startCoordinates.x && startCoordinates.y === endCoordinates.y)
            ) {
                endCoordinates = getRandomOriginalCoordinates();
            }

            const factor = Math.random();

            return {
                x: Math.round(lerp(startCoordinates.x, endCoordinates.x, factor)),
                y: Math.round(lerp(startCoordinates.y, endCoordinates.y, factor)),
            };
        })();

        // Keep track of how many times we've rendered points.
        // We'll need to know this so we can stop the algorithm infinitely iterating.
        let pointsRendered = 0;

        // Handle drawing new points every certain amount of milliseconds.
        interval.current = setInterval(() => {
            // If we've passed the maximum amount of points rendered, we don't want to render any more.
            if (pointsRendered > MAX_POINTS_TO_RENDER) {
                clearInterval(interval.current);

                return;
            }

            const startCoordinates = getRandomOriginalCoordinates();
            const endCoordinates = previousCoordinates;

            // The new coordinates will be the midpoint between the start and end coordinates.
            // To find that out, we can linear interpolate between the coordinates.
            const newCoordinates = {
                x: Math.round(lerp(startCoordinates.x, endCoordinates.x, 0.5)),
                y: Math.round(lerp(startCoordinates.y, endCoordinates.y, 0.5)),
            };

            drawPoint(newCoordinates);

            // Once we've drawn the coordinates, we'll want to store it so the next iteration of the algorithm
            // can use it to find the next midpoint.
            previousCoordinates = newCoordinates;

            // We've just rendered another point, let's keep track of that.
            pointsRendered += 1;
        }, DRAW_NEW_POINT_INTERVAL_MILLISECONDS);

        return () => {
            clearInterval(interval.current);
        };
    }, [drawPoint, setupCanvas]);

    // If the window resizes, we'll want to re-render the whole triangle, otherwise it'll be incorrectly scaled.
    useEffect(() => {
        window.addEventListener("resize", render);

        return () => {
            window.removeEventListener("resize", render);
        };
    }, [render]);

    // Initially start the algorithm.
    useLayoutEffect(render, [render]);

    // Render the canvas.
    return <canvas ref={canvasRef} />;
};

export default App;
