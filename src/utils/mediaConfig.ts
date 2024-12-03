import { existsSync } from 'fs'
import { normalize } from 'path'

/**
 * Parse the media config string into an array of validated filesystem paths
 * @param config - Comma-separated string of file system paths
 * @returns Array of normalized, existing filesystem paths
 * @throws {Error} If config is empty or not a string
 * @example
 * parseMediaConfig('/home/neko/Anime,/home/neko/Manga')
 * // Returns ['/home/neko/Anime', '/home/neko/Manga']
 */
export function parseMediaConfig(config: string): string[] {
    if (!config || typeof config !== 'string') {
        throw new Error('Media config must be a non-empty string')
    }

    return config
        .split(',')
        .map(path => path.trim())
        .filter(path => path.length > 0)
        .map(path => normalize(path))
        .filter(path => {
            const exists = existsSync(path)
            if (!exists) {
                console.warn(`Media path "${path}" does not exist`)
            }
            return exists
        })
}
