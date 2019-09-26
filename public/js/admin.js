/**
 * Модуль пользовательского интерфейса администратора
 */
'use strict';

$(function () {

	var $body = $('body'),
		model = new Model(),
		view = new View();

	model
		.load()
		.then(function () {

			// Редактирование описания сервиса
			$body.on('click', '.service .panel-heading .edit', function () {
				openEditor.call(
					this,
					'#serviceEditor',
					[
						{
							name: 'name',
							path: 'name'
						},
						{
							name: 'description',
							path: 'description'
						},
						{
							name: 'port',
							path: 'port'
						},
						{
							name: 'initialState',
							path: 'initialState'
						}
					],
					'.service-name'
				);
			});

			// Удаление сервиса
			$body.on('click', '.service .panel-heading .delete', function () {
				var $container = $(this).closest('.service'),
					id = $container.data('id'),
					name = $container.find('.service-name').text();
				if (confirm('Вы уверены, что хотите удалить сервис «' + name + '»?')) {
					model.deleteService(id);
					view.render(model.getData()).catch(console.error);
				}
			});

			// Редактирование события
			$body.on('click', '.service td.event .edit', function () {
				var index = $(this).closest('tr').index();
				openEditor.call(
					this,
					'#eventEditor',
					[
						{
							name: 'endpoint',
							path: 'stateTransitionTable[' + index + '].event.endpoint'
						},
						{
							name: 'input',
							path: 'stateTransitionTable[' + index + '].event.input'
						}
					]
				);
			});

			// Удаление события
			$body.on('click', '.service td.actions .delete', function () {
				var id = $(this).closest('.service').data('id'),
					index = $(this).closest('tr').index();
				if (confirm('Вы уверены, что хотите удалить событие?')) {
					model.delete(id, 'stateTransitionTable[' + index + ']');
					view.render(model.getData()).catch(console.error);
				}
			});

			// Редактирование перехода
			$body.on('click', '.service td.transition .edit', function () {
				var index1 = $(this).closest('tr').index(),
					index2 = $(this).closest('td').index() - 2;
				openEditor.call(
					this,
					'#transitionEditor',
					[
						{
							name: 'next',
							path: 'stateTransitionTable[' + index1 + '].transitions[' + index2 + '].next'
						},
						{
							name: 'output',
							path: 'stateTransitionTable[' + index1 + '].transitions[' + index2 + '].output'
						}
					]
				);
			});

			// Редактирование состояния
			$body.on('click', '.service th.state .edit', function () {
				var index = $(this).closest('th').index() - 2;
				openEditor.call(
					this,
					'#stateEditor',
					[
						{
							name: 'name',
							path: 'states[' + index + ']'
						}
					]
				);
			});

			// Удаление состояния
			$body.on('click', '.service th.state .delete', function () {
				var $container = $(this).closest('.service'),
					id = $container.data('id'),
					index = $(this).closest('th').index() - 2;
				if (confirm('Вы уверены, что хотите удалить состояние?')) {
					model.delete(id, 'states[' + index + ']');
					model.delete(id, 'stateTransitionTable.transitions[' + index + ']');
					view.render(model.getData()).catch(console.error);
				}
			});

			// Добавление события
			$body.on('click', '.service .addEvent', function () {
				var $container = $(this).closest('.service'),
					id = $container.data('id');
				model.addEvent(id);
				view.render(model.getData()).catch(console.error);
			});

			// Добавление состояния
			$body.on('click', '.service .addState', function () {
				var $container = $(this).closest('.service'),
					id = $container.data('id');
				model.addState(id);
				view.render(model.getData()).catch(console.error);
			});

			// Добавление сервиса
			$body.on('click', '#addService', function () {
				model.addService();
				view.render(model.getData()).catch(console.error);
			});

			// Сохранение всех изменений
			$body.on('click', '#saveAll', function () {
				var $this = $(this);
				$this.prop('disabled', true);
				model.save().then(function () {
					$this.prop('disabled', false);
				}).catch(function (err) {
					$this.prop('disabled', false);
					alert(err);
					console.error(err);
				});
			});

			// Отмена всех изменений
			$body.on('click', '#cancelAll', function () {
				if (confirm('Вы уверены, что хотите отменить все изменения?')) {
					window.location.reload();
				}
			});

		});

	/**
	 * Открывает редактор, заполняя его значениями
	 * @param {string} editorSelector Селектор для поиска редактора
	 * @param {string[]} fields Названия полей для заполнения
	 * @param {string} [headerField] Название поля для заполнения заголовка
	 */
	function openEditor(editorSelector, fields, headerField) {
		var $editor = $(editorSelector),
			$container = $(this).closest('.service'),
			id = $container.data('id');
		$editor.data('id', id);
		fields.forEach(function (field) {
			$editor.find('[name=' + field.name + ']').val(model.getFieldValue(id, field.path));
		});
		if (headerField) {
			$editor.find('.header-text').text($container.find(headerField).text());
		}
		// Сохранение
		$editor.off('click', 'button.save').on('click', 'button.save', function () {
			saveEditor.call(
				this,
				fields
			);
		});
		$editor.modal();
	}

	/**
	 * Сохранение изменений редактора
	 * @param {string[]} fields Названия полей для сохранения
	 */
	function saveEditor(fields) {
		var $editor = $(this).closest('.modal'),
			id = $editor.data('id');
		fields.forEach(function (field) {
			model.setFieldValue(id, field.path, $editor.find('[name=' + field.name + ']').val());
		});
		view.render(model.getData()).then(() => $editor.modal('hide')).catch(console.error);
	}

});
