module.exports = grunt => {

	const jsPaths = ['Gruntfile.js', 'app.js', 'test/**/*.js'];

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			options: {
				browser: false,
				forin: true,
				latedef: 'nofunc',
				noempty: true,
				undef: true,
				laxbreak: true,
				eqeqeq: true,
				esversion: 6,
				node: true,
				varstmt: true,
				globals: {
					describe: true,
					it: true,
					req: true,
					testPost: true,
					testGet: true,
					testPut: true,
					before: true,
					after: true
				},
				ignores: []
			},
			all: {
				src: jsPaths
			}
		},
		jscs: {
			src: jsPaths,
			options: {
				fix: false,
				config: '.jscsrc'
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-jscs');

	grunt.registerTask('build', ['jshint', 'jscs']);

};
