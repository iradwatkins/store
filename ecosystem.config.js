module.exports = {
  apps: [{
    name: 'stores-stepperslife',
    script: 'npm',
    args: 'start',
    cwd: '/root/websites/stores-stepperslife',
    env: {
      PORT: 3008,
      NODE_ENV: 'production'
    }
  }]
}
