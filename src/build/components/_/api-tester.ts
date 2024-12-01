import DocComponent, { ComponentProps, ComponentMetadata } from "../../../classes/DocComponent";

interface ApiTesterProps extends ComponentProps {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    description?: string;
    params?: {
        name: string;
        type: 'query' | 'path' | 'body';
        required?: boolean;
        description?: string;
        default?: string;
    }[];
    responses?: {
        status: number;
        description: string;
        example: string;
    }[];
}

const apiTesterStyles = `
.doc-api-tester {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 0.75rem;
    margin: 1.5rem 0;
    overflow: hidden;
}

.doc-api-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.doc-api-method {
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    border-radius: 0.375rem;
}

.doc-api-method-get {
    background: rgba(var(--bs-success-rgb), 0.1);
    color: var(--bs-success);
}

.doc-api-method-post {
    background: rgba(var(--bs-primary-rgb), 0.1);
    color: var(--bs-primary);
}

.doc-api-method-put {
    background: rgba(var(--bs-warning-rgb), 0.1);
    color: var(--bs-warning);
}

.doc-api-method-delete {
    background: rgba(var(--bs-danger-rgb), 0.1);
    color: var(--bs-danger);
}

.doc-api-endpoint {
    font-family: var(--bs-font-monospace);
    color: var(--bs-secondary-color);
}

.doc-api-description {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--bs-secondary-color);
}

.doc-api-params {
    padding: 1.5rem;
}

.doc-api-param-group {
    margin-bottom: 1.5rem;
}

.doc-api-param-group:last-child {
    margin-bottom: 0;
}

.doc-api-param-title {
    font-size: 0.875rem;
    text-transform: uppercase;
    color: var(--bs-secondary-color);
    margin-bottom: 0.75rem;
}

.doc-api-param {
    display: flex;
    align-items: start;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}

.doc-api-param:last-child {
    margin-bottom: 0;
}

.doc-api-param input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.375rem;
    padding: 0.375rem 0.75rem;
    color: var(--bs-body-color);
    font-family: var(--bs-font-monospace);
    font-size: 0.875rem;
}

.doc-api-param input:focus {
    outline: none;
    border-color: var(--bs-primary);
}

.doc-api-param-required {
    color: var(--bs-danger);
    font-size: 0.75rem;
}

.doc-api-param-description {
    color: var(--bs-secondary-color);
    font-size: 0.875rem;
}

.doc-api-actions {
    padding: 1rem 1.5rem;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.doc-api-response {
    padding: 1.5rem;
    background: var(--bs-dark);
    border-radius: 0.5rem;
    margin-top: 1rem;
    display: none;
}

.doc-api-response.show {
    display: block;
}

.doc-api-response pre {
    margin: 0;
    white-space: pre-wrap;
}

.doc-api-response-success {
    border-left: 4px solid var(--bs-success);
}

.doc-api-response-error {
    border-left: 4px solid var(--bs-danger);
}

.doc-api-examples {
    padding: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.doc-api-example {
    margin-bottom: 1.5rem;
}

.doc-api-example:last-child {
    margin-bottom: 0;
}

.doc-api-example-status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}

.doc-api-example-status-2xx {
    color: var(--bs-success);
}

.doc-api-example-status-4xx,
.doc-api-example-status-5xx {
    color: var(--bs-danger);
}
`;

export default class ApiTester extends DocComponent<ApiTesterProps> {
    static metadata: ComponentMetadata = {
        name: 'api-tester',
        description: 'Interactive API testing component',
        category: 'interactive',
        version: '1.0.0'
    };

    constructor() {
        super('api-tester', apiTesterStyles);
    }

    protected validateProps(props: ApiTesterProps | string | { children: string }): boolean {
        let parsedProps: ApiTesterProps;
        
        if (typeof props === 'string' || 'children' in props) {
            try {
                const propsString = typeof props === 'string' ? props : props.children;
                const match = propsString.match(/{[\s\S]*}/);
                if (match) {
                    const jsonStr = match[0]
                        .replace(/&quot;/g, '"')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/<\/?p>/g, '')
                        .trim();
                    parsedProps = JSON.parse(jsonStr);
                } else {
                    parsedProps = JSON.parse(propsString);
                }
            } catch (error) {
                console.error('Failed to parse API tester props:', error);
                return false;
            }
        } else {
            parsedProps = props as ApiTesterProps;
        }

