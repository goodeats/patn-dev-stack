import { useEffect } from 'react'
import { scan } from 'react-scan'

export const useReactScan = (enabled: boolean) => {
	useEffect(() => {
		if (!enabled) return

		scan({
			enabled: true,
		})
	}, [enabled])
}
