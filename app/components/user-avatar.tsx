import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar'
import { getUserImgSrc } from '#app/utils/misc.tsx'

type UserImageProps = {
	objectKey: string | null
}

type UserNameProps = {
	name: string | null
	email: string
}

type UserAvatarProps = {
	user: UserNameProps & {
		image: UserImageProps | null
	}
	className?: string
}

const getAvatarAlt = (user: UserNameProps) => user.name ?? user.email

const getAvatarFallback = (user: UserNameProps) => {
	const initial = user.name ? user.name.charAt(0) : user.email.charAt(0)
	return initial.toUpperCase()
}

const getAvatarSrc = (image: UserImageProps | null) => {
	if (!image) return undefined
	return getUserImgSrc(image.objectKey)
}

export function UserAvatar({ user, className }: UserAvatarProps) {
	return (
		<Avatar className={className}>
			<AvatarImage src={getAvatarSrc(user.image)} alt={getAvatarAlt(user)} />
			<AvatarFallback className="rounded-lg">
				{getAvatarFallback(user)}
			</AvatarFallback>
		</Avatar>
	)
}
