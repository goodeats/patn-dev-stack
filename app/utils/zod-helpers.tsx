import { z } from 'zod'

export const StringMinMaxLengthSchema = (min: number, max: number) =>
	z.string().min(min).max(max)

// check if value === true when Schema.parse(...) otherwise false
export const CheckboxFieldSchema = z
	.boolean()
	.or(z.string())
	.transform((value) => {
		if (typeof value === 'string') {
			return value === 'true'
		}
		return value
	})
