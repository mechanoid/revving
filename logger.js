const winston = require('winston')

const transports = {
  console: new winston.transports.Console({ level: 'info' })
}

module.exports = {
  logger: winston.createLogger({
    format: winston.format.simple(),
    transports: [transports.console]
  }),
  transports
}
