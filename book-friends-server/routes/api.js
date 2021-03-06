const express = require('express')
const router = express.Router()
const user = require('./user')
const book = require('./book')
const admin = require('./admin/index')
const comment = require('./comment')
const dynamic = require('./dynamic')
const userBook = require('./userBook')
const feedBack = require('./feedback')
const userFriend = require('./userFriend')

router.use('/user', user)
router.use('/book', book)
router.use('/admin', admin)
router.use('/dynamic', dynamic)
router.use('/comment', comment)
router.use('/friend', userFriend)
router.use('/userbook', userBook)
router.use('/feedback', feedBack)

module.exports = router
