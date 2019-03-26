module.exports = {
  name: 'test',
  tasks: [
    'pwd',
    'echo',
    {
      'description': 'list all files in /var/www',
      'command': ['ls -la'],
      'stages': ['all']
    }
  ]
}