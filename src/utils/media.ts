import * as config from '../config'
import * as fs from 'fs'
import * as path from 'path'
import * as malScraper from 'mal-scraper'
/**
 * Walk through a directory and return all files and directories
 * @param dir - The directory to walk through
 * @returns A promise that resolves to an array of file paths
 */

async function walk(dir: string): Promise<string[]> {
	const files: string[] = []
	const filesDirs = await fs.promises.readdir(dir, { withFileTypes: true })
	for (const file of filesDirs) {
		const filePath = path.join(dir, file.name)
		if (file.isDirectory()) {
			files.push(...(await walk(filePath)))
		} else {
			files.push(filePath)
		}
	}

	return files
}

/**
 * Example of how the media dirs are structured
 * /home/neko/Anime
 * ├── Anime 1
 * │   ├── cover.jpg
 * │   ├── banner.jpg
 * │   ├── info.ini
 * │   ├── Season 1
 * │   │   ├── 01.mp4
 * │   │   ├── 02.mp4
 * │   │   └── ...
 * │   ├── Season 2
 * │   │   ├── 01.mp4
 * │   │   ├── 02.mp4
 * │   │   └── ...
 * │   ── ...
 *
 * This is how the info.ini file is structured
 * [General]
 * Title=Anime 1
 * Type=TV
 * Genre=Action, Adventure, Comedy
 * Description=Anime 1 is a TV show about a group of friends who go on adventures.
 * Mal_ID=12345
 */

interface AnimeInfo {
	title: string
	id: string
	type: string
	genre: string[]
	description: string
	malId: number
	coverPath?: string
	bannerPath?: string
	seasons: {
		[key: string]: string[]
	}
	dateAdded: string
}

/**
 * Parse an info.ini file into an AnimeInfo object
 */
async function parseInfoFile(filePath: string): Promise<AnimeInfo> {
	const content = await fs.promises.readFile(filePath, 'utf-8')
	const lines = content.split('\n')
	const info: Partial<AnimeInfo> = {
		genre: [],
		seasons: {},
	}

	info.id = path.parse(filePath).dir.split('/').pop()!

	for (const line of lines) {
		const [key, value] = line.split('=').map((s) => s.trim())
		switch (key) {
			case 'Title':
				info.title = value
				break
			case 'Type':
				info.type = value
				break
			case 'Genre':
				info.genre = value.split(',').map((g) => g.trim())
				break
			case 'Description':
				info.description = value
				break
			case 'Mal_ID':
				info.malId = parseInt(value)
				break
			case 'Date_Added':
				info.dateAdded = value || new Date().toISOString()
				break
		}
	}

	return info as AnimeInfo
}

/**
 * Scan a media directory and return all anime information
 */
export async function scanMediaDirectory(dir: string): Promise<AnimeInfo[]> {
	const animeList: AnimeInfo[] = []
	const entries = await fs.promises.readdir(dir, { withFileTypes: true })

	for (const entry of entries) {
		if (!entry.isDirectory()) continue

		const animePath = path.join(dir, entry.name)
		const infoPath = path.join(animePath, 'info.ini')

		try {
			if (
				await fs.promises
					.access(infoPath)
					.then(() => true)
					.catch(() => false)
			) {
				const info = await parseInfoFile(infoPath)

				// Check for cover and banner
				const coverPath = path.join(animePath, 'cover.jpg')
				const bannerPath = path.join(animePath, 'banner.jpg')
				if (
					await fs.promises
						.access(coverPath)
						.then(() => true)
						.catch(() => false)
				) {
					info.coverPath = coverPath
				}
				if (
					await fs.promises
						.access(bannerPath)
						.then(() => true)
						.catch(() => false)
				) {
					info.bannerPath = bannerPath
				}

				// Scan for seasons and episodes
				const dirContents = await fs.promises.readdir(animePath, {
					withFileTypes: true,
				})
				for (const item of dirContents) {
					if (
						item.isDirectory() &&
						item.name.toLowerCase().includes('season')
					) {
						const seasonPath = path.join(animePath, item.name)
						const episodes = (await fs.promises.readdir(seasonPath))
							.filter((file) => file.endsWith('.mp4'))
							.sort((a, b) => {
								const numA = parseInt(path.parse(a).name)
								const numB = parseInt(path.parse(b).name)
								return numA - numB
							})
						info.seasons[item.name] = episodes.map((ep) =>
							path.join(seasonPath, ep),
						)
					}
				}

				animeList.push(info)
			}
		} catch (error) {
			console.error(`Error processing ${animePath}:`, error)
		}
	}

	return animeList
}

/**
 * Get MAL data for an anime
 */
export async function getMALData(malId: number) {
	try {
		return await malScraper.getInfoFromURL(
			`https://myanimelist.net/anime/${malId}`,
		)
	} catch (error) {
		console.error(`Error fetching MAL data for ID ${malId}:`, error)
		return null
	}
}
export async function searchAnime(query: string): Promise<AnimeInfo | null> {
	let animeInfo: AnimeInfo | null = null
	config.config.media.forEach(async (anime) => {
		animeInfo = await parseInfoFile(anime)
		if (animeInfo.title.toLowerCase().includes(query.toLowerCase())) {
			return animeInfo
		}
	})
	return animeInfo
}

// Add this function to get unique genres from all anime
export async function getAllGenres(directories: string[]): Promise<string[]> {
	try {
		// Get all anime from all directories
		const animeList = (
			await Promise.all(directories.map((dir) => scanMediaDirectory(dir)))
		).flat()

		// Extract all genres and flatten the array
		const allGenres = animeList.map((anime) => anime.genre).flat()

		// Remove duplicates and sort alphabetically
		const uniqueGenres = [...new Set(allGenres)].sort((a, b) =>
			a.localeCompare(b),
		)

		return uniqueGenres
	} catch (error) {
		console.error('Error getting genres:', error)
		return [] // Return empty array if error occurs
	}
}
