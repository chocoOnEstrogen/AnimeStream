import DocComponent from '../../classes/DocComponent'
import * as fs from 'fs'
import * as path from 'path'

class ComponentRegistry {
	private components: Map<string, DocComponent> = new Map()

	constructor() {
		// Automatically load all components from the _/ directory
		this.loadComponentsFromDirectory(path.join(__dirname, '_'))
	}

	private async loadComponentsFromDirectory(directory: string): Promise<void> {
		try {
			const files = fs.readdirSync(directory)

			for (const file of files) {
				// Skip non-TypeScript files and index files
				if (!file.endsWith('.ts') || file === 'index.ts') continue

				try {
					// Import the component module
					const componentModule = require(path.join(directory, file))

					// Get the component class
					const ComponentClass = componentModule.default
					if (!ComponentClass || typeof ComponentClass !== 'function') {
						console.warn(`Skipping ${file}: No default export found`)
						continue
					}

					// Create an instance of the component
					const component = new ComponentClass()

					// Get the component name from the file name
					const componentName = path
						.basename(file, '.ts')
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, '-')

					// Register the component
					this.register(componentName, component)
					console.log(`✓ Registered component: ${componentName}`)
				} catch (error) {
					console.error(`Failed to load component from ${file}:`, error)
				}
			}
		} catch (error) {
			console.error('Failed to load components directory:', error)
		}
	}

	public register(name: string, component: DocComponent): void {
		const normalizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

		// Validate that the component extends DocComponent
		if (!(component instanceof DocComponent)) {
			throw new Error(`Invalid component "${name}": Must extend DocComponent`)
		}

		this.components.set(normalizedName, component)
	}

	public get(name: string): DocComponent | undefined {
		const normalizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
		return this.components.get(normalizedName)
	}

	public render(name: string, props: any): string {
		const component = this.get(name)
		if (!component) {
			console.error(
				`Component "${name}" not found. Available components:`,
				Array.from(this.components.keys()),
			)
			throw new Error(`Component "${name}" not found`)
		}
		return component.render(props)
	}

	public getAllStyles(): string {
		let styles = ''
		this.components.forEach((component) => {
			if (typeof component.getStyles === 'function') {
				styles += component.getStyles() + '\n'
			}
		})
		return styles
	}

	// Helper method to list all registered components
	public listComponents(): string[] {
		return Array.from(this.components.keys())
	}
}

export const registry = new ComponentRegistry()
