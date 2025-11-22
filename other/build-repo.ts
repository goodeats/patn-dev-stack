import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fsExtra from 'fs-extra'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const here = (...s: Array<string>) => path.join(__dirname, ...s)

const reposExamplePath = here('../.repos.example')
const reposPath = here('../.repos')

if (!fsExtra.existsSync(reposPath)) {
	console.log('Copying .repos.example to .repos...')
	fsExtra.copySync(reposExamplePath, reposPath)
	console.log('✓ .repos directory created')
} else {
	console.log('✓ .repos directory already exists, skipping copy')
}

