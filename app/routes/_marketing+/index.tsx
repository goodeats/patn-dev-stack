import { Button } from '#app/components/ui/button'
import { Icon, type IconName } from '#app/components/ui/icon'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { type Route } from './+types/index.ts'

export const meta: Route.MetaFunction = () => [{ title: 'Pat N | Web Dev' }]

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
			</div>
		</section>
	)
}

function AboutSection() {
	return (
		<section id="about" className="px-4 py-20 text-center">
			<h2 className="text-4xl font-bold">About Me</h2>
			<p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-left text-lg">
				I am a senior full-stack software engineer with 10+ years of experience.
				I have launched and/or contributed to projects that demonstrate AI
				technology, messaging platforms, health tech, and e-commerce. I have
				well-rounded expertise in frontend, backend, deployment, and everything
				in between. I also enjoy growing my skills to keep up with current
				trends like using LLMs for coding tools.
			</p>
			<p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-left text-lg">
				I grew up in Maine and currently live in Brooklyn so I enjoy nature and
				city life equally! For fun I like to follow professional sports, enjoy
				the discourse on Twitter, play video games, discover new music to listen
				to.
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
	liveDemoUrl,
	sourceCodeUrl,
}: {
	title: string
	description: string
	technologies: string
	liveDemoUrl?: string
	sourceCodeUrl?: string
}) {
	return (
		<div className="bg-card transform rounded-lg p-6 shadow-lg transition duration-300 hover:scale-105">
			<h3 className="text-primary mb-3 text-2xl font-semibold">{title}</h3>
			<p className="text-muted-foreground mb-4">{description}</p>
			<p className="mb-4 text-sm">
				<span className="font-semibold">Technologies:</span> {technologies}
			</p>
			<div className="flex space-x-4">
				{liveDemoUrl && (
					<Button asChild>
						<a
							href={liveDemoUrl}
							className="text-primary hover:underline"
							aria-label={`View project demo for ${title}`}
							tabIndex={0}
						>
							Live Demo
						</a>
					</Button>
				)}
				{sourceCodeUrl && (
					<Button asChild>
						<a
							href={sourceCodeUrl}
							className="text-primary hover:underline"
							aria-label={`View source code for ${title} on GitHub`}
							tabIndex={0}
						>
							GitHub
						</a>
					</Button>
				)}
			</div>
		</div>
	)
}

function ProjectsSection() {
	return (
		<section id="projects" className="bg-muted px-4 py-20">
			<div className="container mx-auto">
				<h2 className="mb-12 text-center text-4xl font-bold">
					Featured Projects
				</h2>
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					<ProjectCard
						title="PPPAAATTT"
						description="A fun, creative studio, closely resembling Figma, for assembling designs on a canvas."
						technologies="Remix, TailwindCSS, SQLite, Fly.io"
						liveDemoUrl="https://pppaaattt.xyz"
						sourceCodeUrl="https://github.com/goodeats/epic-pppaaattt.xyz"
					/>
					<ProjectCard
						title="Choros App"
						description="A messaging platform for planning or finding local activities and then matchmaking groups to meet up. This app is currently in a private beta, but
            I would be happy to give a personal demo."
						technologies="Remix, TailwindCSS, SQLite, Fly.io, PWA, XState"
					/>
				</div>
			</div>
		</section>
	)
}

function ContactSection() {
	const socialLinks = [
		{
			href: 'mailto:your.email@example.com',
			icon: 'envelope-closed',
			label: 'Send me an email',
			text: 'Email Me',
		},
		{
			href: 'https://www.linkedin.com/in/yourprofile/',
			icon: 'linkedin-logo',
			label: 'Connect with me on LinkedIn',
			text: 'LinkedIn',
		},
		{
			href: 'https://github.com/yourusername',
			icon: 'github-logo',
			label: 'View my work on GitHub',
			text: 'GitHub',
		},
		{
			href: 'https://twitter.com/yourusername',
			icon: 'twitter-logo',
			label: 'Follow me on Twitter',
			text: 'Twitter',
		},
		{
			href: 'https://instagram.com/yourusername',
			icon: 'instagram-logo',
			label: 'Follow me on Instagram',
			text: 'Instagram',
		},
	] as const

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
				<div className="mt-10 flex flex-wrap items-center justify-center gap-4">
					{socialLinks.map(({ href, icon, label, text }) => (
						<Button key={href} asChild>
							<a
								href={href}
								target={href.startsWith('mailto:') ? undefined : '_blank'}
								rel={
									href.startsWith('mailto:') ? undefined : 'noopener noreferrer'
								}
								className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-lg font-semibold transition"
								aria-label={label}
								tabIndex={0}
							>
								<Icon name={icon as IconName} />
								<span>{text}</span>
							</a>
						</Button>
					))}
				</div>
			</div>
		</section>
	)
}

export default function Index() {
	return (
		<main className="font-poppins bg-background text-foreground min-h-screen">
			<HeroSection />
			<AboutSection />
			<SkillsSection />
			<ProjectsSection />
			<ContactSection />
		</main>
	)
}
