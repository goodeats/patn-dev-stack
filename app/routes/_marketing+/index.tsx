import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { type Route } from './+types/index.ts' // Restored original Route import

export const meta: Route.MetaFunction = () => [
	{ title: 'Your Name | Modern Web Developer' },
]

// Define a type for skill categories
type SkillCategory = 'Frontend' | 'Backend' | 'DevOps' | 'Other'

// Define a type for individual skills
interface Skill {
	name: string
	category: SkillCategory
	icon?: string // Optional: for an icon representing the skill
	description?: string // Optional: a short description or proficiency level
}

// Define your skills here
const skills: Skill[] = [
	{ name: 'React', category: 'Frontend', description: 'Building dynamic UIs' },
	{
		name: 'Remix',
		category: 'Frontend',
		description: 'Full-stack web framework',
	},
	{
		name: 'Next.js',
		category: 'Frontend',
		description: 'React framework for production',
	},
	{
		name: 'TailwindCSS',
		category: 'Frontend',
		description: 'Utility-first CSS',
	},
	{ name: 'TypeScript', category: 'Frontend', description: 'Typed JavaScript' },
	{
		name: 'Node.js',
		category: 'Backend',
		description: 'Server-side JavaScript',
	},
	{
		name: 'PostgreSQL',
		category: 'Backend',
		description: 'Relational database',
	},
	{ name: 'Prisma', category: 'Backend', description: 'Modern ORM' },
	{ name: 'Docker', category: 'DevOps', description: 'Containerization' },
	{ name: 'AWS', category: 'DevOps', description: 'Cloud services' },
	{ name: 'Git & GitHub', category: 'DevOps', description: 'Version control' },
	{
		name: 'Agile Methodologies',
		category: 'Other',
		description: 'Iterative development',
	},
]

const skillCategories: SkillCategory[] = [
	'Frontend',
	'Backend',
	'DevOps',
	'Other',
]

