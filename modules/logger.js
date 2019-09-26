/**
 * Модуль логирования
 */
'use strict';

const logger = require('winston');

// Настройки логирования
logger.remove(logger.transports.Console);
logger.add(logger.transports.File, {
	timestamp: true,
	filename: 'log/default.log'
});

module.exports = logger;
