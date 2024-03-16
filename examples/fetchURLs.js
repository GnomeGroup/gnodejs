const APP = require('../gnodejs')

const main = async () => {
  let result = await APP.http(
    true,
    'www.gobanq.com',
    'GET',
    null,
    null,
    '/p/prices.json',
    null,
  )
  console.log(result)

  result = await APP.fetch(
    'https://www.gobanq.com/p/prices.json',
    'GET',
    null,
    null,
  )
  console.log(result)

  /*
      let newPrices = await (
        await APP.http(
          true,
          'www.gobanq.com',
          'get',
          443,
          {},
          '/p/prices.json',
          {}
        )
      ).json()
      let newPrices = await APP.axios.get(
        true,
        'www.gobanq.com',
        'get',
        443,
        {},
        '/p/prices.json',
        {}
      )



      let result = await (
        await APP.http(
          true,
          'api.telegram.org',
          'POST',
          443,
          { 'Content-Type': 'application/json' },
          '/bot' + API_KEY + '/' + operation,
          packageToSend
        )
      ).json()
      let result = await APP.http(
        true,
        'api.telegram.org',
        'POST',
        443,
        { 'Content-Type': 'application/json' },
        '/bot' + API_KEY + '/' + operation,
        packageToSend
      )

      */
}
main()
