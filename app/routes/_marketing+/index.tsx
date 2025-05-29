import { type Skill, type SocialLink } from '@prisma/client'
import { ExternalLink } from '#app/components/external-link.tsx'
import { MarketingCard, MarketingSection } from '#app/components/marketing.tsx'
import { ScrollNavLinks } from '#app/components/scroll-nav-links.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button'
import { CardContent, CardFooter } from '#app/components/ui/card.tsx'
import { Icon, type IconName } from '#app/components/ui/icon'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { useFadeInOnScroll } from '#app/hooks/use-fade-in-on-scroll.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Info, type Route } from './+types/index.ts'

export const meta: Route.MetaFunction = () => [{ title: 'Pat N | Web Dev' }]

export async function loader({}: Route.LoaderArgs) {
	const professionalAboutMe = await prisma.aboutMe.findFirst({
		where: {
			isPublished: true,
			aboutMeCategory: {
				name: 'Professional',
			},
		},
		select: {
			content: true,
		},
	})

	const personalAboutMe = await prisma.aboutMe.findFirst({
		where: {
			isPublished: true,
			aboutMeCategory: {
				name: 'Personal',
			},
		},
		select: {
			content: true,
		},
	})

	const skillCategories = await prisma.skillCategory.findMany({
		where: {
			isPublished: true,
		},
		select: {
			name: true,
			skills: {
				select: {
					name: true,
					description: true,
				},
			},
		},
	})

	const projects = await prisma.project.findMany({
		where: {
			isPublished: true,
		},
		select: {
			title: true,
			description: true,
			liveDemoUrl: true,
			sourceCodeUrl: true,
			comments: true,
			skills: {
				select: {
					name: true,
					description: true,
				},
			},
		},
	})

	const socialLinks = await prisma.socialLink.findMany({
		where: {
			isPublished: true,
		},
		select: {
			href: true,
			icon: true,
			label: true,
			text: true,
		},
	})

	return {
		skillCategories,
		projects,
		socialLinks,
		professionalAboutMe,
		personalAboutMe,
	}
}

function HeroSection() {
	const { ref } = useFadeInOnScroll()
	return (
		<section
			ref={ref}
			className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-gradient-to-br px-4 py-16 text-center"
		>
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
				<div className="mt-10 flex flex-wrap items-center justify-center gap-4">
					<ScrollNavLinks
						navItems={[
							{ href: '#about', label: 'About' },
							{ href: '#skills', label: 'Skills' },
							{ href: '#projects', label: 'Projects' },
							{ href: '#contact', label: 'Contact' },
						]}
					/>
				</div>
			</div>
		</section>
	)
}

function AboutSection({
	professionalAboutMe,
	personalAboutMe,
}: {
	professionalAboutMe: Info['loaderData']['professionalAboutMe']
	personalAboutMe: Info['loaderData']['personalAboutMe']
}) {
	return (
		<MarketingSection
			sectionId="about"
			className="flex flex-col gap-4 text-center"
		>
			<h2 className="text-4xl font-bold">About Me</h2>
			<div className="mx-auto flex flex-col items-center">
				{professionalAboutMe?.content && (
					<p className="text-muted-foreground mt-6 max-w-xl text-left text-lg">
						{professionalAboutMe.content}
					</p>
				)}
				{personalAboutMe?.content && (
					<p className="text-muted-foreground mt-6 max-w-xl text-left text-lg">
						{personalAboutMe.content}
					</p>
				)}
			</div>
			{/* <div className="mx-auto items-center text-center">
				<p className="text-muted-foreground mx-auto mt-6 max-w-xl text-center text-lg">
					I am continuously learning and growing my skillset!
				</p>
			</div> */}
		</MarketingSection>
	)
}

function SkillBadge({ skill }: { skill: Pick<Skill, 'name' | 'description'> }) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Badge variant="secondary" className="cursor-pointer">
						{skill.name}
					</Badge>
				</TooltipTrigger>
				{skill.description && (
					<TooltipContent>
						<p>{skill.description}</p>
					</TooltipContent>
				)}
			</Tooltip>
		</TooltipProvider>
	)
}

function SkillCard({
	category,
}: {
	category: Info['loaderData']['skillCategories'][number]
}) {
	return (
		<MarketingCard title={category.name} className="text-left">
			<CardContent className="flex flex-wrap gap-2">
				{category.skills.map((skill) => (
					<SkillBadge key={skill.name} skill={skill} />
				))}
			</CardContent>
		</MarketingCard>
	)
}

