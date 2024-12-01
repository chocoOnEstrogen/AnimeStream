import DocComponent, { ComponentMetadata } from '../../../classes/DocComponent';

interface AlertProps {
    type?: 'info' | 'warning' | 'danger';
    title?: string;
    icon?: string;
    children: string;
}

const alertStyles = `
.doc-alert {
    padding: 1rem 1.5rem;
    margin: 1rem 0;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-left: 4px solid;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
}

.doc-alert-icon {
    font-size: 1.25rem;
    line-height: 1;
    padding-top: 0.125rem;
}

.doc-alert-content {
    flex: 1;
}

.doc-alert-title {
    font-weight: 600;
    margin-bottom: 0.5rem;
}

/* Info Alert */
.doc-alert-info {
    border-color: var(--bs-info);
}

.doc-alert-info .doc-alert-icon {
    color: var(--bs-info);
}

/* Warning Alert */
.doc-alert-warning {
    border-color: var(--bs-warning);
}

.doc-alert-warning .doc-alert-icon {
    color: var(--bs-warning);
}

/* Danger Alert */
.doc-alert-danger {
    border-color: var(--bs-danger);
}

.doc-alert-danger .doc-alert-icon {
    color: var(--bs-danger);
}

/* Dark theme adjustments */
[data-bs-theme="dark"] .doc-alert {
    background: rgba(255, 255, 255, 0.03);
}

/* Alert Content Styles */
.doc-alert-content p:last-child {
    margin-bottom: 0;
}

.doc-alert-content code {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.2em 0.4em;
    border-radius: 0.25rem;
    font-size: 0.875em;
}

.doc-alert-content a {
    color: inherit;
    text-decoration: underline;
    text-decoration-style: dotted;
}

.doc-alert-content a:hover {
    text-decoration-style: solid;
}
`;

export default class Alert extends DocComponent<AlertProps> {
    static metadata: ComponentMetadata = {
        name: 'alert',
        description: 'Alert component',
        category: 'general',
        version: '1.0.0'
    };

    constructor() {
        super('alert', alertStyles);
    }

    protected validateProps(props: AlertProps): boolean {
        if (!props.children) return false;
        if (props.type && !['info', 'warning', 'danger'].includes(props.type)) return false;
        return true;
    }

    public render(props: AlertProps): string {
        const type = props.type || 'info';
        const icon = props.icon || this.getDefaultIcon(type);
        
        return `
            <div class="doc-alert doc-alert-${type} d-flex" role="alert">
                ${icon ? `
                    <div class="doc-alert-icon me-3">
                        <i class="bi ${icon}"></i>
                    </div>
                ` : ''}
                <div class="doc-alert-content">
                    ${props.title ? `<div class="doc-alert-title">${this.escape(props.title)}</div>` : ''}
                    ${props.children}
                </div>
            </div>
        `.trim();
    }

    private getDefaultIcon(type: string): string {
        switch (type) {
            case 'info': return 'bi-info-circle';
            case 'warning': return 'bi-exclamation-triangle';
            case 'danger': return 'bi-exclamation-octagon';
            default: return 'bi-info-circle';
        }
    }
}
