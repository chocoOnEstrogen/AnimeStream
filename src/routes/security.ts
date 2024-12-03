import { Router, Request, Response } from 'express'
import { supabase } from '../utils/supabase'
import { render } from '../utils/request'
import { marked } from 'marked'
import { requireAdmin } from '../middleware/auth'
import crypto from 'crypto'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'

const router = Router()

function generateCveId(): string {
    const year = new Date().getFullYear()
    const sequence = crypto.randomInt(1000, 9999).toString().padStart(4, '0')
    return `CVE-${year}-${sequence}`
}

// Define validation schemas
const reportSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  steps: z.string().min(1).max(5000),
  impact: z.string().min(1).max(5000),
  name: z.string().optional(),
  email: z.string().email().optional()
})

// Public security overview page
router.get('/', async (req: Request, res: Response) => {
    try {
        const { data: advisories } = await supabase
            .from('security_advisories')
            .select(`
                *,
                author:author_id (
                    username,
                    avatar
                )
            `)
            .eq('status', 'published')
            .order('published_at', { ascending: false })

        render(req, res, 'security/index', {
            title: 'Security Advisories',
            advisories: advisories || []
        })
    } catch (error) {
        console.error('Security page error:', error)
        render(req, res, 'error', {
            error: 'Failed to load security advisories',
            title: 'Security Advisories'
        })
    }
})

// Security report form
router.get('/report', async (req: Request, res: Response) => {
    render(req, res, 'security/report', {
        title: 'Report Security Vulnerability'
    })
})


// Individual advisory page
//@ts-ignore
router.get('/:cveId', async (req: Request, res: Response) => {
    try {
        const { cveId } = req.params
        const asJson = req.query.json === 'true'

        // Validate CVE ID format
        if (!/^CVE-\d{4}-\d{4,}$/i.test(cveId)) {
            return res.status(400).json({ error: 'Invalid CVE ID format' })
        }

        // Only show published advisories to non-admin users
        const query = supabase
            .from('security_advisories')
            .select(`
                *,
                author:author_id (
                    username,
                    avatar
                )
            `)
            .eq('cve_id', cveId)

        if (!req.user?.roles?.includes('admin')) {
            query.eq('status', 'published')
        }

        const { data: advisory } = await query.single()

        if (!advisory) {
           if (asJson) {
               return res.status(404).json({ error: 'Advisory not found' })
           } else {
            return render(req, res, 'error', {
                error: 'Advisory not found',
                    title: 'Security Advisory Not Found'
                })
            }
        }

        // Convert markdown to HTML
        const html = marked(advisory.description)

        console.log(JSON.stringify(advisory, null, 4))

        if (asJson) {
            return res.json(advisory)
        } else {
            render(req, res, 'security/advisory', {
                title: advisory.title,
            advisory: {
                ...advisory,
                description: html
                }
            })
        }
    } catch (error) {
        console.error('Security advisory error:', error)
        render(req, res, 'error', {
            error: 'Failed to load security advisory',
            title: 'Security Advisory Not Found'
        })
    }
})

// Add rate limiting to sensitive endpoints
const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // 5 reports per IP per hour
})

// Submit security report
router.post('/report', reportLimiter, async (req: Request, res: Response) => {
    try {
        // Validate input
        const validatedData = reportSchema.parse(req.body)
        
        // Sanitize markdown input
        const sanitizedDescription = validatedData.description
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/style=/gi, '')
            .replace(/class=/gi, '')
            .replace(/id=/gi, '')
            .replace(/src=/gi, '')
        
        // Create a private draft advisory with sanitized input
        const { data, error } = await supabase
            .from('security_advisories')
            .insert([{
                id: crypto.randomUUID(),
                title: `[REPORT] ${validatedData.title}`,
                description: `## Impact\n${validatedData.impact}\n\n## Steps to Reproduce\n${validatedData.steps}\n\n## Description\n${sanitizedDescription}`,
                severity: validatedData.severity,
                status: 'draft',
                cve_id: generateCveId(),
                author_id: req.user?.id || null,
                metadata: {
                    reported_by: req.user?.id ? undefined : {
                        name: validatedData.name || 'Anonymous',
                        email: validatedData.email || 'Not provided'
                    },
                    report_date: new Date().toISOString()
                }
            }])
            .select()
            .single()

        if (error) throw error

        // Return minimal information
        res.json({ success: true, id: data.id })
    } catch (error) {
        console.error('Security report error:', error)
        res.status(error instanceof z.ZodError ? 400 : 500).json({ 
            error: error instanceof Error ? error.message : 'Failed to submit security report'
        })
    }
})

// Delete security advisory
//@ts-ignore
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params
    await supabase.from('security_advisories').delete().eq('id', id)
    res.json({ success: true })
})

export default router 