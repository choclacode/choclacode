const marked = require('marked')

const Surah = require('../../../models/Surah')

const bot = 'chocoBot'
const emoticons = {
  shrug: '¯\\\\\\_(ツ)\\_/¯',
  tableflip: '(╯°□°）╯︵ ┻━┻',
  unflip: '┬─┬ ノ( ゜-゜ノ)',
}

const helpMsg = (name) => `Here you go @${name} \n
  @user \n &nbsp;&nbsp; - mention @user \n
  @chocoBot help \n &nbsp;&nbsp; - show this message
  @chocoBot lstyle \n &nbsp;&nbsp; - show list of stylistic commands
  @chocoBot inspire <surah>:<ayah> \n &nbsp; &nbsp; - inspire with the mentioned or a random verse
  @chocoBot tip \n &nbsp;&nbsp; - show some tips \n`
const styleMsg = (name) => `Here you go @${name} \n
\\*\\*Bold\\*\\* / \\_\\_Bold\\_\\_ - __Bold__
\\*Italics\\* / \\_Italics\\_ - _Italics_
\\~\\~Strike\\~\\~ - ~~Strike~~
\\\`Mono\\\` - \`Mono\``
const tipmsg = `Double tap a message to react to it ❤️
Hold alt key and press up or down key to navigate between your sent messages ✏️
-p [ ... @user1 , @user2 ] &lt;msg&gt; \n &nbsp;&nbsp; - send private message to mentioned users`

const getTime = (d = new Date()) => {
  const h = d.getHours()
  const m = d.getMinutes()
  const g = (v) => (v / 10 < 1 ? `0${v}` : v)
  return `${g(h)}:${g(m)}`
}
const inspire = (msg) => {
  let surahNo, ayahNo
  if (msg) [surahNo, ayahNo] = msg.split(':')

  if (
    isNaN(surahNo) ||
    !isFinite(surahNo) ||
    parseInt(surahNo) < 1 ||
    114 < parseInt(surahNo)
  )
    surahNo = Math.floor(Math.random() * 114) + 1

  const { info, surah } = Surah.findById(parseInt(surahNo))

  if (
    isNaN(ayahNo) ||
    !isFinite(ayahNo) ||
    parseInt(ayahNo) < 1 ||
    surah.length < parseInt(ayahNo)
  )
    ayahNo = Math.floor(Math.random() * (surah.length - 1)) + 1

  const ayah = surah[parseInt(ayahNo) - 1]
  return `${ayah.ara} \n\n ${ayah.eng} \n\n ${ayah.ban} \n
  #${info.eng} - ${info.num} : ${parseInt(ayahNo)}`
}
const msgify = (msg) =>
  marked(
    msg
      .trim()
      .replace(/\n/g, ' <br> ')
      .replace(/&lt;br&gt;/g, '<br>')
  )
const emotify = (msg) => {
  if (!msg.startsWith('/')) return msg

  return emoticons[msg.substring(1, msg.length)] ?? msg
}
const cleanify = (msg) =>
  (msg.startsWith('@') || msg.startsWith('#')) && msg.length > 1
    ? `<span class="title">${msg}</span>`
    : emotify(msg.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
const markupify = ({ name, msg, time }) => {
  msg = msgify(
    msg
      .split('\n')
      .map((m) => ` ${m} `)
      .join('\n')
      .split(' ')
      .map((m) => cleanify(m))
      .join(' ')
  )
  const id = `msg-${Math.random()}-_-${Math.random()}`
  const msgDiv = `<div class="msg">
    <span class="text">${msg}</span>
    <span class="time">${time}</span>
  </div>`
  const nameDiv = `<span class="name">@${name}</span>`
  return {
    name,
    id,
    self: `<li class="self" data-id="${id}" data-likes="0">${msgDiv}</li>`,
    msg: `<li data-id="${id}" data-likes="0">${nameDiv}${msgDiv}</li>`,
    msgNoName: `<li data-id="${id}" data-likes="0">${msgDiv}</li>`,
  }
}
const botMsg = (msg, time = getTime()) => markupify({ name: bot, msg, time })

exports.discuss = (io) => {
  let users = []

  const like = (id) => io.sockets.emit('msglike__discuss', { id })
  const likeMsg = (id, msg) => {
    like(id)
    return msg
  }

  io.on('connection', (socket) => {
    let _name
    socket.emit('connection')
    socket.on('newuser__discuss', ({ name }) => {
      _name = name
      users = users.includes({ name })
        ? users
        : [...users, { name, id: socket.id }]
      socket.emit(
        'sendmsg__discuss',
        botMsg(`Welcome to the discussion area, @${_name} ! 👋️`)
      )
      socket.broadcast.emit(
        'sendmsg__discuss',
        botMsg(`@${_name} joined the discussion 😀️`)
      )
      io.sockets.emit(
        'users__discuss',
        users.map(({ name }) => name)
      )
    })
    socket.on('newmsg__discuss', ({ name, msg }) => {
      const msgToSend = markupify({ name, msg, time: getTime() })
      const mentions = msg
        .split(/\s+/gs)
        .filter((m) => m.startsWith('@'))
        .map((m) => m.slice(1))
      socket.emit('sendmsg__discuss', msgToSend)
      if (!msg.match(/^\s*-p\s+/g))
        socket.broadcast.emit('sendmsg__discuss', msgToSend)
      mentions.length &&
        mentions.forEach((n) => {
          if (n == 'chocoBot')
            io.sockets.emit(
              'sendmsg__discuss',
              botMsg(
                msg.toLowerCase().includes('thank')
                  ? likeMsg(msgToSend.id, `My pleasure @${name} 😊️`)
                  : msg.toLowerCase().includes('help')
                  ? helpMsg(name)
                  : msg.toLowerCase().includes('lstyle')
                  ? styleMsg(name)
                  : msg.toLowerCase().includes('tip')
                  ? tipmsg
                  : msg.toLowerCase().includes('inspire')
                  ? inspire(msg.split(/\s+/g)[2])
                  : msg == `@${n}`
                  ? `I am here @${name} 🙂️ \n Need some #help ?`
                  : Math.random() > 0.5
                  ? `Yeah dear @${name}`
                  : `/shrug @${name}`
              )
            )
          else if (n.toLowerCase() == 'everyone')
            io.sockets.emit(
              'sendmsg__discuss',
              botMsg(likeMsg(msgToSend.id, `@${name} mentioned everyone`))
            )
          else {
            const user = users.find((u) => u.name == n)
            if (user) {
              if (msg.match(/^\s*-p\s+/g))
                socket.to(user.id).emit('sendmsg__discuss', msgToSend)
              else
                socket
                  .to(user.id)
                  .emit('sendmsg__discuss', botMsg(`@${name} mentioned you`))
            }
          }
        })
    })
    socket.on('msglike__discuss', ({ id }) => like(id))
    socket.on('disconnect', () => {
      users = users.filter(({ name }) => name != _name)
      socket.broadcast.emit(
        'sendmsg__discuss',
        botMsg(`@${_name} left the discussion 😥️`)
      )
      socket.broadcast.emit(
        'users__discuss',
        users.map(({ name }) => name)
      )
    })
  })
}
