export default class Werror extends Error {
	constructor(error: unknown, msg?: string) {
		if (error instanceof Error) {
			if (msg) {
				super(`${msg}: ${error.message}`)
			} else {
				super(error.message)
			}
		} else if (typeof error === 'string') {
			super(error)
		} else {
			throw new Error('Error is not an actual Error')
		}
	}
}