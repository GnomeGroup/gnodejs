const APP = require('../gnodejs')

const main = async () => {
  console.log('Start SSH Connection')
  const result = await APP.ssh_shell(
    '3.137.190.165',
    7892,
    'ubuntu',
    null,
    '/var/privateKey.pem',
    null,
    'date',
  )
  console.log('SSH Connected')
  console.log(result)
}
main()
