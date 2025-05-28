import { Logo } from './logo'

export function Footer() {
	return (
		<div className="container flex justify-between pb-5">
			<Logo />
			<p>&copy; {new Date().getFullYear()} patn.dev.</p>
		</div>
	)
}
