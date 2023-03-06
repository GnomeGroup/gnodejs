const APP = require('../gnodejs')

APP.xpr.load()

APP.xpr.add('all', '/', (res, ip, req) => res.json(false))

const main = async () => {
  await APP.xpr.start(80)
}
main()
