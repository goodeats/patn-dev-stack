import { useState, useEffect } from 'react'
import { useTheme } from '#app/routes/resources+/theme-switch.tsx'
import { createLogger } from '#app/utils/logger.ts'

// ============================================================================
// CONFIGURATION - Easy to tweak settings
// ============================================================================
const CONFIG = {
	// Shape generation
	SHAPE_COUNT: 7,
	// SHAPE_TYPES: ['square'], // ['circle', 'square', 'triangle']
	SHAPE_TYPES: ['triangle'], // ['circle', 'square', 'triangle']

	// Size settings (as percentage of container's smallest dimension)
	SIZE: {
		MIN_PERCENT: 115, // 15% of container's smallest dimension
		MAX_PERCENT: 155, // 25% of container's smallest dimension
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
		OPACITY_LIGHT_THEME: 'opacity-20',
		OPACITY_DARK_THEME: 'opacity-30',
		BG_COLOR_RGBA: [192, 192, 192],
		BG_GRADIENT_OPACITY: 0.014,
	},
}

const flLogger = createLogger('FloatingShapes', {
	skipTimestamp: true,
})

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

	const { BG_COLOR_RGBA, BG_GRADIENT_OPACITY } = CONFIG.APPEARANCE

	return (
		<div
			id="floating-shapes"
			className="pointer-events-none absolute inset-0 overflow-hidden"
		>
			{shapes.map((shape) => (
				<div
					key={shape.id}
					className={`absolute animate-[float-shape_var(--duration)_ease-in-out_infinite] ${shapeOpacityClass} ${
						shape.shape === 'circle'
							? 'rounded-full'
							: shape.shape === 'triangle'
								? 'clip-path-triangle'
								: 'rounded-lg'
					}`}
					style={
						{
							// Size based on container's smallest dimension
							width: `min(${shape.sizePercent}vw, ${shape.sizePercent}vh)`,
							height: `min(${shape.sizePercent}vw, ${shape.sizePercent}vh)`,
							// Position adjusted for center point without transform
							left: `${shape.centerX - shape.sizePercent / 2}%`,
							top: `${shape.centerY - shape.sizePercent / 2}%`,
							background: `linear-gradient(135deg, rgba(${BG_COLOR_RGBA.join(
								',',
							)}, 1) 0%, rgba(${BG_COLOR_RGBA.join(',')}, ${BG_GRADIENT_OPACITY}) 100%)`,
							'--duration': `${shape.duration}s`,
							'--move-x': `${shape.moveXPercent}%`,
							'--move-y': `${shape.moveYPercent}%`,
							animationDelay: `${shape.delay}s`,
						} as React.CSSProperties
					}
				/>
			))}
		</div>
	)
}
