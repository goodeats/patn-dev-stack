import { type Skill } from '@prisma/client'
import { Badge } from '#app/components/ui/badge.tsx'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'

export function SkillBadge({
	skill,
}: {
	skill: Pick<Skill, 'name' | 'description'>
}) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Badge variant="secondary" className="cursor-pointer">
						{skill.name}
					</Badge>
				</TooltipTrigger>
				{skill.description ? (
					<TooltipContent>
						<p>{skill.description}</p>
					</TooltipContent>
				) : null}
			</Tooltip>
		</TooltipProvider>
	)
}
