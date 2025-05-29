import { Link } from 'react-router'

export function Logo() {
	return (
		<Link to="/" className="group grid leading-snug">
			<span className="font-light transition group-hover:-translate-x-1">
				patn
			</span>
			<span className="text-primary font-bold transition group-hover:translate-x-1">
				dev
			</span>
		</Link>
	)
}
