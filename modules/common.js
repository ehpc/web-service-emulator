/**
 * Вспомогательный модуль
 */

'use strict';

/**
 * Экранирует строку для использования в регулярном выражении
 * @param {string} str Строка
 * @returns {string}
 */
function escapeRegex(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

module.exports = {
	escapeRegex: escapeRegex
};
