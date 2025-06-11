import { type Skill, type SocialLink } from '@prisma/client'
import { ExternalIconLink } from '#app/components/external-icon-link.tsx'
import { ExternalLinkButton } from '#app/components/external-link.tsx'
import { FloatingShapes } from '#app/components/floating-shapes.tsx'
import { Footer } from '#app/components/footer.tsx'
import { Header } from '#app/components/header.tsx'
import {
	MarketingCard,
	MarketingSection,
	MarketingSectionContent,
	MarketingSectionHeader,
	MarketingSectionParagraph,
} from '#app/components/marketing.tsx'
import { ScrollNavLinks } from '#app/components/scroll-nav-links.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import { CardContent, CardFooter } from '#app/components/ui/card.tsx'
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
				orderBy: {
					name: 'asc',
				},
			},
		},
		orderBy: {
			name: 'asc',
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
		orderBy: {
			createdAt: 'desc',
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
		orderBy: {
			createdAt: 'asc',
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
			className="from-background to-muted relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br px-4 py-16 text-center"
		>
			<FloatingShapes />
			<div className="animate-slide-top relative z-10 [animation-fill-mode:backwards]">
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
					A Full-Stack Web Developer
				</p>
				<p
					data-paragraph
					className="text-muted-foreground mt-4 max-w-2xl text-lg md:text-xl"
				>
					I design and engineer web applications that deliver real value.
				</p>
				<p
					data-paragraph
					className="text-muted-foreground mt-4 max-w-2xl text-lg md:text-xl"
				>
					Fast. Scalable. Built to grow.
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
			<MarketingSectionHeader>About Me</MarketingSectionHeader>
			<MarketingSectionContent>
				{professionalAboutMe?.content && (
					<MarketingSectionParagraph>
						{professionalAboutMe.content}
					</MarketingSectionParagraph>
				)}
				{personalAboutMe?.content && (
					<MarketingSectionParagraph>
						{personalAboutMe.content}
					</MarketingSectionParagraph>
				)}
			</MarketingSectionContent>
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
			<MarketingSectionHeader>My Skillset</MarketingSectionHeader>
			<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
				{skillCategories.map((skillCategory) => (
					<SkillCard key={skillCategory.name} category={skillCategory} />
				))}
			</div>

			<MarketingSectionContent className="mt-8">
				<MarketingSectionParagraph>
					I am continuously learning and growing my skillset!
				</MarketingSectionParagraph>
			</MarketingSectionContent>
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
			description={description ?? ''}
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
					<ExternalLinkButton
						href={liveDemoUrl}
						ariaLabel={`View project demo for ${title}`}
					>
						Live Demo
					</ExternalLinkButton>
				)}
				{sourceCodeUrl && (
					<ExternalLinkButton
						href={sourceCodeUrl}
						ariaLabel={`View source code for ${title} on GitHub`}
					>
						GitHub
					</ExternalLinkButton>
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
			<MarketingSectionHeader>Featured Projects</MarketingSectionHeader>
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
			<MarketingSectionHeader>
				Let's Build Something Amazing Together!
			</MarketingSectionHeader>
			<MarketingSectionContent className="gap-2">
				<MarketingSectionParagraph>
					Have a project in mind, a question, or just want to connect?
				</MarketingSectionParagraph>
				<MarketingSectionParagraph>
					I'd love to hear from you!
				</MarketingSectionParagraph>
			</MarketingSectionContent>

			<div className="mt-10 flex flex-wrap items-center justify-center gap-4">
				{socialLinks.map((socialLink) => (
					<ExternalIconLink key={socialLink.href} iconLink={socialLink} />
				))}
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
			<Header />

			<HeroSection />
			<AboutSection
				professionalAboutMe={professionalAboutMe}
				personalAboutMe={personalAboutMe}
			/>
			<SkillsSection skillCategories={skillCategories} />
			<ProjectsSection projects={projects} />
			<ContactSection socialLinks={socialLinks} />

			<Footer />
		</main>
	)
}
