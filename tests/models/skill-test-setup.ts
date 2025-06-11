import { faker } from '@faker-js/faker'
import {
	type User as UserModel,
	type Skill as SkillModel,
	type SkillCategory as SkillCategoryModel,
} from '@prisma/client'
import { UniqueEnforcer } from 'enforce-unique'
import { prisma } from '#app/utils/db.server.ts'

export type SkillCategoryPlaywright = {
	id: string
	name: string
	description: string | null
	isPublished: boolean
}

export type CreateSkillCategoryOptions = {
	id?: SkillCategoryModel['id']
	name?: SkillCategoryModel['name']
	description?: SkillCategoryModel['description']
	isPublished?: SkillCategoryModel['isPublished']
}

const uniqueCategoryNameEnforcer = new UniqueEnforcer()

export function createSkillCategoryData(
	overrides: Partial<
		Omit<SkillCategoryModel, 'id' | 'createdAt' | 'updatedAt'>
	> = {},
): Omit<SkillCategoryModel, 'id' | 'createdAt' | 'updatedAt'> {
	const name = uniqueCategoryNameEnforcer.enforce(() =>
		faker.lorem.words(faker.number.int({ min: 1, max: 3 })).slice(0, 50),
	)
	return {
		name: overrides.name ?? name,
		description: overrides.description ?? faker.lorem.sentence(),
		isPublished: overrides.isPublished ?? true,
	}
}

export async function getOrInsertSkillCategory({
	id,
	name,
	...rest
}: CreateSkillCategoryOptions = {}): Promise<SkillCategoryPlaywright> {
	const select = {
		id: true,
		name: true,
		description: true,
		isPublished: true,
	}
	if (id) {
		return await prisma.skillCategory.findUniqueOrThrow({
			select,
			where: { id },
		})
	}
	if (name) {
		const existingCategory = await prisma.skillCategory.findUnique({
			where: { name },
			select,
		})
		if (existingCategory) {
			return existingCategory
		}
	}

	const data = createSkillCategoryData({ name, ...rest })
	return await prisma.skillCategory.create({
		select,
		data,
	})
}

// Skill Types and Functions

export type SkillPlaywright = {
	id: string
	name: string
	description: string | null
	isPublished: boolean
	userId: string
	skillCategoryId: string
	skillCategoryName: string
}

export type CreateSkillOptions = {
	id?: SkillModel['id']
	name?: SkillModel['name']
	description?: SkillModel['description']
	isPublished?: SkillModel['isPublished']
	userId: UserModel['id'] // Required
	skillCategoryId?: SkillModel['skillCategoryId']
	skillCategoryName?: SkillCategoryModel['name']
}

const uniqueSkillNameEnforcer = new UniqueEnforcer()

export function createSkillData(
	overrides: Partial<
		Omit<
			SkillModel,
			'id' | 'createdAt' | 'updatedAt' | 'userId' | 'skillCategoryId'
		>
	> = {},
): Omit<
	SkillModel,
	'id' | 'createdAt' | 'updatedAt' | 'userId' | 'skillCategoryId'
> {
	const name = uniqueSkillNameEnforcer.enforce(() =>
		faker.lorem.words(faker.number.int({ min: 2, max: 5 })).slice(0, 100),
	)
	return {
		name: overrides.name ?? name,
		icon: overrides.icon ?? faker.lorem.word(),
		description: overrides.description ?? faker.lorem.sentence(),
		isPublished: overrides.isPublished ?? true,
	}
}

export async function getOrInsertSkill({
	id,
	userId,
	skillCategoryId,
	skillCategoryName,
	...rest
}: CreateSkillOptions): Promise<SkillPlaywright> {
	const select = {
		id: true,
		name: true,
		description: true,
		isPublished: true,
		userId: true,
		skillCategoryId: true,
		skillCategory: { select: { name: true } },
	}

	if (id) {
		const skill = await prisma.skill.findUniqueOrThrow({
			select,
			where: { id },
		})
		return { ...skill, skillCategoryName: skill.skillCategory.name }
	} else {
		const data = createSkillData(rest)
		let finalSkillCategoryId = skillCategoryId

		if (!finalSkillCategoryId) {
			if (skillCategoryName) {
				const category = await getOrInsertSkillCategory({
					name: skillCategoryName,
				})
				finalSkillCategoryId = category.id
			} else {
				const professionalCategory = await getOrInsertSkillCategory({
					name: 'Professional',
				})
				finalSkillCategoryId = professionalCategory.id
			}
		}

		const skill = await prisma.skill.create({
			select,
			data: {
				...data,
				userId,
				skillCategoryId: finalSkillCategoryId!,
			},
		})
		return { ...skill, skillCategoryName: skill.skillCategory.name }
	}
}
