import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB } from '#app/utils/providers/constants'
import {
	createPassword,
	createUser,
	getNoteImages,
	getUserImages,
} from '#tests/db-utils.ts'
import { insertGitHubUser } from '#tests/mocks/github.ts'

async function seed() {
	console.log('🌱 Seeding...')
	console.time(`🌱 Database has been seeded`)

	const totalUsers = 0
	console.time(`👤 Created ${totalUsers} users...`)
	const noteImages = await getNoteImages()
	const userImages = await getUserImages()

	for (let index = 0; index < totalUsers; index++) {
		const userData = createUser()
		const user = await prisma.user.create({
			select: { id: true },
			data: {
				...userData,
				password: { create: createPassword(userData.username) },
				roles: { connect: { name: 'user' } },
			},
		})

		// Upload user profile image
		const userImage = userImages[index % userImages.length]
		if (userImage) {
			await prisma.userImage.create({
				data: {
					userId: user.id,
					objectKey: userImage.objectKey,
				},
			})
		}

		// Create notes with images
		const notesCount = faker.number.int({ min: 1, max: 3 })
		for (let noteIndex = 0; noteIndex < notesCount; noteIndex++) {
			const note = await prisma.note.create({
				select: { id: true },
				data: {
					title: faker.lorem.sentence(),
					content: faker.lorem.paragraphs(),
					ownerId: user.id,
				},
			})

			// Add images to note
			const noteImageCount = faker.number.int({ min: 1, max: 3 })
			for (let imageIndex = 0; imageIndex < noteImageCount; imageIndex++) {
				const imgNumber = faker.number.int({ min: 0, max: 9 })
				const noteImage = noteImages[imgNumber]
				if (noteImage) {
					await prisma.noteImage.create({
						data: {
							noteId: note.id,
							altText: noteImage.altText,
							objectKey: noteImage.objectKey,
						},
					})
				}
			}
		}
	}
	console.timeEnd(`👤 Created ${totalUsers} users...`)

	console.time(`🐨 Created admin user "pat"`)

	const kodyImages = {
		kodyUser: { objectKey: 'user/pat.png' },
		cuteKoala: {
			altText: 'an adorable koala cartoon illustration',
			objectKey: 'pat-notes/cute-koala.png',
		},
		koalaEating: {
			altText: 'a cartoon illustration of a koala in a tree eating',
			objectKey: 'pat-notes/koala-eating.png',
		},
		koalaCuddle: {
			altText: 'a cartoon illustration of koalas cuddling',
			objectKey: 'pat-notes/koala-cuddle.png',
		},
		mountain: {
			altText: 'a beautiful mountain covered in snow',
			objectKey: 'pat-notes/mountain.png',
		},
		koalaCoder: {
			altText: 'a koala coding at the computer',
			objectKey: 'pat-notes/koala-coder.png',
		},
		koalaMentor: {
			altText:
				'a koala in a friendly and helpful posture. The Koala is standing next to and teaching a woman who is coding on a computer and shows positive signs of learning and understanding what is being explained.',
			objectKey: 'pat-notes/koala-mentor.png',
		},
		koalaSoccer: {
			altText: 'a cute cartoon koala kicking a soccer ball on a soccer field ',
			objectKey: 'pat-notes/koala-soccer.png',
		},
	}

	const githubUser = await insertGitHubUser(MOCK_CODE_GITHUB)

	const pat = await prisma.user.create({
		select: { id: true },
		data: {
			email: process.env.DEV_EMAIL || 'pat@kcd.dev',
			username: process.env.DEV_USERNAME || 'pat',
			name: process.env.DEV_NAME || 'Kody',
			password: {
				create: createPassword(process.env.DEV_PASSWORD || 'kodylovesyou'),
			},
			connections: {
				create: {
					providerName: 'github',
					providerId: String(githubUser.profile.id),
				},
			},
			roles: { connect: [{ name: 'admin' }, { name: 'user' }] },
		},
	})

	await prisma.userImage.create({
		data: {
			userId: pat.id,
			objectKey: kodyImages.kodyUser.objectKey,
		},
	})

	// Create Kody's notes
	const kodyNotes = [
		{
			id: 'd27a197e',
			title: 'Basic Koala Facts',
			content:
				'Koalas are found in the eucalyptus forests of eastern Australia. They have grey fur with a cream-coloured chest, and strong, clawed feet, perfect for living in the branches of trees!',
			images: [kodyImages.cuteKoala, kodyImages.koalaEating],
		},
		{
			id: '414f0c09',
			title: 'Koalas like to cuddle',
			content:
				'Cuddly critters, koalas measure about 60cm to 85cm long, and weigh about 14kg.',
			images: [kodyImages.koalaCuddle],
		},
		{
			id: '260366b1',
			title: 'Not bears',
			content:
				"Although you may have heard people call them koala 'bears', these awesome animals aren't bears at all – they are in fact marsupials. A group of mammals, most marsupials have pouches where their newborns develop.",
			images: [],
		},
		{
			id: 'bb79cf45',
			title: 'Snowboarding Adventure',
			content:
				"Today was an epic day on the slopes! Shredded fresh powder with my friends, caught some sick air, and even attempted a backflip. Can't wait for the next snowy adventure!",
			images: [kodyImages.mountain],
		},
		{
			id: '9f4308be',
			title: 'Onewheel Tricks',
			content:
				"Mastered a new trick on my Onewheel today called '180 Spin'. It's exhilarating to carve through the streets while pulling off these rad moves. Time to level up and learn more!",
			images: [],
		},
		{
			id: '306021fb',
			title: 'Coding Dilemma',
			content:
				"Stuck on a bug in my latest coding project. Need to figure out why my function isn't returning the expected output. Time to dig deep, debug, and conquer this challenge!",
			images: [kodyImages.koalaCoder],
		},
		{
			id: '16d4912a',
			title: 'Coding Mentorship',
			content:
				"Had a fantastic coding mentoring session today with Sarah. Helped her understand the concept of recursion, and she made great progress. It's incredibly fulfilling to help others improve their coding skills.",
			images: [kodyImages.koalaMentor],
		},
		{
			id: '3199199e',
			title: 'Koala Fun Facts',
			content:
				"Did you know that koalas sleep for up to 20 hours a day? It's because their diet of eucalyptus leaves doesn't provide much energy. But when I'm awake, I enjoy munching on leaves, chilling in trees, and being the cuddliest koala around!",
			images: [],
		},
		{
			id: '2030ffd3',
			title: 'Skiing Adventure',
			content:
				'Spent the day hitting the slopes on my skis. The fresh powder made for some incredible runs and breathtaking views. Skiing down the mountain at top speed is an adrenaline rush like no other!',
			images: [kodyImages.mountain],
		},
		{
			id: 'f375a804',
			title: 'Code Jam Success',
			content:
				'Participated in a coding competition today and secured the first place! The adrenaline, the challenging problems, and the satisfaction of finding optimal solutions—it was an amazing experience. Feeling proud and motivated to keep pushing my coding skills further!',
			images: [kodyImages.koalaCoder],
		},
		{
			id: '562c541b',
			title: 'Koala Conservation Efforts',
			content:
				"Joined a local conservation group to protect koalas and their habitats. Together, we're planting more eucalyptus trees, raising awareness about their endangered status, and working towards a sustainable future for these adorable creatures. Every small step counts!",
			images: [],
		},
		{
			id: 'f67ca40b',
			title: 'Game day',
			content:
				"Just got back from the most amazing game. I've been playing soccer for a long time, but I've not once scored a goal. Well, today all that changed! I finally scored my first ever goal.\n\nI'm in an indoor league, and my team's not the best, but we're pretty good and I have fun, that's all that really matters. Anyway, I found myself at the other end of the field with the ball. It was just me and the goalie. I normally just kick the ball and hope it goes in, but the ball was already rolling toward the goal. The goalie was about to get the ball, so I had to charge. I managed to get possession of the ball just before the goalie got it. I brought it around the goalie and had a perfect shot. I screamed so loud in excitement. After all these years playing, I finally scored a goal!\n\nI know it's not a lot for most folks, but it meant a lot to me. We did end up winning the game by one. It makes me feel great that I had a part to play in that.\n\nIn this team, I'm the captain. I'm constantly cheering my team on. Even after getting injured, I continued to come and watch from the side-lines. I enjoy yelling (encouragingly) at my team mates and helping them be the best they can. I'm definitely not the best player by a long stretch. But I really enjoy the game. It's a great way to get exercise and have good social interactions once a week.\n\nThat said, it can be hard to keep people coming and paying dues and stuff. If people don't show up it can be really hard to find subs. I have a list of people I can text, but sometimes I can't find anyone.\n\nBut yeah, today was awesome. I felt like more than just a player that gets in the way of the opposition, but an actual asset to the team. Really great feeling.\n\nAnyway, I'm rambling at this point and really this is just so we can have a note that's pretty long to test things out. I think it's long enough now... Cheers!",
			images: [kodyImages.koalaSoccer],
		},
	]

	for (const noteData of kodyNotes) {
		const note = await prisma.note.create({
			select: { id: true },
			data: {
				id: noteData.id,
				title: noteData.title,
				content: noteData.content,
				ownerId: pat.id,
			},
		})

		for (const image of noteData.images) {
			await prisma.noteImage.create({
				data: {
					noteId: note.id,
					altText: image.altText,
					objectKey: image.objectKey,
				},
			})
		}
	}

	console.timeEnd(`🐨 Created admin user "pat"`)

	console.time(`📝 Created about me`)

	const aboutMeCategoryData = [
		{
			name: 'Professional',
			description: 'Professional experience and skills',
		},
		{
			name: 'Personal',
			description: 'Personal interests and hobbies',
		},
	] as const

	for (const category of aboutMeCategoryData) {
		await prisma.aboutMeCategory.create({
			data: {
				name: category.name,
				description: category.description,
			},
		})
	}

	const aboutMeCategories = await prisma.aboutMeCategory.findMany({
		select: { id: true, name: true },
	})
	const aboutMeCategoriesMap = new Map(
		aboutMeCategories.map((c) => [c.name, c.id]),
	)

	const aboutMeContent = [
		{
			name: 'Professional',
			description: 'Professional experience and skills',
			category: 'Professional',
			content: `I am a senior full-stack software engineer with 10+ years of
					experience. I have launched and/or contributed to projects that
					demonstrate AI technology, messaging platforms, health tech, and
					e-commerce. I have well-rounded expertise in frontend, backend,
					deployment, and everything in between. I also enjoy growing my skills
					to keep up with current trends like using LLMs for coding tools.`,
		},
		{
			name: 'Personal',
			description: 'Personal interests and hobbies',
			category: 'Personal',
			content: `I grew up in Maine and currently live in Brooklyn so I enjoy nature
					and city life equally! For fun I like to follow professional sports,
					enjoy the discourse on Twitter, play video games, discover new music to listen to.`,
		},
	] as const

	for (const aboutMe of aboutMeContent) {
		await prisma.aboutMe.create({
			data: {
				name: aboutMe.name,
				description: aboutMe.description,
				content: aboutMe.content,
				userId: pat.id,
				aboutMeCategoryId: aboutMeCategoriesMap.get(aboutMe.category)!,
			},
		})
	}

	console.timeEnd(`📝 Created about me`)

	console.time(`🗣️ Created social links`)

	const socialLinks = [
		{
			href: process.env.CONTACT_EMAIL,
			icon: 'envelope-closed',
			label: 'Send me an email',
			text: 'Email Me',
		},
		{
			href: process.env.CONTACT_LINKEDIN,
			icon: 'linkedin-logo',
			label: 'Connect with me on LinkedIn',
			text: 'LinkedIn',
		},
		{
			href: process.env.CONTACT_GITHUB,
			icon: 'github-logo',
			label: 'View my work on GitHub',
			text: 'GitHub',
		},
		{
			href: process.env.CONTACT_TWITTER,
			icon: 'twitter-logo',
			label: 'Follow me on Twitter',
			text: 'Twitter',
		},
		{
			href: process.env.CONTACT_INSTAGRAM,
			icon: 'instagram-logo',
			label: 'Follow me on Instagram',
			text: 'Instagram',
		},
	] as const
	const filteredSocialLinks = socialLinks.filter((link) => !!link.href)
	for (const link of filteredSocialLinks) {
		await prisma.socialLink.create({
			data: {
				...link,
				href: link.href!,
				userId: pat.id,
			},
		})
	}

	console.timeEnd(`🗣️ Created social links`)

	console.time(`🎯 Created skill categories and skills`)

	const skillCategoryData = ['Frontend', 'Backend', 'DevOps', 'Other'] as const
	for (const category of skillCategoryData) {
		await prisma.skillCategory.create({
			data: {
				name: category,
			},
		})
	}

	const skillCategories = await prisma.skillCategory.findMany({
		select: { id: true, name: true },
	})
	const skillCategoriesMap = new Map(skillCategories.map((c) => [c.name, c.id]))

	const skills = [
		{
			name: 'React',
			category: 'Frontend',
			description: 'Building dynamic UIs',
		},
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
		{
			name: 'TypeScript',
			category: 'Frontend',
			description: 'Typed JavaScript',
		},
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
		{
			name: 'SQLite',
			category: 'Backend',
			description: 'Embeddable SQL database engine',
		},
		{
			name: 'SSE',
			category: 'Backend',
			description: 'Server-Sent Events for real-time updates',
		},
		{ name: 'Docker', category: 'DevOps', description: 'Containerization' },
		{ name: 'AWS', category: 'DevOps', description: 'Cloud services' },
		{
			name: 'Fly.io',
			category: 'DevOps',
			description: 'Application deployment platform',
		},
		{
			name: 'Git & GitHub',
			category: 'DevOps',
			description: 'Version control',
		},
		{
			name: 'PWA',
			category: 'Frontend',
			description: 'Progressive Web App for offline capabilities',
		},
		{
			name: 'XState',
			category: 'Frontend',
			description: 'State management and statecharts',
		},
		{
			name: 'Agile Methodologies',
			category: 'Other',
			description: 'Iterative development',
		},
	]

	for (const skill of skills) {
		await prisma.skill.create({
			data: {
				name: skill.name,
				description: skill.description,
				userId: pat.id,
				skillCategoryId: skillCategoriesMap.get(skill.category)!,
			},
		})
	}

	console.timeEnd(`🎯 Created skill categories and skills`)

	console.time(`📝 Created projects`)

	const projects = [
		{
			title: 'PPPAAATTT',
			description:
				'A fun, creative studio, closely resembling Figma, for assembling designs on a canvas.',
			skills: ['Remix', 'TailwindCSS', 'SQLite', 'Fly.io'],
			liveDemoUrl: 'https://pppaaattt.xyz',
			sourceCodeUrl: 'https://github.com/goodeats/epic-pppaaattt.xyz',
		},
		{
			title: 'Choros App',
			description:
				'A messaging platform for planning or finding local activities and then matchmaking groups to meet up.',
			skills: [
				'Remix',
				'TailwindCSS',
				'SQLite',
				'Fly.io',
				'PWA',
				'XState',
				'SSE',
			],
			comments:
				'This project is currently in a private beta, but I would be happy to give a personal demo.',
		},
	]

	for (const project of projects) {
		await prisma.project.create({
			data: {
				title: project.title,
				description: project.description,
				liveDemoUrl: project.liveDemoUrl,
				sourceCodeUrl: project.sourceCodeUrl,
				comments: project.comments,
				userId: pat.id,
				skills: {
					connect: project.skills.map((skillName) => ({
						name: skillName,
					})),
				},
			},
		})
	}

	console.timeEnd(`📝 Created projects`)

	console.timeEnd(`🌱 Database has been seeded`)
}

seed()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

// we're ok to import from the test directory in this file
/*
eslint
	no-restricted-imports: "off",
*/
