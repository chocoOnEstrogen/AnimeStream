import express, { RequestHandler, Request, Response } from 'express'
import crypto from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'
import { config } from '../config'

const router = express.Router()
const execAsync = promisify(exec)

/**
 * Verify that the webhook request is from GitHub
 */
function verifyGitHubWebhook(req: Request): boolean {
    const signature = req.headers['x-hub-signature-256']
    if (!signature || typeof signature !== 'string') return false

    // Calculate expected signature
    const hmac = crypto.createHmac('sha256', config.github.webhookSecret)
    const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex')
    
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

/**
 * Update and restart the application using PM2
 */
async function updateAndRestart() {
    try {
        // Pull latest changes
        console.log('Pulling latest changes...')
        await execAsync('git pull')

        // Install dependencies and build
        console.log('Installing dependencies and building...')
        await execAsync('npm install')
        await execAsync('npm run build')

        // Restart using PM2
        console.log('Restarting application via PM2...')
        await execAsync('pm2 restart AnimeStream')
        
        console.log('Update and restart completed successfully')
    } catch (error) {
        console.error('Failed to update and restart:', error)
        throw error
    }
}

//@ts-ignore
router.post('/webhook', express.json(), async (req: Request, res: Response) => {
    try {
        // Verify webhook signature
        if (!verifyGitHubWebhook(req)) {
            console.warn('Invalid webhook signature received')
            return res.status(401).json({ error: 'Invalid signature' })
        }

        // Check if it's a push event
        if (req.headers['x-github-event'] !== 'push') {
            return res.status(200).json({ message: 'Ignored non-push event' })
        }

        // Start the update process
        res.status(200).json({ message: 'Update process started' })
        
        // Perform update after response is sent
        await updateAndRestart()
    } catch (error) {
        console.error('Webhook error:', error)
        // Don't send error response here as we might have already sent a response
    }
}) as RequestHandler

export default router 