import { faker } from '@faker-js/faker'
import {
	type User as UserModel,
	type Project as ProjectModel,
} from '@prisma/client'
import { UniqueEnforcer } from 'enforce-unique'
import { prisma } from '#app/utils/db.server.ts'

export type ProjectPlaywright = {
	id: string
	title: string
	description: string
	isPublished: boolean
	liveDemoUrl?: string | null
	sourceCodeUrl?: string | null
	comments?: string | null
	userId: string
	skills: Array<{ id: string }>
}

export type CreateProjectOptions = {
	id?: ProjectModel['id']
	title?: ProjectModel['title']
	description?: ProjectModel['description']
	isPublished?: ProjectModel['isPublished']
	liveDemoUrl?: ProjectModel['liveDemoUrl']
	sourceCodeUrl?: ProjectModel['sourceCodeUrl']
	comments?: ProjectModel['comments']
	userId: UserModel['id'] // Required
	skillIds?: string[] // Optional array of skill IDs
}

const uniqueProjectTitleEnforcer = new UniqueEnforcer()

export function createProjectData(
	overrides: Partial<
		Omit<ProjectModel, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
	> = {},
): Omit<ProjectModel, 'id' | 'createdAt' | 'updatedAt' | 'userId'> {
	const title = uniqueProjectTitleEnforcer.enforce(() =>
		faker.lorem.words(faker.number.int({ min: 2, max: 4 })).slice(0, 50),
	)
	return {
		title: overrides.title ?? title,
		description: overrides.description ?? faker.lorem.paragraph(),
		isPublished: overrides.isPublished ?? true,
		liveDemoUrl: overrides.liveDemoUrl ?? faker.internet.url(),
		sourceCodeUrl: overrides.sourceCodeUrl ?? faker.internet.url(),
		comments: overrides.comments ?? null,
	}
}

export async function getOrInsertProject({
	id,
	userId,
	skillIds = [],
	...rest
}: CreateProjectOptions): Promise<ProjectPlaywright> {
	const select = {
		id: true,
		title: true,
		description: true,
		isPublished: true,
		liveDemoUrl: true,
		sourceCodeUrl: true,
		comments: true,
		userId: true,
		skills: {
			select: {
				id: true,
			},
		},
	}

	if (id) {
		return await prisma.project.findUniqueOrThrow({
			select,
			where: { id },
		})
	} else {
		const data = createProjectData(rest)
		return await prisma.project.create({
			select,
			data: {
				...data,
				userId,
				skills: {
					connect: skillIds.map((id) => ({ id })),
				},
			},
		})
	}
}
