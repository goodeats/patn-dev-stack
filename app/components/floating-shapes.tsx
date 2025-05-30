import { useState, useEffect } from 'react'
import { useTheme } from '#app/routes/resources+/theme-switch.tsx'

const SHAPE_COUNT = 10

interface ShapeProps {
	id: number
	size: number
	initialX: number
	initialY: number
	duration: number
	delay: number
	shape: string
	moveX: number
	moveY: number
}

export function FloatingShapes() {
	const theme = useTheme()
	const [shapes, setShapes] = useState<ShapeProps[]>([])

	useEffect(() => {
		// const shapeList = ['circle', 'square', 'triangle']
		const shapeList = ['square']

		// Size constants
		const MIN_SIZE = 550
		const SIZE_RANGE = 150 // Results in 150-300px shapes

		// Position constants (as percentage of container)
		const MAX_INITIAL_POSITION = 100

		// Animation constants
		const MIN_DURATION = 15
		const DURATION_RANGE = 25 // Results in 15-40s duration
		const MAX_DELAY = 5

		// Movement constants
		const MOVEMENT_RANGE = 150 // Total range of 150px
		const HALF_MOVEMENT = MOVEMENT_RANGE / 2 // +/- 75px

		// Generate random shapes with different properties only on the client
		const generateShapes = () =>
			Array.from({ length: SHAPE_COUNT }, (_, i) => ({
				id: i,
				size: Math.random() * SIZE_RANGE + MIN_SIZE,
				initialX: Math.random() * MAX_INITIAL_POSITION,
				initialY: Math.random() * MAX_INITIAL_POSITION,
				duration: Math.random() * DURATION_RANGE + MIN_DURATION,
				delay: Math.random() * MAX_DELAY,
				shape: shapeList[
					Math.floor(Math.random() * shapeList.length)
				] as string,
				moveX: Math.random() * MOVEMENT_RANGE - HALF_MOVEMENT,
				moveY: Math.random() * MOVEMENT_RANGE - HALF_MOVEMENT,
			}))
		setShapes(generateShapes())
	}, [])

	if (!shapes.length) {
		return null
	}

	// Determine opacity based on the current theme
	// For light theme, a slightly lower opacity might be better against a lighter gradient part
	// For dark theme, a slightly higher opacity can make them pop more against a darker background
	const shapeOpacityClass = theme === 'light' ? 'opacity-20' : 'opacity-30' // Increased opacity significantly

	const bgColorRgba = [192, 192, 192]
	const bgColorGradientOpacity = 0.7

	return (
		<div
			id="floating-shapes"
			className="pointer-events-none absolute inset-0 overflow-hidden"
		>
			{shapes.map((shape) => (
				<div
					key={shape.id}
					// The base animation and shape styles are applied here.
					// The color (from --primary) and opacity (from shapeOpacityClass) define visibility.
					className={`absolute animate-[float-shape_var(--duration)_ease-in-out_infinite] ${shapeOpacityClass} ${
						shape.shape === 'circle'
							? 'rounded-full'
							: shape.shape === 'triangle'
								? 'clip-path-triangle'
								: 'rounded-lg'
					}`}
					style={
						{
							width: `${shape.size}px`,
							height: `${shape.size}px`,
							left: `${shape.initialX}%`,
							top: `${shape.initialY}%`,
							// The background uses the --primary CSS variable for color, which is theme-aware by definition in tailwind.css
							// background: `linear-gradient(135deg, silver 0%, rgba(192, 192, 192, 0.7) 100%)`, // Using gold color with 70% opacity for gradient
							background: `linear-gradient(135deg, rgba(${bgColorRgba.join(
								',',
							)}, 1) 0%, rgba(${bgColorRgba.join(',')}, ${bgColorGradientOpacity}) 100%)`, // Slightly increased gradient visibility too
							// background: `linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.7) 100%)`, // Slightly increased gradient visibility too
							'--duration': `${shape.duration}s`,
							'--move-x': `${shape.moveX}px`,
							'--move-y': `${shape.moveY}px`,
							animationDelay: `${shape.delay}s`,
						} as React.CSSProperties
					}
				/>
			))}
		</div>
	)
}
