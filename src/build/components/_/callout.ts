import DocComponent, { ComponentMetadata } from '../../../classes/DocComponent'

interface CalloutProps {
	type?: 'note' | 'tip' | 'important' | 'caution'
	title?: string
	children: string
}

const calloutStyles = `
.doc-callout {
    padding: 1.25rem;
    margin: 1.5rem 0;
    border-radius: 0.5rem;
    border-left: 0.25rem solid;
}

.doc-callout-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
}

.doc-callout-note {
    background: rgba(var(--bs-primary-rgb), 0.05);
    border-color: var(--bs-primary);
}

.doc-callout-tip {
    background: rgba(var(--bs-success-rgb), 0.05);
    border-color: var(--bs-success);
}

.doc-callout-important {
    background: rgba(var(--bs-warning-rgb), 0.05);
    border-color: var(--bs-warning);
}

.doc-callout-caution {
    background: rgba(var(--bs-danger-rgb), 0.05);
    border-color: var(--bs-danger);
}
`

export default class Callout extends DocComponent<CalloutProps> {
	static metadata: ComponentMetadata = {
		name: 'callout',
		description: 'Callout component',
		category: 'general',
		version: '1.0.0',
	}

	constructor() {
		super('callout', calloutStyles)
	}

	protected validateProps(props: CalloutProps): boolean {
		if (!props.children) return false
		if (
			props.type &&
			!['note', 'tip', 'important', 'caution'].includes(props.type)
		)
			return false
		return true
	}

	public render(props: CalloutProps): string {
		const type = props.type || 'note'
		const icon = this.getIcon(type)

		return `
            <div class="doc-callout doc-callout-${type}">
                ${
									props.title ?
										`
                    <div class="doc-callout-title">
                        <i class="bi ${icon}"></i>
                        ${this.escape(props.title)}
                    </div>
                `
									:	''
								}
                <div class="doc-callout-content">
                    ${props.children}
                </div>
            </div>
        `
	}

	private getIcon(type: string): string {
		switch (type) {
			case 'note':
				return 'bi-info-circle'
			case 'tip':
				return 'bi-lightbulb'
			case 'important':
				return 'bi-exclamation-circle'
			case 'caution':
				return 'bi-exclamation-triangle'
			default:
				return 'bi-info-circle'
		}
	}
}
