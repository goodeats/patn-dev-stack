import { ProjectLink } from './external-icon-link'
import { Logo } from './logo'

export function Footer() {
	return (
		<div className="container flex justify-between pb-5">
			<Logo />
			<div className="flex items-center">
				<span>&copy; {new Date().getFullYear()} patn.dev</span>
				<ProjectLink />
			</div>
		</div>
	)
}
