export interface ComponentMetadata {
    name: string;
    description?: string;
    category?: string;
    version?: string;
}

export interface ComponentProps {
    [key: string]: any;
}

export type ComponentPropsWithString<T> = T | string | { children: string };

export default class DocComponent<T extends ComponentProps = ComponentProps> {
    protected name: string;
    protected styles: string;
    static metadata?: ComponentMetadata;

    constructor(name: string, styles: string = '') {
        this.name = name;
        this.styles = styles;
    }

    protected validateProps(props: ComponentPropsWithString<T>): boolean {
        return true;
    }

    public render(props: ComponentPropsWithString<T>): string {
        if (!this.validateProps(props)) {
            throw new Error(`Invalid props for component ${this.name}`);
        }
        return '';
    }

    public getStyles(): string {
        return this.styles;
    }

    protected escape(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    protected parseProps(props: ComponentPropsWithString<T>): T {
        if (typeof props === 'string') {
            try {
                return JSON.parse(props);
            } catch (error) {
                throw new Error(`Failed to parse string props for component ${this.name}`);
            }
        } else if ('children' in props) {
            try {
                const match = props.children.match(/{[\s\S]*}/);
                if (match) {
                    const jsonStr = match[0]
                        .replace(/&quot;/g, '"')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/<\/?p>/g, '')
                        .trim();
                    return JSON.parse(jsonStr);
                }
                throw new Error('No JSON object found in children');
            } catch (error) {
                throw new Error(`Failed to parse children props for component ${this.name}`);
            }
        }
        return props as T;
    }
}