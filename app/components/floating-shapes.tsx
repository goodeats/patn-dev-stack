import { useState, useEffect } from 'react'
import { useTheme } from '#app/routes/resources+/theme-switch.tsx'
import { createLogger } from '#app/utils/logger.ts'

// ============================================================================
// CONFIGURATION - Easy to tweak settings
// ============================================================================
const CONFIG = {
	// Shape generation
	SHAPE_COUNT: 10,
	SHAPE_TYPES: ['square'], // ['circle', 'square', 'triangle']

	// Size settings (as percentage of container's smallest dimension)
	SIZE: {
		MIN_PERCENT: 15, // 15% of container's smallest dimension
		MAX_PERCENT: 25, // 25% of container's smallest dimension
	},

	// Position settings (center point positioning)
	POSITION: {
		// How far beyond container edges shapes can extend (as multiple of shape size)
		// 0.5 means shape center can be 50% of shape size beyond edge
		OVERFLOW_FACTOR: 0.5,
	},

	// Animation settings
	ANIMATION: {
		DURATION_MIN_SECONDS: 15,
		DURATION_MAX_SECONDS: 40,
		DELAY_MAX_SECONDS: 5,
		// Movement range as percentage of container
		MOVEMENT_RANGE_PERCENT: 15, // ±15% of container dimensions
	},

	// Appearance
	APPEARANCE: {
		OPACITY_LIGHT_THEME: 'opacity-20',
		OPACITY_DARK_THEME: 'opacity-30',
		BG_COLOR_RGBA: [192, 192, 192],
		BG_GRADIENT_OPACITY: 0.7,
	},
}

const flLogger = createLogger('FloatingShapes', {
	skipTimestamp: true,
})

export const randomInRange = (min: number, max: number) => {
	return Math.floor(Math.random() * (max - min + 1)) + min
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
				// Random size as percentage of container's smallest dimension
				const sizePercent =
					Math.random() * (CONFIG.SIZE.MAX_PERCENT - CONFIG.SIZE.MIN_PERCENT) +
					CONFIG.SIZE.MIN_PERCENT

				// Calculate position range based on size and overflow factor
				// Center can be positioned from -overflow to 100+overflow
				const halfSizePercent = sizePercent / 2
				const overflow = halfSizePercent * CONFIG.POSITION.OVERFLOW_FACTOR
				const minPosition = -overflow
				const maxPosition = 100 + overflow

				return {
					id: i,
					sizePercent,
					centerX: Math.random() * (maxPosition - minPosition) + minPosition,
					centerY: Math.random() * (maxPosition - minPosition) + minPosition,
					duration:
						Math.random() *
							(CONFIG.ANIMATION.DURATION_MAX_SECONDS -
								CONFIG.ANIMATION.DURATION_MIN_SECONDS) +
						CONFIG.ANIMATION.DURATION_MIN_SECONDS,
					delay: Math.random() * CONFIG.ANIMATION.DELAY_MAX_SECONDS,
					shape: CONFIG.SHAPE_TYPES[
						Math.floor(Math.random() * CONFIG.SHAPE_TYPES.length)
					] as string,
					moveXPercent:
						Math.random() * (CONFIG.ANIMATION.MOVEMENT_RANGE_PERCENT * 2) -
						CONFIG.ANIMATION.MOVEMENT_RANGE_PERCENT,
					moveYPercent:
						Math.random() * (CONFIG.ANIMATION.MOVEMENT_RANGE_PERCENT * 2) -
						CONFIG.ANIMATION.MOVEMENT_RANGE_PERCENT,
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

	flLogger.log('shape positions', {
		centerX: shapes.map((s) => s.centerX),
		centerY: shapes.map((s) => s.centerY),
		sizePercent: shapes.map((s) => s.sizePercent),
	})

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
							// Position based on center point
							left: `${shape.centerX}%`,
							top: `${shape.centerY}%`,
							transform: 'translate(-50%, -50%)', // Center the shape on the position
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
