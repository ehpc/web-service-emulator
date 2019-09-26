'use strict';

(function ($) {

	/**
	 * Основной вид
	 * @constructor
	 */
	function View() {

	}

	/**
	 * Рендеринг вида
	 * @param {object} data Параметры приложения
	 * @returns {Promise}
	 */
	View.prototype.render = function (data) {
		var that = this;
		return new Promise(function (resolve, reject) {
			$.ajax(
				'/render/admin',
				{
					method: 'POST',
					dataType: 'html',
					contentType: 'application/json; charset=utf-8',
					data: JSON.stringify(data)
				}
			).then(function (html) {
				$('#mainView').html(html);
				resolve(that);
			}).fail(function (err) {
				reject(err);
			});
		});
	};

	window.View = View;

})(jQuery);
