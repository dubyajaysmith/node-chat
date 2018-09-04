// jshint esversion: 6, asi: true, laxcomma: true

const gulp = require('gulp')
    , spawn = require('child_process').spawn
    , killer = node => node ? node.kill() : null
;

let node


/**
 * $ gulp server
 * description: launch the server. If there's a server already running, kill it.
 */
gulp.task('server', () => {
    
  killer(node)

  node = spawn('node', ['index.js'], {stdio: 'inherit'})
  
  node.on('close', code => {
    if (code === 8) {
      gulp.log('Error detected, waiting for changes...')
    }
  })
})

/**
 * $ gulp
 * description: start the development environment
 * info: Need to watch for sass changes too? Just add another watch call!
 * info: Gulp is async by default.
 */
gulp.task('default', () => {

  gulp.run('server')

  gulp.watch(['./**/*', '!./tmp/*'], () => gulp.run('server'))

})

// clean up if an error goes unhandled.
process.on('exit', () => killer(node))