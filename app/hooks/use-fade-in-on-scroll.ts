import { useRef, useState, useEffect } from 'react'

export function useFadeInOnScroll() {
	const ref = useRef<HTMLDivElement>(null)
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0]
				if (entry && entry.isIntersecting) {
					setIsVisible(true)
					observer.unobserve(entry.target)
				}
			},
			{ threshold: 0.1 },
		)

		if (ref.current) {
			observer.observe(ref.current)
		}

		return () => {
			if (ref.current) {
				// eslint-disable-next-line react-hooks/exhaustive-deps
				observer.unobserve(ref.current)
			}
		}
	}, [])

	return { ref, isVisible }
}
