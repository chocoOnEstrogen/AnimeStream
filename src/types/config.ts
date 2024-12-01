export type Config = {
	media: string[]
	port: number
	host: string
	baseUrl: string
	discord: {
		clientId: string
		clientSecret: string
	}
	session: {
		secret: string
	}
}
