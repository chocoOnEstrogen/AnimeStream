import DocComponent, { ComponentMetadata } from "../../../classes/DocComponent";

interface CardProps {
    title: string;
    icon?: string;
    children: string;
}

const cardStyles = `
.doc-card {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin: 1rem 0;
    transition: transform 0.2s;
}

.doc-card:hover {
    transform: translateY(-2px);
}

.doc-card-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.doc-card-icon {
    font-size: 1.5rem;
    color: var(--bs-primary);
}

.doc-card-content {
    color: var(--bs-secondary-color);
}
`;

export default class Card extends DocComponent<CardProps> {
    static metadata: ComponentMetadata = {
        name: 'card',
        description: 'Card component',
        category: 'general',
        version: '1.0.0'
    };

    constructor() {
        super('card', cardStyles);
    }

    protected validateProps(props: CardProps): boolean {
        return !!props.title && !!props.children;
    }

    public render(props: CardProps): string {
        return `
            <div class="doc-card">
                <div class="doc-card-title">
                    ${props.icon ? `<i class="bi ${props.icon} doc-card-icon"></i>` : ''}
                    ${this.escape(props.title)}
                </div>
                <div class="doc-card-content">
                    ${props.children}
                </div>
            </div>
        `;
    }
} 