import { faker } from '@faker-js/faker'
import {
	type User as UserModel,
	type AboutMe as AboutMeModel,
	type AboutMeCategory as AboutMeCategoryModel,
} from '@prisma/client'
import { UniqueEnforcer } from 'enforce-unique'
import { prisma } from '#app/utils/db.server.ts'

export type AboutMeCategoryPlaywright = {
	id: string
	name: string
	description: string | null
	isPublished: boolean
}

export type CreateAboutMeCategoryOptions = {
	id?: AboutMeCategoryModel['id']
	name?: AboutMeCategoryModel['name']
	description?: AboutMeCategoryModel['description']
	isPublished?: AboutMeCategoryModel['isPublished']
}

const uniqueCategoryNameEnforcer = new UniqueEnforcer()

export function createAboutMeCategoryData(
	overrides: Partial<
		Omit<AboutMeCategoryModel, 'id' | 'createdAt' | 'updatedAt'>
	> = {},
): Omit<AboutMeCategoryModel, 'id' | 'createdAt' | 'updatedAt'> {
	const name = uniqueCategoryNameEnforcer.enforce(() =>
		faker.lorem.words(faker.number.int({ min: 1, max: 3 })).slice(0, 50),
	)
	return {
		name: overrides.name ?? name,
		description: overrides.description ?? faker.lorem.sentence(),
		isPublished: overrides.isPublished ?? true,
	}
}

export async function getOrInsertAboutMeCategory({
	id,
	name,
	...rest
}: CreateAboutMeCategoryOptions = {}): Promise<AboutMeCategoryPlaywright> {
	const select = {
		id: true,
		name: true,
		description: true,
		isPublished: true,
	}
	if (id) {
		return await prisma.aboutMeCategory.findUniqueOrThrow({
			select,
			where: { id },
		})
	}
	if (name) {
		const existingCategory = await prisma.aboutMeCategory.findUnique({
			where: { name },
			select,
		})
		if (existingCategory) {
			return existingCategory
		}
	}

	const data = createAboutMeCategoryData({ name, ...rest })
	return await prisma.aboutMeCategory.create({
		select,
		data,
	})
}

// AboutMe Types and Functions

export type AboutMePlaywright = {
	id: string
	name: string
	content: string
	description: string | null
	isPublished: boolean
	userId: string
	aboutMeCategoryId: string
	aboutMeCategoryName: string
}

export type CreateAboutMeOptions = {
	id?: AboutMeModel['id']
	name?: AboutMeModel['name']
	content?: AboutMeModel['content']
	description?: AboutMeModel['description']
	isPublished?: AboutMeModel['isPublished']
	userId: UserModel['id'] // Required
	aboutMeCategoryId?: AboutMeModel['aboutMeCategoryId']
	aboutMeCategoryName?: AboutMeCategoryModel['name']
}

const uniqueAboutMeNameEnforcer = new UniqueEnforcer()

export function createAboutMeData(
	overrides: Partial<
		Omit<
			AboutMeModel,
			'id' | 'createdAt' | 'updatedAt' | 'userId' | 'aboutMeCategoryId'
		>
	> = {},
): Omit<
	AboutMeModel,
	'id' | 'createdAt' | 'updatedAt' | 'userId' | 'aboutMeCategoryId'
> {
	const name = uniqueAboutMeNameEnforcer.enforce(() =>
		faker.lorem.words(faker.number.int({ min: 2, max: 5 })).slice(0, 100),
	)
	return {
		name: overrides.name ?? name,
		content:
			overrides.content ??
			faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
		description: overrides.description ?? faker.lorem.sentence(),
		isPublished: overrides.isPublished ?? true,
	}
}

export async function getOrInsertAboutMe({
	id,
	userId,
	aboutMeCategoryId,
	aboutMeCategoryName,
	...rest
}: CreateAboutMeOptions): Promise<AboutMePlaywright> {
	const select = {
		id: true,
		name: true,
		content: true,
		description: true,
		isPublished: true,
		userId: true,
		aboutMeCategoryId: true,
		aboutMeCategory: { select: { name: true } },
	}

	if (id) {
		const aboutMe = await prisma.aboutMe.findUniqueOrThrow({
			select,
			where: { id },
		})
		return { ...aboutMe, aboutMeCategoryName: aboutMe.aboutMeCategory.name }
	} else {
		const data = createAboutMeData(rest)
		let finalAboutMeCategoryId = aboutMeCategoryId

		if (!finalAboutMeCategoryId) {
			if (aboutMeCategoryName) {
				const category = await getOrInsertAboutMeCategory({
					name: aboutMeCategoryName,
				})
				finalAboutMeCategoryId = category.id
			} else {
				const professionalCategory = await getOrInsertAboutMeCategory({
					name: 'Professional',
				})
				finalAboutMeCategoryId = professionalCategory.id
			}
		}

		const aboutMe = await prisma.aboutMe.create({
			select,
			data: {
				...data,
				userId,
				aboutMeCategoryId: finalAboutMeCategoryId!,
			},
		})
		return { ...aboutMe, aboutMeCategoryName: aboutMe.aboutMeCategory.name }
	}
}
