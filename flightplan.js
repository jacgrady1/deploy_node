var plan = require('flightplan');

var appName = 'helloworld-app';
var username = 'deploy';
var startFile = 'server/index.js';

var tmpDir = appName+'-' + new Date().getTime();

// configuration

plan.target('production', [
  {
    host: '123.57.244.149',
    username: username,
    password: 'LGX262lgx262', // figure out the ssh way
    agent: process.env.SSH_AUTH_SOCK
  },
//add in another server if you have more than one
// {
//   host: '104.131.93.216',
//   username: username,
//   agent: process.env.SSH_AUTH_SOCK
// }
]);

// run commands on localhost
plan.local(function(local) {
  // uncomment these if you need to run a build on your machine first
  local.log('Run build');
  local.exec('npm run build');

  local.log('Copy files to remote hosts');
  var filesToCopy = local.exec('git ls-files', {silent: true});
  // rsync files to all the destination's hosts
  local.transfer(filesToCopy, '/tmp/' + tmpDir);
});

// run commands on remote hosts (destinations)
plan.remote(function(remote) {
  remote.log('Move folder to root');
  remote.sudo('cp -R /tmp/' + tmpDir + ' ~', {user: username});
  remote.rm('-rf /tmp/' + tmpDir);

  remote.log('Install dependencies');
  remote.sudo('npm --production --prefix ~/' + tmpDir + ' install ~/' + tmpDir, {user: username});

  remote.log('Reload application');
  remote.sudo('ln -snf ~/' + tmpDir + ' ~/'+appName, {user: username});
  // remote.exec('cd ' + appName);
  // remote.exec('npm run web');
  remote.exec('forever stop ~/'+appName+'/'+startFile, {failsafe: true});
  remote.exec('forever start ~/'+appName+'/'+startFile);
});
