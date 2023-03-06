const APP = require('../gnodejs')
const fs = require('fs')

const main = async () => {
  const result = await APP.ssh_shell(
    '3.137.190.165',
    7892,
    'ubuntu',
    null,
    Buffer.from(`-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtz
c2gtZWQyNTUxOQAAACD8i/hpc9Mf1/wGt4G33IdHJCEszSLGorxKGvTsNXfTRgAA
AIgllvU3JZb1NwAAAAtzc2gtZWQyNTUxOQAAACD8i/hpc9Mf1/wGt4G33IdHJCEs
zSLGorxKGvTsNXfTRgAAAEAwUQIBATAFBgMrZXAEIgQgxJR4EpgoDsZh+pUYHLgs
GvyL+Glz0x/X/Aa3gbfch0ckISzNIsaivEoa9Ow1d9NGAAAAAAECAwQF
-----END OPENSSH PRIVATE KEY-----`),
    null,
    'date'
  )
  console.log(result)
}
main()
