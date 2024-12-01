const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const BUILD_PATH = path.join(__dirname, '..', 'dist')
const SCRIPTS_PATH = path.join(BUILD_PATH, '__scripts__')
const DEPLOY_TS = path.join('src', '__scripts__', 'deployDiscordCommands.ts')
const DEPLOY_JS = path.join(SCRIPTS_PATH, 'deployDiscordCommands.js')

// Execute command and handle output
const executeCommand = (command, args) => {
	// Use local node_modules for ts-node
	const tsNodePath = path.join(__dirname, '..', 'node_modules', '.bin', command)
	const finalCommand = command === 'ts-node' ? tsNodePath : command

	const proc = spawn(finalCommand, args, {
		stdio: 'inherit',
		shell: process.platform === 'win32', // Use shell on Windows
	})

	proc.on('error', (error) => {
		console.error(`Execution error: ${error}`)
		process.exit(1)
	})

	proc.on('exit', (code) => {
		if (code !== 0) {
			console.error(`Process exited with code ${code}`)
			process.exit(code)
		}
	})
}

// Use ts-node for development, node for production
const isProduction =
	fs.existsSync(BUILD_PATH) &&
	fs.existsSync(SCRIPTS_PATH) &&
	fs.existsSync(DEPLOY_JS)

if (isProduction) {
	executeCommand('node', [DEPLOY_JS])
} else {
	executeCommand('ts-node', [DEPLOY_TS])
}
