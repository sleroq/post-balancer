import i18next from 'i18next'
import Backend from 'i18next-fs-backend'

import { join } from 'path'
import { readdirSync, lstatSync } from 'fs'

import parentLogger from './logger'
const logger = parentLogger.child({
	module: 'i18n',
})

void i18next
	.use(Backend)
	.init({
		// debug: true,
		initImmediate: false,
		fallbackLng: 'en',
		lng: 'en',
		preload: readdirSync('locales').filter((fileName) => {
			const joinedPath = join('locales', fileName)
			const isDirectory = lstatSync(joinedPath).isDirectory()
			return isDirectory
		}),
		ns: ['locale'],
		defaultNS: 'locale',
		saveMissing: true,
		missingKeyHandler: function (lngs, ns, key, fallbackValue) {
			logger.warn({ fallbackValue }, `key "${key}" is missing`)
		},
		backend: {
			loadPath: 'locales/{{lng}}/{{ns}}.yaml'
		}
	})

export default i18next