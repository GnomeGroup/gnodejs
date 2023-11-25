const APP = require('../gnodejs')

const main = async () => {
  let result = await APP.http(
    true,
    'www.gobanq.com',
    'GET',
    null,
    null,
    '/p/prices.json',
    null
  )
  console.log(result)

  result = await APP.fetch(
    'https://www.gobanq.com/p/prices.json',
    'GET',
    null,
    null
  )
  console.log(result)
}
main()
