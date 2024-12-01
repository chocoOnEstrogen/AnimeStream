import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'
import hljs from 'highlight.js'
import { glob } from 'glob'
import { mkdir, writeFile } from 'fs/promises'
import { registry } from './components/registry'

const CWD = process.cwd()
const DOCS_DIR = path.join(CWD, 'docs')
const BUILD_DIR = path.join(CWD, 'dist', 'docs')
const PUBLIC_DIR = path.join(CWD, 'src', 'public')

interface DocMetadata {
    title: string
    description?: string
    dateAdded?: string
    lastUpdated?: string
    author?: string
    tags?: string[]
    order?: number
    category?: string
    related?: string[]
}

interface DocFile {
    slug: string
    category: string
    title: string
    path: string
    metadata: DocMetadata
    html: string
}

// Configure marked
marked.setOptions({
    //@ts-ignore
    langPrefix: 'hljs language-',
    //@ts-ignore
    highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { 
                    language: lang,
                    ignoreIllegals: true 
                }).value
            } catch (err) {
                console.error('Highlight.js error:', err)
            }
        }
        return code // Use plain text if language not found
    },
    renderer: (() => {
        const renderer = new marked.Renderer()
        
        // Custom link renderer
        //@ts-ignore
        renderer.link = (data) => {
            const linkRegex = /^(https?:\/\/|mailto:|\/docs\/)/
            const isExternal = linkRegex.test(data.href || '')
            return `<a href="${data.href}" ${isExternal ? 'target="_blank" rel="noopener"' : ''} 
                      ${data.title ? `title="${data.title}"` : ''}>${data.text}</a>`
        }
        
        // Custom code block renderer
        //@ts-ignore
        renderer.code = (data) => {
            return `<div class="code-block">
                      <div class="code-header">
                          <span class="code-language">${data.lang || 'plaintext'}</span>
                          <button class="copy-button" onclick="copyCode(this)">
                              <i class="bi bi-clipboard"></i>
                          </button>
                      </div>
                      <pre><code class="hljs language-${data.lang || 'plaintext'}">${data.text}</code></pre>
                   </div>`
        }
        
        // Custom inline code renderer
        renderer.codespan = (data) => {
            return `<code class="inline-code">${data.text}</code>`
        }
        
        return renderer
    })()
})

marked.use({
    extensions: [{
        name: 'component',
        level: 'block',
        start(src: string) {
            return src.match(/^:::[a-zA-Z]+/)?.index;
        },
        tokenizer(src: string) {
            const match = src.match(/^:::([\w-]+)(?:{([^}]+)})?\s+([\s\S]*?):::(?:\n|$)/);
            if (match) {
                let props = {};
                if (match[2]) {
                    try {
                        // Parse props string into key-value pairs
                        props = match[2].split(',').reduce((acc, prop) => {
                            const [key, value] = prop.trim().split('=');
                            if (key && value) {
                                // Remove quotes if present
                                acc[key.trim()] = value.trim().replace(/^["'](.+)["']$/, '$1');
                            }
                            return acc;
                        }, {} as Record<string, string>);
                    } catch (error) {
                        console.warn(`Warning: Failed to parse props for component ${match[1]}`, error);
                    }
                }

                return {
                    type: 'component',
                    raw: match[0],
                    name: match[1],
                    props,
                    content: match[3].trim()
                };
            }
        },
        renderer(token: any) {
            try {
                return registry.render(token.name, {
                    ...token.props,
                    children: marked.parse(token.content)
                });
            } catch (error) {
                console.error(`Error rendering component ${token.name}:`, error);
                return `<div class="alert alert-danger">Error rendering component ${token.name}</div>`;
            }
        }
    }]
});

async function renderMarkdown(filePath: string): Promise<{ metadata: DocMetadata; html: string }> {
    const source = await fs.readFile(filePath, 'utf-8')
    const { data, content } = matter(source)
    
    try {
        const html = await marked.parse(content)
        return { metadata: data as DocMetadata, html }
    } catch (error) {
        console.error('Error processing markdown:', error)
        throw error
    }
}

async function getDocFiles(): Promise<DocFile[]> {
    const files = await glob('**/*.md', { cwd: DOCS_DIR })
    
    const docs = await Promise.all(
        files.map(async (file) => {
            const filePath = path.join(DOCS_DIR, file)
            const { metadata, html } = await renderMarkdown(filePath)
            const category = path.dirname(file) === '.' ? 'general' : path.dirname(file)
            const slug = path.basename(file, '.md')
            
            return {
                slug,
                category,
                title: metadata.title || slug,
                path: file,
                metadata,
                html
            }
        })
    )
    
    return docs.sort((a, b) => (a.metadata.order || 999) - (b.metadata.order || 999))
}

async function buildSearchIndex(docs: DocFile[]): Promise<void> {
    const searchIndex = docs.map(doc => ({
        title: doc.title,
        description: doc.metadata.description,
        category: doc.category,
        slug: doc.slug,
        tags: doc.metadata.tags,
        path: `/docs/${doc.category}/${doc.slug}`
    }))
    
    await writeFile(
        path.join(BUILD_DIR, 'search-index.json'),
        JSON.stringify(searchIndex, null, 2)
    )
}

async function buildDocs() {
    try {
        console.log('🏗️  Building documentation...')
        
        // Create build directory
        await mkdir(BUILD_DIR, { recursive: true })
        
        // Get all docs
        const docs = await getDocFiles()
        const categories = [...new Set(docs.map(doc => doc.category))]
        
        // Build search index
        await buildSearchIndex(docs)
        console.log('📑 Built search index')
        
        // Save component styles
        await writeFile(
            path.join(PUBLIC_DIR, 'css', 'components.css'),
            registry.getAllStyles()
        )
        console.log('💅 Saved component styles')
        
        // Save processed docs
        await writeFile(
            path.join(BUILD_DIR, 'docs.json'),
            JSON.stringify({ docs, categories }, null, 2)
        )
        console.log('📚 Saved processed documentation')
        
        console.log('✨ Documentation build complete!')
    } catch (error) {
        console.error('❌ Error building documentation:', error)
        process.exit(1)
    }
}

// Run build if called directly
if (require.main === module) {
    buildDocs()
}

export { buildDocs } 