export default function Index() {
	return (
		<main className="font-poppins bg-background text-foreground min-h-screen">
			{/* Hero Section */}
			<section className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-16 text-center">
				<div className="animate-slide-top [animation-fill-mode:backwards]">
					<h1
						data-heading
						className="text-5xl font-bold text-white md:text-6xl lg:text-7xl"
					>
						Hi, I'm [Your Name]
					</h1>
					<p
						data-paragraph
						className="mt-6 text-xl text-slate-300 md:text-2xl lg:text-3xl"
					>
						A Modern Full-Stack Web Developer
					</p>
					<p
						data-paragraph
						className="mt-4 max-w-2xl text-lg text-slate-400 md:text-xl"
					>
						I craft seamless and scalable web applications, transforming ideas
						into reality from frontend magic to backend robustness and reliable
						deployments.
					</p>
					<a
						href="#skills"
						className="mt-10 inline-block rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
						aria-label="View my skills"
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === 'Enter') (e.target as HTMLAnchorElement).click()
						}}
					>
						Discover My Expertise
					</a>
				</div>
			</section>

			{/* About Me Section - Placeholder */}
			<section id="about" className="px-4 py-20 text-center">
				<h2 className="text-4xl font-bold">About Me</h2>
				<p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
					[A brief introduction about yourself, your passion for web
					development, and your experience. Highlight what makes you unique.]
				</p>
			</section>

			{/* Skills Section */}
			<section
				id="skills"
				className="bg-slate-100 px-4 py-20 dark:bg-slate-800"
			>
				<div className="container mx-auto">
					<h2 className="mb-12 text-center text-4xl font-bold">My Skillset</h2>
					<div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
						{skillCategories.map((category) => (
							<div
								key={category}
								className="bg-background rounded-lg p-6 shadow-lg dark:bg-slate-700"
							>
								<h3 className="mb-4 text-2xl font-semibold text-blue-600 dark:text-blue-400">
									{category}
								</h3>
								<ul className="space-y-3">
									{skills
										.filter((skill) => skill.category === category)
										.map((skill) => (
											<li key={skill.name} className="flex items-center">
												{/* Basic dot for now, can be replaced with icons */}
												<span className="mr-3 h-2 w-2 rounded-full bg-blue-500"></span>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<span className="cursor-default">
																{skill.name}
															</span>
														</TooltipTrigger>
														{skill.description && (
															<TooltipContent>
																<p>{skill.description}</p>
															</TooltipContent>
														)}
													</Tooltip>
												</TooltipProvider>
											</li>
										))}
								</ul>
							</div>
						))}
					</div>
					<p className="text-muted-foreground mt-12 text-center text-lg">
						...and I'm always eager to learn new technologies and methodologies
						to build even better solutions!
					</p>
				</div>
			</section>

			{/* Projects Section - Placeholder */}
			<section id="projects" className="px-4 py-20">
				<div className="container mx-auto">
					<h2 className="mb-12 text-center text-4xl font-bold">
						Featured Projects
					</h2>
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						{/* Example Project Card - Repeat for each project */}
						<div className="transform rounded-lg bg-slate-50 p-6 shadow-lg transition duration-300 hover:scale-105 dark:bg-slate-800">
							<h3 className="mb-3 text-2xl font-semibold text-blue-600 dark:text-blue-400">
								[Project Title 1]
							</h3>
							<p className="text-muted-foreground mb-4">
								[Brief description of the project, its purpose, and your role.]
							</p>
							<p className="mb-4 text-sm">
								<span className="font-semibold">Technologies:</span> [List key
								technologies used, e.g., React, Node.js, TailwindCSS]
							</p>
							<div className="flex space-x-4">
								<a
									href="#"
									className="text-blue-500 hover:underline"
									aria-label="View project demo for [Project Title 1]"
									tabIndex={0}
								>
									Live Demo
								</a>
								<a
									href="#"
									className="text-blue-500 hover:underline"
									aria-label="View source code for [Project Title 1] on GitHub"
									tabIndex={0}
								>
									GitHub
								</a>
							</div>
						</div>
						{/* Add more project cards here */}
						<div className="transform rounded-lg bg-slate-50 p-6 shadow-lg transition duration-300 hover:scale-105 dark:bg-slate-800">
							<h3 className="mb-3 text-2xl font-semibold text-blue-600 dark:text-blue-400">
								[Project Title 2]
							</h3>
							<p className="text-muted-foreground mb-4">
								[Brief description of the project, its purpose, and your role.]
							</p>
							<p className="mb-4 text-sm">
								<span className="font-semibold">Technologies:</span> [List key
								technologies used]
							</p>
							<div className="flex space-x-4">
								<a
									href="#"
									className="text-blue-500 hover:underline"
									aria-label="View project demo for [Project Title 2]"
									tabIndex={0}
								>
									Live Demo
								</a>
								<a
									href="#"
									className="text-blue-500 hover:underline"
									aria-label="View source code for [Project Title 2] on GitHub"
									tabIndex={0}
								>
									GitHub
								</a>
							</div>
						</div>
					</div>
					<div className="mt-12 text-center">
						<a
							href="/projects" // Link to a dedicated projects page if you have many
							className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
							aria-label="View all my projects"
							tabIndex={0}
						>
							See All Projects
						</a>
					</div>
				</div>
			</section>

			{/* Call to Action / Contact Section - Placeholder */}
			<section id="contact" className="bg-slate-900 px-4 py-20 text-white">
				<div className="container mx-auto text-center">
					<h2 className="text-4xl font-bold">
						Let's Build Something Amazing Together!
					</h2>
					<p className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
						Have a project in mind, a question, or just want to connect? I'd
						love to hear from you.
					</p>
					<div className="mt-10 space-x-4">
						<a
							href="mailto:your.email@example.com"
							className="rounded-lg bg-green-500 px-6 py-3 text-lg font-semibold text-white transition hover:bg-green-600"
							aria-label="Send me an email"
							tabIndex={0}
						>
							Email Me
						</a>
						<a
							href="https://www.linkedin.com/in/yourprofile/" // Replace with your LinkedIn URL
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-lg bg-sky-500 px-6 py-3 text-lg font-semibold text-white transition hover:bg-sky-600"
							aria-label="Connect with me on LinkedIn"
							tabIndex={0}
						>
							LinkedIn
						</a>
						<a
							href="https://github.com/yourusername" // Replace with your GitHub URL
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-lg bg-gray-700 px-6 py-3 text-lg font-semibold text-white transition hover:bg-gray-600"
							aria-label="View my work on GitHub"
							tabIndex={0}
						>
							GitHub
						</a>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-slate-950 px-4 py-8 text-center text-slate-400">
				<p>
					&copy; {new Date().getFullYear()} [Your Name]. All rights reserved.
				</p>
				<p className="text-sm">
					Built with{' '}
					<a
						href="https://remix.run"
						className="hover:underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						Remix
					</a>{' '}
					&{' '}
					<a
						href="https://tailwindcss.com"
						className="hover:underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						Tailwind CSS
					</a>
					.
				</p>
			</footer>
		</main>
	)
}

// Helper component for skill icons (optional)
// You can expand this with actual SVG icons or an icon library
// const SkillIcon = ({ iconName }: { iconName?: string }) => {
// if (!iconName) return <span className="mr-3 h-2 w-2 rounded-full bg-blue-500"></span>;
// Example:
// if (iconName === 'React') return <ReactIcon className="mr-2 h-5 w-5 text-blue-500" />;
// return <span className="mr-3 h-2 w-2 rounded-full bg-gray-400"></span>; // Default placeholder
// };
