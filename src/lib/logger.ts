import pino from 'pino'

const options = {
	timestamp: () => `,"time":"${String(new Date())}"`
}

export default pino(options, pino.destination({
	dest: 'logs/balancer.log',
	// minLength: 8192,
	minLength: 0
}))