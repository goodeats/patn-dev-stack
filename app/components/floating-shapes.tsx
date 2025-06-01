import { useState, useEffect } from 'react'
import { useTheme } from '#app/routes/resources+/theme-switch.tsx'

// the purpose of this component is to create a floating shapes effect on the hero section of the marketing page
// it's a fun and easy way to add a little bit of personality to the page
// it's also a good way to test out some of the more advanced features of tailwind css
// and to see how it can be used to create a more dynamic and engaging user experience
// hooray vibe coding! 😎🤙

// ============================================================================
// CONFIGURATION - Easy to tweak settings
// ============================================================================
const CONFIG = {
	// Shape generation
	SHAPE_COUNT: 12,
	SHAPE_TYPES: ['triangle'], // ['circle', 'square', 'triangle']

	// Size settings (as percentage of container's smallest dimension)
	SIZE: {
		MIN_PERCENT: 150, // % of container's smallest dimension
		MAX_PERCENT: 333, // % of container's smallest dimension
	},

	// Position settings (center point positioning)
	POSITION: {
		// How far beyond container edges shapes can extend (as multiple of shape size)
		// 0.5 means shape center can be 50% of shape size beyond edge
		OVERFLOW_FACTOR: 0.5,
	},

	// Animation settings
	ANIMATION: {
		DURATION_MIN_SECONDS: 120,
		DURATION_MAX_SECONDS: 120,
		DELAY_MAX_SECONDS: 0,
		// Movement range as percentage of container
		MOVEMENT_RANGE_PERCENT: 15, // ±15% of container dimensions
	},

	// Appearance
	APPEARANCE: {
		OPACITY_LIGHT_THEME: 'opacity-5',
		OPACITY_DARK_THEME: 'opacity-5',
		BACKGROUND: {
			GRADIENT_ANGLE: 135, // Angle in degrees for the linear gradient direction
			GRADIENT_OPACITY_START: 1, // Starting opacity for the gradient (solid)
			GRADIENT_OPACITY_END: 0.014, // Ending opacity for the gradient (semi-transparent)
			GRADIENT_PERCENT_START: 0, // Starting percentage point for the gradient
			GRADIENT_PERCENT_END: 100, // Ending percentage point for the gradient
		},
	},
}

