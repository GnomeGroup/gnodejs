const axios = require('axios')
const { execSync } = require('child_process')
const cors = require('cors')
const cMW = require('universal-cookie-express')
const express = require('express')
const fs = require('fs')
const http = require('http')
const https = require('https')
const fileUpload = require('express-fileupload')
const bouncerObject = require('express-bouncer')
const SOAP = require('strong-soap').soap
const SSH2 = require('ssh2')
const eMailer = require('nodemailer')

gnodejs = {
  app: null,
  TIME: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
    YEAR: 365 * 24 * 60 * 60 * 1000,
  },
  CONTENT_TYPE: {
    html: { 'Content-Type': 'text/html' },
    plain: { 'Content-Type': 'text/plain' },
    json: { 'Content-Type': 'application/json' },
  },
  shell: (command) => {
    let shellText = ''
    let shellResult = null
    try {
      shellResult = execSync(command, { stdio: 'pipe' })
    } catch (e) {
      shellText = e.stderr.toString()
    }
    if (shellResult) {
      shellText = shellResult.toString()
    }
    return shellText.trim()
  },
  now: (_) => new Date().getTime(),
  msFromNow: (start) => gnodejs.now() - start,
  isoDatetime: (start) => {
    let thisDateString = ''
    try {
      thisDateString = new Date(start ? parseInt(start) : null).toISOString()
    } catch (e) {}
    return thisDateString
  },
  replaceAll: (findThis, replace, string) =>
    string.split(findThis).join(replace),
  onlyNums: (string) => string.replace(/[^0-9]/g, ''),
  objCopy: (copyThis) => gnodejs.parse(gnodejs.stringify(copyThis)),
  stringify: (data) => {
    let response = ''
    try {
      response = JSON.stringify(data)
    } catch (error) {}
    return response
  },
  parse: (data) => {
    let response = null
    try {
      response = JSON.parse(data)
    } catch (error) {}
    return response
  },
  addCommas: (numberToEdit) => {
    let parts = numberToEdit.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
  },
  randomString: (length) => {
    let possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let text = ''
    while (text.length < length) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  },
  randomInt: (min, max) =>
    Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
    Math.ceil(min),
  files: {
    getDirList: (folder) => fs.readdirSync(folder),
    read: (fileName, type) => {
      try {
        return fs.readFileSync(fileName, type ? type : 'utf8')
      } catch (e) {
        return null
      }
    },
    mkdir: (folder) => fs.mkdirSync(folder),
    rmdir: (folder) => fs.rmdirSync(folder),
    delete: (fileName) => fs.unlinkSync(fileName),
    exists: (fileName) => fs.existsSync(fileName),
    write: (fileName, fileData) => fs.writeFileSync(fileName, fileData),
    append: (fileName, fileData) => fs.appendFileSync(fileName, fileData),
    copy: (sourceFile, destFile) => fs.copyFileSync(sourceFile, destFile),
    untar: (fileName, extractTo) =>
      fs.createReadStream(fileName).pipe(gunzip()).pipe(tar.extract(extractTo)),
  },
  getIP: (req) => {
    let thisIP =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null)
    return thisIP &&
      thisIP.substr(0, 7) == '::ffff:' &&
      gnodejs.checkIP(thisIP.substr(7))
      ? thisIP.substr(7)
      : thisIP
  },
  checkIP: (ip) =>
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      ip
    ),
  checkEmail: (email) =>
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email),
  xpr: {
    bouncer: null,
    homeFileLocation: null,
    keyCertFile: null,
    load: (keyCertFile, limitMB, bouncerSettings) => {
      if (keyCertFile) {
        gnodejs.xpr.keyCertFile = '/etc/letsencrypt/live/' + keyCertFile
      }
      gnodejs.app = express()
      gnodejs.app.use((err, req, res, next) => {
        if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
          console.error(err)
          return res.status(400).send({ status: 404, message: err.message })
        }
        next()
      })
      gnodejs.app.use(
        express.urlencoded({
          limit: (limitMB ? limitMB : '50') + 'mb',
          extended: false,
        })
      )
      gnodejs.app.use(
        express.json({
          limit: (limitMB ? limitMB : '50') + 'mb',
          extended: false,
        })
      )
      gnodejs.app.use(cors())
      gnodejs.app.use(cMW())
      gnodejs.app.use(fileUpload())
      if (bouncerSettings) {
        gnodejs.xpr.bouncer = bouncerObject(
          bouncerSettings.min,
          bouncerSettings.max,
          bouncerSettings.free
        )
      }
    },
    start: (port) =>
      new Promise((resolve) =>
        (gnodejs.xpr.keyCertFile
          ? https.createServer(
              {
                key: gnodejs.files.read(
                  gnodejs.xpr.keyCertFile + '/privkey.pem'
                ),
                cert: gnodejs.files.read(
                  gnodejs.xpr.keyCertFile + '/fullchain.pem'
                ),
              },
              gnodejs.app
            )
          : gnodejs.app
        ).listen(port, resolve)
      ),
    reply: (res, req, callback) =>
      callback(
        res,
        gnodejs.getIP(req),
        !req.body || gnodejs.stringify(req.body) == '{}'
          ? !req.params || gnodejs.stringify(req.params) == '{}'
            ? req.query
            : req.params
          : req.body,
        req.universalCookies,
        req.files,
        req.hostname
      ),
    add: (type, path, callback, sessionCheck) => {
      if (sessionCheck) {
        if (gnodejs.xpr.bouncer) {
          gnodejs.app[type](path, gnodejs.xpr.bouncer.block, (req, res, next) =>
            sessionCheck(
              req.headers.authorization && sessionCheck
                ? req.headers.authorization.replace('bearer ', '')
                : '',
              (session) =>
                gnodejs.xpr.reply(res, req, (res, ip, req, cke, fle, host) =>
                  callback(res, ip, req, session, fle, host, (_) =>
                    gnodejs.xpr.bouncer ? gnodejs.xpr.bouncer.reset(req) : null
                  )
                )
            )
          )
        } else {
          gnodejs.app[type](path, (req, res, next) =>
            sessionCheck(
              req.headers.authorization && sessionCheck
                ? req.headers.authorization.replace('bearer ', '')
                : '',
              (session) =>
                gnodejs.xpr.reply(res, req, (res, ip, req, cke, fle, host) =>
                  callback(res, ip, req, session, fle, host, (_) =>
                    gnodejs.xpr.bouncer ? gnodejs.xpr.bouncer.reset(req) : null
                  )
                )
            )
          )
        }
      } else {
        if (gnodejs.xpr.bouncer) {
          gnodejs.app[type](path, gnodejs.xpr.bouncer.block, (req, res, next) =>
            gnodejs.xpr.reply(res, req, (res, ip, req, cke, fle, host) =>
              callback(res, ip, req, cke, fle, host, (_) =>
                gnodejs.xpr.bouncer ? gnodejs.xpr.bouncer.reset(req) : null
              )
            )
          )
        } else {
          gnodejs.app[type](path, (req, res, next) =>
            gnodejs.xpr.reply(res, req, (res, ip, req, cke, fle, host) =>
              callback(res, ip, req, cke, fle, host, (_) =>
                gnodejs.xpr.bouncer ? gnodejs.xpr.bouncer.reset(req) : null
              )
            )
          )
        }
      }
    },
  },
  axios,
  http: async (ssl, host, method, port, header, path, data) =>
    (
      await axios({
        method,
        url:
          'http' +
          (ssl ? 's' : '') +
          ':' +
          (port ? ':' + port : '') +
          '//' +
          host +
          path,
        data,
        headers: {
          ...(header ? header : {}),
          ...(typeof data == 'object' ? gnodejs.CONTENT_TYPE.json : {}),
        },
      })
    ).data,
  fetch: async (url, method, header, data) =>
    (
      await axios({
        method,
        url,
        data,
        headers: {
          ...(header ? header : {}),
          ...(typeof data == 'object' ? gnodejs.CONTENT_TYPE.json : {}),
        },
      })
    ).data,
  session: {
    name: null,
    get: (size, cookies) => {
      if (!gnodejs.session.name) {
        gnodejs.session.name = gnodejs.randomString(size)
      }
      let sessionID = cookies.get(gnodejs.session.name)
      if (!sessionID || sessionID.length < size) {
        sessionID = gnodejs.randomString(size)
        cookies.set(gnodejs.session.name, sessionID)
      }
      return sessionID
    },
  },
  ssh_shell: (
    ip,
    portNumber,
    user,
    rawTextPassword,
    pkData,
    passPhrase,
    command
  ) =>
    new Promise((resolve, reject) => {
      let options = { host: ip, port: portNumber, username: user }
      if (rawTextPassword && rawTextPassword.length > 0) {
        options.password = rawTextPassword
      } else if (pkData && pkData.length > 0) {
        options.privateKey = pkData
        if (passPhrase && passPhrase.length > 0) {
          options.passphrase = passPhrase
        }
      }
      console.log(options)
      let serverConnect = new SSH2.Client()
      serverConnect.on('ready', (_) => {
        let commandsToRun = typeof command == 'string' ? [command] : command
        let responseText = ''
        let runNextServerCommand = (_) => {
          let thisCommand = commandsToRun.shift()
          if (thisCommand) {
            responseText += thisCommand + '\nRESPONSE\n'
            serverConnect.exec(thisCommand + '\n', (err, stream) => {
              if (err) {
                runNextServerCommand()
              } else {
                stream.on('data', (data) => {
                  responseText += data.toString()
                })
                stream.stderr.on('data', (data) => {
                  responseText += data.toString()
                })
                stream.on('close', (code, signal) => runNextServerCommand())
              }
            })
          } else {
            serverConnect.end()
            resolve(responseText)
          }
        }
        runNextServerCommand()
      })
      serverConnect.on('error', (data) => reject(data.toString()))
      serverConnect.connect(options)
    }),
  soap: (wsdlFile) =>
    new Promise((resolve, reject) =>
      SOAP.createClient(wsdlFile, {}, (err, client) => {
        if (err) {
          reject(err)
        } else {
          resolve(client)
        }
      })
    ),
  email: {
    account: null,
    transporter: null,
    load: (hostName, portNumber, isSecure, authUser, authPassword) => {
      gnodejs.email.transporter = eMailer.createTransport({
        host: hostName,
        port: portNumber ? parseInt(portNumber) : 465,
        secure: isSecure,
        auth: { user: authUser, pass: authPassword },
        tls: { rejectUnauthorized: false },
      })
      gnodejs.email.transporter.verify((error, success) => {
        if (!success) {
          gnodejs.email.transporter = null
          setTimeout(
            (_) =>
              gnodejs.email.load(
                hostName,
                portNumber,
                isSecure,
                authUser,
                authPassword
              ),
            10 * 60 * 1000
          )
        }
      })
    },
    send: (fromEmail, toEmail, subjectEmail, plainText, html) =>
      new Promise((resolve, reject) => {
        if (gnodejs.email.transporter) {
          let options = { from: fromEmail, to: toEmail, subject: subjectEmail }
          if (plainText) {
            options.text = plainText
          }
          if (html) {
            options.html = html
          }
          gnodejs.email.transporter.sendMail(options, resolve)
        } else {
          reject('No SMTP connected')
        }
      }),
  },
  selfDeploy: (sslCert, deployTo, pm2ProcessNumber) =>
    new Promise((resolve) => {
      let app = express()
      let sslKey = null
      let sslCertData = null
      let process = (req, res, next) => {
        try {
          console.log(
            gnodejs.shell(
              '/bin/sh ' +
                __dirname +
                '/gitDeploy.sh ' +
                deployTo +
                ' ' +
                parseInt(pm2ProcessNumber).toString()
            )
          )
        } catch (e) {
          console.log(e)
        }
        res.end('')
      }
      app.post('/', process)
      app.get('*', process)
      if (fs.existsSync(sslCert + '/privkey.pem')) {
        sslKey = fs.readFileSync(sslCert + '/privkey.pem', 'utf8')
        if (sslKey && fs.existsSync(sslCert + '/fullchain.pem')) {
          sslCertData = fs.readFileSync(sslCert + '/fullchain.pem', 'utf8')
        }
      }
      if (sslKey && sslCertData) {
        https
          .createServer({ key: sslKey, cert: sslCertData }, app)
          .listen(3420, (_) => {
            console.log('Githook enabled with SSL')
            if (resolve) {
              resolve()
            }
          })
      } else {
        http.createServer(app).listen(3420, (_) => {
          console.log('Githook enabled UNSECURE')
          if (resolve) {
            resolve()
          }
        })
      }
    }),
  decodeBase64Image: (dataString) => {
    let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    let imageResponse = {}
    if (matches.length !== 3) {
      return 'Invalid input string'
    }
    imageResponse.type = matches[1]
    imageResponse.data = new Buffer(matches[2], 'base64')
    return imageResponse
  },
  base64SaveToFile: (rawDataString, uploadToDirectory) => {
    try {
      let imageBuffer = gnodejs.decodeBase64Image(rawDataString)
      let imageTypeDetected = imageBuffer.type.match(/\/(.*?)$/)
      let newFile = gnodejs.randomString(25) + '.' + imageTypeDetected[1]
      gnodejs.files.write(uploadToDirectory + newFile, imageBuffer.data)
      return [null, newFile]
    } catch (error) {
      return [error, null]
    }
  },
}

module.exports = gnodejs