        return !!parsedProps.endpoint;
    }

    public render(props: ApiTesterProps | string | { children: string }): string {
        const parsedProps = this.parseProps(props);
        const method = parsedProps.method || 'GET';
        const testerId = `api_tester_${Math.random().toString(36).substring(2, 11)}`;

        return `
            <div class="doc-api-tester" id="${testerId}">
                <div class="doc-api-header">
                    <span class="doc-api-method doc-api-method-${method.toLowerCase()}">${method}</span>
                    <code class="doc-api-endpoint">${parsedProps.endpoint}</code>
                </div>

                ${parsedProps.description ? `
                    <div class="doc-api-description">
                        ${parsedProps.description}
                    </div>
                ` : ''}

                ${this.renderParams(parsedProps.params)}

                <div class="doc-api-actions">
                    <button class="btn btn-primary" onclick="testEndpoint_${testerId}()">
                        Send Request
                    </button>
                    <div class="doc-api-auth">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="${testerId}-auth">
                            <label class="form-check-label" for="${testerId}-auth">
                                Include Authentication
                            </label>
                        </div>
                    </div>
                </div>

                <div class="doc-api-response" id="${testerId}-response">
                    <pre><code class="language-json"></code></pre>
                </div>

                ${this.renderExamples(parsedProps.responses)}
            </div>

            <script>
            window.testEndpoint_${testerId} = function() {
                const tester = document.getElementById('${testerId}');
                const endpoint = '${parsedProps.endpoint}';
                const method = '${method}';
                const useAuth = document.getElementById('${testerId}-auth').checked;
                
                // Collect parameters
                const params = {};
                const pathParams = {};
                tester.querySelectorAll('.doc-api-param input').forEach(input => {
                    if (input.value) {
                        const paramType = input.getAttribute('data-param-type');
                        if (paramType === 'path') {
                            pathParams[input.name] = input.value;
                        } else {
                            params[input.name] = input.value;
                        }
                    }
                });

                // Build URL with path and query parameters
                let url = endpoint;
                
                // Replace path parameters
                Object.entries(pathParams).forEach(([key, value]) => {
                    url = url.replace(\`{\${key}}\`, value);
                });

                // Add query parameters
                if (Object.keys(params).length > 0) {
                    url = \`\${url}\${url.includes('?') ? '&' : '?'}\${new URLSearchParams(params)}\`;
                }

                // Ensure URL is absolute
                if (!url.startsWith('http')) {
                    url = window.location.origin + url;
                }

                const headers = {
                    'Content-Type': 'application/json'
                };
                
                if (useAuth && localStorage.getItem('token')) {
                    headers['Authorization'] = \`Bearer \${localStorage.getItem('token')}\`;
                }

                fetch(url, { method, headers })
                    .then(async response => {
                        const responseEl = document.getElementById('${testerId}-response');
                        const codeEl = responseEl.querySelector('code');
                        const data = await response.json();
                        
                        responseEl.classList.add('show');
                        responseEl.classList.toggle('doc-api-response-error', !response.ok);
                        responseEl.classList.toggle('doc-api-response-success', response.ok);
                        
                        codeEl.textContent = JSON.stringify(data, null, 2);
                        if (window.hljs) {
                            window.hljs.highlightElement(codeEl);
                        }
                        
                        return { response, data };
                    })
                    .catch(error => {
                        const responseEl = document.getElementById('${testerId}-response');
                        const codeEl = responseEl.querySelector('code');
                        
                        responseEl.classList.add('show', 'doc-api-response-error');
                        codeEl.textContent = JSON.stringify({
                            error: 'Failed to make request',
                            message: error.message
                        }, null, 2);
                        if (window.hljs) {
                            window.hljs.highlightElement(codeEl);
                        }
                    });
            }
            </script>
        `;
    }

    private renderParams(params?: ApiTesterProps['params']): string {
        if (!params || params.length === 0) return '';

        const queryParams = params.filter(p => p.type === 'query');
        const pathParams = params.filter(p => p.type === 'path');
        const bodyParams = params.filter(p => p.type === 'body');

        return `
            <div class="doc-api-params">
                ${this.renderParamGroup('Path Parameters', pathParams)}
                ${this.renderParamGroup('Query Parameters', queryParams)}
                ${this.renderParamGroup('Body Parameters', bodyParams)}
            </div>
        `;
    }

    private renderParamGroup(title: string, params: ApiTesterProps['params']): string {
        if (!params || params.length === 0) return '';

        return `
            <div class="doc-api-param-group">
                <div class="doc-api-param-title">${title}</div>
                ${params.map(param => `
                    <div class="doc-api-param">
                        <input type="text" 
                               name="${param.name}"
                               data-param-type="${param.type}"
                               placeholder="${param.name}"
                               ${param.default ? `value="${param.default}"` : ''}
                               ${param.required ? 'required' : ''}>
                        <div>
                            ${param.required ? '<span class="doc-api-param-required">Required</span>' : ''}
                            ${param.description ? `<div class="doc-api-param-description">${param.description}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    private renderExamples(responses?: ApiTesterProps['responses']): string {
        if (!responses || responses.length === 0) return '';

        return `
            <div class="doc-api-examples">
                <h6>Example Responses</h6>
                ${responses.map(response => `
                    <div class="doc-api-example">
                        <div class="doc-api-example-status doc-api-example-status-${Math.floor(response.status/100)}xx">
                            <i class="bi ${response.status < 400 ? 'bi-check-circle' : 'bi-x-circle'}"></i>
                            ${response.status} - ${response.description}
                        </div>
                        <pre><code class="language-json">${this.escape(JSON.stringify(response.example, null, 2))}</code></pre>
                    </div>
                `).join('')}
            </div>
        `;
    }
} 