module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    // First application
    {
      name: 'jasami-api',
      script: 'index.js',
      watch: ['dist'],
      ignore_watch: ['node_modules']
    }
  ]
};
