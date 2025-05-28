import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { type Route } from './+types/index.ts'

// Types
type SkillCategory = 'Frontend' | 'Backend' | 'DevOps' | 'Other'

interface Skill {
	name: string
	category: SkillCategory
	icon?: string
	description?: string
}

// Data
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

// Components
function HeroSection() {
	return (
		<section className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-gradient-to-br px-4 py-16 text-center">
			<div className="animate-slide-top [animation-fill-mode:backwards]">
				<h1
					data-heading
					className="text-foreground text-5xl font-bold md:text-6xl lg:text-7xl"
				>
					Hi, I'm Pat
				</h1>
				<p
					data-paragraph
					className="text-muted-foreground mt-6 text-xl md:text-2xl lg:text-3xl"
				>
					A Modern Full-Stack Web Developer
				</p>
				<p
					data-paragraph
					className="text-muted-foreground mt-4 max-w-2xl text-lg md:text-xl"
				>
					I craft intuitive user experiences, interactive layouts, and APIs to
					transform ideas into web applications.
				</p>
				<a
					href="#skills"
					className="bg-primary text-primary-foreground hover:bg-primary/90 mt-10 inline-block rounded-lg px-8 py-4 text-lg font-semibold transition"
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
	)
}

function AboutSection() {
	return (
		<section id="about" className="px-4 py-20 text-left">
			<h2 className="text-4xl font-bold">About Me</h2>
			<p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
				I am a senior full-stack software engineer with 10+ years of experience.
				I have launched and/or contributed to projects that demonstrate AI
				technology, messaging platforms, health tech, and e-commerce. I have
				well-rounded expertise in frontend, backend, deployment, and everything
				in between. I also enjoy growing my skills to keep up with current
				trends like using LLMs for coding tools.
			</p>
			<p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
				I grew up in Maine and currently live in Brooklyn so I enjoy nature and
				city life equally! For fun I like to follow professional sports, play
				video games, and discovering new music to listen to.
			</p>
		</section>
	)
}

function SkillCard({ skill }: { skill: Skill }) {
	return (
		<li key={skill.name} className="flex items-center">
			<span className="bg-primary mr-3 h-2 w-2 rounded-full"></span>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="cursor-default">{skill.name}</span>
					</TooltipTrigger>
					{skill.description && (
						<TooltipContent>
							<p>{skill.description}</p>
						</TooltipContent>
					)}
				</Tooltip>
			</TooltipProvider>
		</li>
	)
}

function SkillsSection() {
	return (
		<section id="skills" className="bg-muted px-4 py-20">
			<div className="container mx-auto">
				<h2 className="mb-12 text-center text-4xl font-bold">My Skillset</h2>
				<div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
					{skillCategories.map((category) => (
						<div key={category} className="bg-card rounded-lg p-6 shadow-lg">
							<h3 className="text-primary mb-4 text-2xl font-semibold">
								{category}
							</h3>
							<ul className="space-y-3">
								{skills
									.filter((skill) => skill.category === category)
									.map((skill) => (
										<SkillCard key={skill.name} skill={skill} />
									))}
							</ul>
						</div>
					))}
				</div>
				<p className="text-muted-foreground mt-12 text-center text-lg">
					...and I'm always eager to learn new technologies and methodologies to
					build even better solutions!
				</p>
			</div>
		</section>
	)
}

function ProjectCard({
	title,
	description,
	technologies,
}: {
	title: string
	description: string
	technologies: string
}) {
	return (
		<div className="bg-card transform rounded-lg p-6 shadow-lg transition duration-300 hover:scale-105">
			<h3 className="text-primary mb-3 text-2xl font-semibold">{title}</h3>
			<p className="text-muted-foreground mb-4">{description}</p>
			<p className="mb-4 text-sm">
				<span className="font-semibold">Technologies:</span> {technologies}
			</p>
			<div className="flex space-x-4">
				<a
					href="#"
					className="text-primary hover:underline"
					aria-label={`View project demo for ${title}`}
					tabIndex={0}
				>
					Live Demo
				</a>
				<a
					href="#"
					className="text-primary hover:underline"
					aria-label={`View source code for ${title} on GitHub`}
					tabIndex={0}
				>
					GitHub
				</a>
			</div>
		</div>
	)
}

function ProjectsSection() {
	return (
		<section id="projects" className="px-4 py-20">
			<div className="container mx-auto">
				<h2 className="mb-12 text-center text-4xl font-bold">
					Featured Projects
				</h2>
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					<ProjectCard
						title="[Project Title 1]"
						description="[Brief description of the project, its purpose, and your role.]"
						technologies="React, Node.js, TailwindCSS"
					/>
					<ProjectCard
						title="[Project Title 2]"
						description="[Brief description of the project, its purpose, and your role.]"
						technologies="[List key technologies used]"
					/>
				</div>
				<div className="mt-12 text-center">
					<a
						href="/projects"
						className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 text-lg font-semibold transition"
						aria-label="View all my projects"
						tabIndex={0}
					>
						See All Projects
					</a>
				</div>
			</div>
		</section>
	)
}

function ContactSection() {
	return (
		<section id="contact" className="bg-background text-foreground px-4 py-20">
			<div className="container mx-auto text-center">
				<h2 className="text-4xl font-bold">
					Let's Build Something Amazing Together!
				</h2>
				<p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg">
					Have a project in mind, a question, or just want to connect? I'd love
					to hear from you.
				</p>
				<div className="mt-10 space-x-4">
					<a
						href="mailto:your.email@example.com"
						className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 text-lg font-semibold transition"
						aria-label="Send me an email"
						tabIndex={0}
					>
						Email Me
					</a>
					<a
						href="https://www.linkedin.com/in/yourprofile/"
						target="_blank"
						rel="noopener noreferrer"
						className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg px-6 py-3 text-lg font-semibold transition"
						aria-label="Connect with me on LinkedIn"
						tabIndex={0}
					>
						LinkedIn
					</a>
					<a
						href="https://github.com/yourusername"
						target="_blank"
						rel="noopener noreferrer"
						className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg px-6 py-3 text-lg font-semibold transition"
						aria-label="View my work on GitHub"
						tabIndex={0}
					>
						GitHub
					</a>
				</div>
			</div>
		</section>
	)
}

function Footer() {
	return (
		<footer className="bg-muted text-muted-foreground px-4 py-8 text-center">
			<p>&copy; {new Date().getFullYear()} patn.dev. All rights reserved.</p>
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
	)
}

export const meta: Route.MetaFunction = () => [{ title: 'Pat N | Web Dev' }]

export default function Index() {
	return (
		<main className="font-poppins bg-background text-foreground min-h-screen">
			<HeroSection />
			<AboutSection />
			<SkillsSection />
			<ProjectsSection />
			<ContactSection />
			<Footer />
		</main>
	)
}
