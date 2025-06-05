import { BackLink, EditLink } from '#app/components/button-links.tsx'

interface EntityDetailsProps {
	backLabel?: string
	editLabel?: string
	backTo?: string
	editTo?: string
}

export const EntityDetailsLinks = ({
	backLabel = 'Back to List',
	editLabel = 'Edit',
	backTo = '..',
	editTo = 'edit',
}: EntityDetailsProps) => {
	return (
		<div className="flex items-center justify-between">
			<BackLink label={backLabel} to={backTo} />
			<EditLink label={editLabel} to={editTo} />
		</div>
	)
}