export const randomInRange = (min: number, max: number) => {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export const getRandomSizePercent = (
	minPercent: number,
	maxPercent: number,
) => {
	return Math.random() * (maxPercent - minPercent) + minPercent
}

export const getRandomPosition = (
	sizePercent: number,
	overflowFactor: number,
) => {
	const halfSizePercent = sizePercent / 2
	const overflow = halfSizePercent * overflowFactor
	const minPosition = -overflow
	const maxPosition = 100 + overflow
	return {
		centerX: Math.random() * (maxPosition - minPosition) + minPosition,
		centerY: Math.random() * (maxPosition - minPosition) + minPosition,
	}
}

export const getRandomDuration = (minSeconds: number, maxSeconds: number) => {
	return Math.random() * (maxSeconds - minSeconds) + minSeconds
}

export const getRandomDelay = (maxSeconds: number) => {
	return Math.random() * maxSeconds
}

export const getRandomShape = (shapeTypes: string[]) => {
	return shapeTypes[Math.floor(Math.random() * shapeTypes.length)] as string
}

export const getRandomMovement = (movementRangePercent: number) => {
	return {
		moveXPercent:
			Math.random() * (movementRangePercent * 2) - movementRangePercent,
		moveYPercent:
			Math.random() * (movementRangePercent * 2) - movementRangePercent,
	}
}

// Utility functions for style calculations

type BackgroundGradientConfig = {
	GRADIENT_ANGLE: number
	GRADIENT_OPACITY_START: number
	GRADIENT_OPACITY_END: number
	GRADIENT_PERCENT_START: number
	GRADIENT_PERCENT_END: number
}
/**
 * Calculates the height of an equilateral triangle given its base width.
 * Uses the formula: height = (base * sqrt(3)) / 2
 * @param baseWidth - The width/base of the triangle
 * @returns The height needed for an equilateral triangle
 */
export const getTriangleHeight = (baseWidth: number) => {
	return (baseWidth * Math.sqrt(3)) / 2
}

/**
 * Calculates the width and height for a shape based on container's smallest dimension.
 * For triangles, adjusts height to maintain equilateral proportions.
 * @param sizePercent - Size as percentage of container's smallest dimension.
 * @param isTriangle - Whether the shape is a triangle.
 * @returns An object with width and height CSS values.
 */
export const getShapeDimensions = (
	sizePercent: number,
	isTriangle: boolean,
) => {
	const width = `min(${sizePercent}vw, ${sizePercent}vh)`
	const height = isTriangle
		? `min(${getTriangleHeight(sizePercent)}vw, ${getTriangleHeight(sizePercent)}vh)`
		: width
	return { width, height }
}

/**
 * Calculates the top offset for positioning a shape's center, adjusting for triangle height.
 * @param centerY - Center Y position as percentage.
 * @param sizePercent - Size as percentage of container's smallest dimension.
 * @param isTriangle - Whether the shape is a triangle.
 * @returns The top position as a percentage string.
 */
export const getShapeTopPosition = (
	centerY: number,
	sizePercent: number,
	isTriangle: boolean,
) => {
	return `${centerY - (isTriangle ? (sizePercent * Math.sqrt(3)) / 4 : sizePercent / 2)}%`
}

/**
 * Generates a linear gradient background string for shapes using CSS variables.
 * @param theme - The current theme ('light' or 'dark').
 * @param bgGradientConfig - The configuration object for gradient settings.
 * @returns A CSS background gradient string.
 */
export const getBackgroundGradient = (
	theme: string,
	bgGradientConfig: BackgroundGradientConfig,
): string => {
	// Use CSS variables directly from the theme
	// This ensures we always use the current primary color values from tailwind.css
	const colorVariable = theme === 'light' ? 'var(--primary)' : 'var(--primary)'

	// Constructs a linear gradient using configured angle and opacity stops
	// The gradient adds depth and a sense of light direction, enhancing the 3D floating illusion
	return `linear-gradient(${bgGradientConfig.GRADIENT_ANGLE}deg, ${colorVariable} ${bgGradientConfig.GRADIENT_PERCENT_START}%, ${colorVariable} ${bgGradientConfig.GRADIENT_PERCENT_END}%)`
}

/**
 * Computes the styles for a shape based on its properties and theme settings.
 * @param shape - The shape properties to compute styles from.
 * @param theme - The current theme ('light' or 'dark').
 * @param bgGradientConfig - The configuration object for gradient settings.
 * @returns The computed CSS properties for the shape.
 */
export const getShapeStyles = (
	shape: ShapeProps,
	theme: string,
	bgGradientConfig: BackgroundGradientConfig,
): React.CSSProperties => {
	// For an equilateral triangle, height is (side * sqrt(3)) / 2
	const isTriangle = shape.shape === 'triangle'
	const { width, height } = getShapeDimensions(shape.sizePercent, isTriangle)

	return {
		// Size based on container's smallest dimension for responsive design
		// Using 'min' ensures shapes scale proportionally on different screen sizes
		width,
		height,

		// Position adjusted for center point without transform
		// Subtract half the size to center the shape at the specified coordinates
		left: `${shape.centerX - shape.sizePercent / 2}%`,
		top: getShapeTopPosition(shape.centerY, shape.sizePercent, isTriangle),

		// Background with a linear gradient for visual depth
		// The gradient goes from solid color to semi-transparent, creating a subtle fade effect
		// This enhances the floating, ethereal appearance of shapes
		background: getBackgroundGradient(theme, bgGradientConfig),

		// Animation duration as a CSS variable for the float-shape animation
		// Controls how long one full cycle of floating movement takes
		'--duration': `${shape.duration}s`,

		// Movement distances as CSS variables for the animation keyframes
		// Defines how far the shape moves in X and Y directions during animation
		'--move-x': `${shape.moveXPercent}%`,
		'--move-y': `${shape.moveYPercent}%`,

		// Animation delay to stagger the start of animations for multiple shapes
		// Creates a more natural, less synchronized floating effect
		animationDelay: `${shape.delay}s`,

		// This is a performance optimization to tell the browser to only animate the transform properties
		// This can help reduce jank and improve performance
		willChange: 'transform',
	}
}

interface ShapeProps {
	id: number
	sizePercent: number // Size as percentage of container's smallest dimension
	centerX: number // Center X position as percentage
	centerY: number // Center Y position as percentage
	duration: number
	delay: number
	shape: string
	moveXPercent: number // Movement as percentage of container width
	moveYPercent: number // Movement as percentage of container height
}

/**
 * Determines the CSS class names for a shape based on its type and theme opacity.
 * @param shapeType - The type of shape (circle, triangle, etc.).
 * @param shapeOpacityClass - The opacity class based on the current theme.
 * @returns A string of class names to be applied to the shape element.
 */
export const getShapeClassNames = (
	shapeType: string,
	shapeOpacityClass: string,
) => {
	// Applies a custom floating animation with:
	// - float-shape: The keyframe animation name defined in our CSS
	// - var(--duration): Dynamic duration from shape's props (set in getShapeStyles)
	// - ease-in-out: Smooth acceleration and deceleration for natural movement
	// - infinite: Animation repeats indefinitely
	return `absolute animate-[float-shape_var(--duration)_ease-in-out_infinite] ${shapeOpacityClass} ${
		shapeType === 'circle'
			? 'rounded-full' // Makes the shape a perfect circle with fully rounded corners.
			: shapeType === 'triangle'
				? 'clip-path-triangle' // Applies a custom clip-path to create a triangle shape, defined in Tailwind CSS.
				: 'rounded-lg' // Default shape styling for squares or other shapes with slightly rounded corners.
	}`
}

export function FloatingShapes() {
	const theme = useTheme()
	const [shapes, setShapes] = useState<ShapeProps[]>([])

	useEffect(() => {
		// Generate random shapes with percentage-based properties
		const generateShapes = () =>
			Array.from({ length: CONFIG.SHAPE_COUNT }, (_, i) => {
				const sizePercent = getRandomSizePercent(
					CONFIG.SIZE.MIN_PERCENT,
					CONFIG.SIZE.MAX_PERCENT,
				)
				const { centerX, centerY } = getRandomPosition(
					sizePercent,
					CONFIG.POSITION.OVERFLOW_FACTOR,
				)
				const duration = getRandomDuration(
					CONFIG.ANIMATION.DURATION_MIN_SECONDS,
					CONFIG.ANIMATION.DURATION_MAX_SECONDS,
				)
				const delay = getRandomDelay(CONFIG.ANIMATION.DELAY_MAX_SECONDS)
				const shape = getRandomShape(CONFIG.SHAPE_TYPES)
				const { moveXPercent, moveYPercent } = getRandomMovement(
					CONFIG.ANIMATION.MOVEMENT_RANGE_PERCENT,
				)

				return {
					id: i,
					sizePercent,
					centerX,
					centerY,
					duration,
					delay,
					shape,
					moveXPercent,
					moveYPercent,
				}
			})
		setShapes(generateShapes())
	}, [])

	if (!shapes.length) {
		return null
	}

	// Determine opacity based on theme
	const shapeOpacityClass =
		theme === 'light'
			? CONFIG.APPEARANCE.OPACITY_LIGHT_THEME
			: CONFIG.APPEARANCE.OPACITY_DARK_THEME

	const bgGradientConfig = CONFIG.APPEARANCE.BACKGROUND

	return (
		<div
			id="floating-shapes"
			className="pointer-events-none absolute inset-0 overflow-hidden"
		>
			{shapes.map((shape) => (
				<div
					key={shape.id}
					className={getShapeClassNames(shape.shape, shapeOpacityClass)}
					style={getShapeStyles(shape, theme, bgGradientConfig)}
				/>
			))}
		</div>
	)
}
