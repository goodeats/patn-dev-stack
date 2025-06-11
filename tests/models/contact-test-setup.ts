import { faker } from '@faker-js/faker'
import {
	type User as UserModel,
	type SocialLink as ContactModel,
} from '@prisma/client'
import { UniqueEnforcer } from 'enforce-unique'
import { prisma } from '#app/utils/db.server.ts'

export type ContactPlaywright = {
	id: string
	href: string
	icon: string
	label: string
	text: string
	isPublished: boolean
	userId: string
}

export type CreateContactOptions = {
	id?: ContactModel['id']
	href?: ContactModel['href']
	icon?: ContactModel['icon']
	label?: ContactModel['label']
	text?: ContactModel['text']
	isPublished?: ContactModel['isPublished']
	userId: UserModel['id'] // Required
}

const uniqueContactNameEnforcer = new UniqueEnforcer()

export function createContactData(
	overrides: Partial<
		Omit<ContactModel, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
	> = {},
): Omit<ContactModel, 'id' | 'createdAt' | 'updatedAt' | 'userId'> {
	const text = uniqueContactNameEnforcer.enforce(() =>
		faker.lorem.words(faker.number.int({ min: 1, max: 2 })).slice(0, 50),
	)
	return {
		text: overrides.text ?? text,
		href: overrides.href ?? faker.internet.url(),
		icon: overrides.icon ?? 'envelope-closed',
		label: overrides.label ?? faker.lorem.words(2),
		isPublished: overrides.isPublished ?? true,
	}
}

export async function getOrInsertContact({
	id,
	userId,
	...rest
}: CreateContactOptions): Promise<ContactPlaywright> {
	const select = {
		id: true,
		href: true,
		icon: true,
		label: true,
		text: true,
		isPublished: true,
		userId: true,
	}

	if (id) {
		return await prisma.socialLink.findUniqueOrThrow({
			select,
			where: { id },
		})
	} else {
		const data = createContactData(rest)
		return await prisma.socialLink.create({
			select,
			data: {
				...data,
				userId,
			},
		})
	}
}