function SkillsSection({
	skillCategories,
}: {
	skillCategories: Info['loaderData']['skillCategories']
}) {
	return (
		<MarketingSection sectionId="skills">
			<h2 className="mb-12 text-center text-4xl font-bold">My Skillset</h2>
			<div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
				{skillCategories.map((skillCategory) => (
					<SkillCard key={skillCategory.name} category={skillCategory} />
				))}
			</div>

			<div className="mx-auto items-center text-center">
				<p className="text-muted-foreground mx-auto mt-6 max-w-xl text-center text-lg">
					I am continuously learning and growing my skillset!
				</p>
			</div>
		</MarketingSection>
	)
}

function ProjectCard({
	project,
}: {
	project: Info['loaderData']['projects'][number]
}) {
	const { title, description, skills, liveDemoUrl, sourceCodeUrl, comments } =
		project
	return (
		<MarketingCard
			title={title}
			description={description}
			className="text-left"
		>
			<CardContent className="flex-1">
				<p className="mb-4 text-sm">
					<span className="font-semibold">Technologies:</span>
				</p>
				<div className="flex flex-wrap gap-2">
					{skills.map((skill) => (
						<SkillBadge key={skill.name} skill={skill} />
					))}
				</div>
			</CardContent>
			<CardFooter className="gap-4">
				{liveDemoUrl && (
					<ExternalLink
						href={liveDemoUrl}
						ariaLabel={`View project demo for ${title}`}
					>
						Live Demo
					</ExternalLink>
				)}
				{sourceCodeUrl && (
					<ExternalLink
						href={sourceCodeUrl}
						ariaLabel={`View source code for ${title} on GitHub`}
					>
						GitHub
					</ExternalLink>
				)}
				{comments && (
					<p className="text-muted-foreground mt-4 text-sm">{comments}</p>
				)}
			</CardFooter>
		</MarketingCard>
	)
}

function ProjectsSection({
	projects,
}: {
	projects: Info['loaderData']['projects']
}) {
	return (
		<MarketingSection sectionId="projects">
			<h2 className="mb-12 text-center text-4xl font-bold">
				Featured Projects
			</h2>
			<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				{projects.map((project) => (
					<ProjectCard key={project.title} project={project} />
				))}
			</div>
		</MarketingSection>
	)
}

function ContactSection({
	socialLinks,
}: {
	socialLinks: Pick<SocialLink, 'href' | 'icon' | 'label' | 'text'>[]
}) {
	return (
		<MarketingSection
			sectionId="contact"
			className="bg-background text-foreground"
		>
			<h2 className="text-4xl font-bold">
				Let's Build Something Amazing Together!
			</h2>
			<p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg">
				Have a project in mind, a question, or just want to connect? I'd love to
				hear from you.
			</p>
			<div className="mt-10 flex flex-wrap items-center justify-center gap-4">
				<TooltipProvider>
					{socialLinks.map(({ href, icon, label, text }) => (
						<Tooltip key={href}>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									asChild
									className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground transition-colors"
								>
									<a
										href={href}
										target={href.startsWith('mailto:') ? undefined : '_blank'}
										rel={
											href.startsWith('mailto:')
												? undefined
												: 'noopener noreferrer'
										}
										aria-label={label}
										tabIndex={0}
									>
										<Icon name={icon as IconName} size="lg" />
										<span className="sr-only">{text}</span>
									</a>
								</Button>
							</TooltipTrigger>
							<TooltipContent>{text}</TooltipContent>
						</Tooltip>
					))}
				</TooltipProvider>
			</div>
		</MarketingSection>
	)
}

export default function Index({ loaderData }: Route.ComponentProps) {
	const {
		skillCategories,
		projects,
		socialLinks,
		professionalAboutMe,
		personalAboutMe,
	} = loaderData

	return (
		<main className="font-poppins bg-background text-foreground min-h-screen">
			<HeroSection />
			<AboutSection
				professionalAboutMe={professionalAboutMe}
				personalAboutMe={personalAboutMe}
			/>
			<SkillsSection skillCategories={skillCategories} />
			<ProjectsSection projects={projects} />
			<ContactSection socialLinks={socialLinks} />
		</main>
	)
}
