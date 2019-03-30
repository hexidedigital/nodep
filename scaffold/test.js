module.exports = {
  name: 'test',
  tasks: [
    'pwd',
    'echo',
    {
      'description': 'list all files in /var/www',
      'stages': ['all'],
      'command': 'ls -la'
    }
  ]
}