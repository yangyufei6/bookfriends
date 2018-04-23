const types = require('../utils/types')
const userDal = require('../dal/userDal')
const bookDal = require('../dal/bookDal')
const logUtil = require('../utils/logUtil')
const errorMsg = require('../error/errorMsg')
const errorCode = require('../error/errorCode')
const userBookDal = require('../dal/userBookDal')
const proxyConfig = require('../config/proxyConfig')
const commonRequest = require('../common/common_request')

/**
 * Gets user's books.
 * @param {*String} userId
 */
async function getUserBooks (userId) {
  const funcName = 'server: managers/userbook/getUserBooks'
  let result = { errorCode: errorCode.ERROR_PARAMETER, errorMsg: errorMsg.PARAMETER_ERRORMSG }

  if (!userId) {
    logUtil.logDebugMsg(funcName, result.errorMsg + 'userId is null')
    return result
  }

  let isbnArray = []
  try {
    const userBookInfos = await userBookDal.queryUserBookInfoByUserId(userId)
    // Gets the isbns of user's books.
    if (userBookInfos && userBookInfos.length > 0) {
      isbnArray = filterUserBookISBN(userBookInfos)
    }
  } catch (error) {
    result = { errorCode: errorCode.ERROR_DB, errorMsg: errorMsg.ERROR_LOAD_DBDATA + JSON.stringify(error) }
    logUtil.logErrorMsg(funcName, result.errorMsg)
  }

  // Querys user book's info.
  let userBooks = []
  if (isbnArray.length > 0) {
    try {
      for (let i = 0; i < isbnArray.length; i++) {
        const bookInfo = await bookDal.queryCertainFieldsByISBN(isbnArray[i])
        if (bookInfo) {
          userBooks.push(bookInfo)
        }
      }
    } catch (error) {
      result = { errorCode: errorCode.ERROR_DB, errorMsg: errorMsg.ERROR_LOAD_DBDATA + JSON.stringify(error) }
      logUtil.logErrorMsg(funcName, result.errorMsg)
    }
  }

  result = { errorCode: errorCode.SUCCESS, data: userBooks }

  return result
}

/**
 * User stores up onne book.
 * @param {*String} userId 用户ID
 * @param {*String} isbn 书籍的标识ISBN
 * @param {*Array} tags 书籍的标识
 */
async function storeUpBook (userId, isbn) {
  const funcName = 'server: managers/book/storeUpBook'
  let result = { errorCode: errorCode.ERROR_PARAMETER, errorMsg: errorMsg.PARAMETER_ERRORMSG }

  // Gets the book's tags according to book's isbn.
  let bookInfo = null

  // Validates the user info.
  if (userId) {
    const userInfo = await userDal.queryUserInfoById(userId)
    if (!userInfo) {
      result = { errorCode: errorCode.ERROR_USER_NOTEXISTED, errorMsg: `${errorMsg.USER_NOTEXISTED}, userId: ${userId}` }
      logUtil.logDebugMsg(funcName, result.errorMsg)
      return result
    }
  }

  if (isbn) {
    // 1. Querys the book's tags from local DB.
    const loadData = await bookDal.queryBookByISBN(isbn)
    if (loadData) {
      bookInfo = loadData
    } else {
      // 2. Querys the book's tags from douban if local DB does not exist.
      const reqData = {
        // isbn: isbn
      }
      // Calls proxy server.
      let response = null
      logUtil.logDebugMsg(funcName, JSON.stringify(reqData))
      try {
        response = await commonRequest.post(proxyConfig.getBookInfoByISBN(), reqData)
      } catch (error) {
        result = { errorCode: errorCode.ERROR_REQUEST, errorMsg: errorMsg.ERROR_REQUEST + JSON.stringify(error) }
        logUtil.logErrorMsg(funcName, result.errorMsg)
      }

      if (response) {
        response = JSON.parse(response)
        if (response.errorCode === errorCode.SUCCESS && response.data) {
          bookInfo = response.data
        } else {
          return response
        }
      } else {
        result = { errorCode: errorCode.ERROR_REQUEST, errorMsg: errorMsg.ERROR_REQUEST + 'Fails to call douban server: the response is null' }
        logUtil.logDebugMsg(funcName, result.errorMsg)
        return result
      }
    }
  }

  // Saves the book to db.
  if (bookInfo) {
    const mapBook = types.bookConvertor(bookInfo)
    if (mapBook) {
      const tags = types.tagsConvertor(mapBook.tags)
      try {
        const storeResult = await userBookDal.storeUpBook(userId, isbn, tags)
        if (storeResult.errorCode === errorCode.SUCCESS) {
          // async operation: save the query result to local DB.
          bookDal.saveBook(mapBook)
          result = { errorCode: errorCode.SUCCESS }
        } else {
          return storeResult
        }
      } catch (error) {
        result = { errorCode: errorCode.ERROR_DB, errorMsg: errorMsg.ERROR_INSERT_DB + JSON.stringify(error) }
        logUtil.logErrorMsg(funcName, result.errorMsg)
      }
    }
  }

  return result
}

/**
 * User unstores one book.
 * @param {*String} userId
 * @param {*String} isbn
 */
async function unstore (userId, isbn) {
  const funcName = 'server: managers/userbook/unstore'
  let result = { errorCode: errorCode.ERROR_PARAMETER, errorMsg: errorMsg.PARAMETER_ERRORMSG }

  if (userId && isbn) {
    let data = null
    try {
      // Validates the user info.
      const userInfo = await userDal.queryUserInfoById(userId)
      if (!userInfo) {
        result = { errorCode: errorCode.ERROR_USER_NOTEXISTED, errorMsg: `${errorMsg.USER_NOTEXISTED}, userId: ${userId}` }
        logUtil.logDebugMsg(funcName, result.errorMsg)
        return result
      }

      // Validates the user has stored the book.
      const userBook = await userBookDal.getUserBookByUserIdAndISBN(userId, isbn)
      if (!userBook) {
        result = { errorCode: errorCode.ERROR_HAVENOT_STORED, errorMsg: `${errorMsg.ERROR_HAVENOT_STORED}, userId: ${userId}; isbn: ${isbn}` }
        logUtil.logDebugMsg(funcName, result.errorMsg)
        return result
      }

      data = await userBookDal.unstore(userId, isbn)
    } catch (error) {
      result = { errorCode: errorCode.ERROR_MANAGER, errorMsg: errorMsg.ERROR_CALL_MANAGER + JSON.stringify(error) }
      logUtil.logErrorMsg(funcName, result.errorMsg)
    }

    if (data) {
      result = { errorCode: errorCode.SUCCESS }
    }
  }

  return result
}

/**
 * Filters and gets the isbns of the user's books.
 * @param {*Array} userBookInfos
 */
function filterUserBookISBN (userBookInfos) {
  let isbnArray = []

  if (userBookInfos && types.isArray(userBookInfos) && userBookInfos.length > 0) {
    userBookInfos.forEach(u => {
      const isbn = u.isbn
      if (isbnArray.indexOf(isbn) < 0) {
        isbnArray.push(isbn)
      }
    })
  }

  return isbnArray
}

exports.unstore = unstore
exports.storeUpBook = storeUpBook
exports.getUserBooks = getUserBooks