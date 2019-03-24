module.exports = {
  name: 'test',
  tasks: [
    'lsla',
    'echo',
    {
      'name': 'list all files in /var/www',
      'command': 'ls -la',
      'stages': ['all']
    }
  ]
}