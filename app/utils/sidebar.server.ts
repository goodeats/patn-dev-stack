import * as cookie from 'cookie'

const cookieName = 'sidebar:state'

export function getSidebar(request: Request): boolean | null {
	const cookieHeader = request.headers.get('cookie')
	const parsed = cookieHeader ? cookie.parse(cookieHeader)[cookieName] : 'true'
	if (parsed === 'true' || parsed === 'false') return parsed === 'true'
	return null
}

export function setSidebar(state: boolean) {
	return cookie.serialize(cookieName, state.toString(), {
		path: '/',
		maxAge: 31536000,
	})
}
