const { createLogger, format, transports } = require('winston');
const path = require('path');
const winston = require('winston');

// Define log file path
const logFile = path.join(__dirname, 'combined.log');

// Create logger
const logger = createLogger({
  level: 'info', // log info and above (info, warn, error)
  format: winston.format.json(),
  transports: [
    new transports.File({ filename: logFile }) // Save logs to file
  ],
});

module.exports = logger;
