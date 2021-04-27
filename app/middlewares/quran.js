'use strict'

/**
 * Determines whether to include a language or not
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.showLangs = (req, res, next) => {
  const show = { ara: false, eng: false, ban: false }
  const { lang } = req.query

  if (lang) {
    if (lang.includes('ara')) show.ara = true
    if (lang.includes('eng')) show.eng = true
    if (lang.includes('ban')) show.ban = true
    if (!show.ara && !show.eng && !show.ban)
      show.ara = show.eng = show.ban = true
  } else show.ara = show.eng = show.ban = true

  res.locals.show = show
  next()
}