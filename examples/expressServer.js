const APP = require('../gnodejs')

console.log('Load Express Server')
APP.xpr.load()

console.log('Add Express Server Endpoints')
APP.xpr.add('all', '/', (res, ip, req) => res.json(false))

const main = async () => {
  console.log('Start Express Server on Port 80')
  await APP.xpr.start(80)
  console.log('Express Server Started on Port 80')
}
main()
