const logUtil = require('../utils/logUtil')
const errorMsg = require('../error/errorMsg')
const userInfoDal = require('../dal/userDal')
const errorCode = require('../error/errorCode')

/**
 * Registers a new account.
 * @param {*String} phoneNumber
 * @param {*String} password
 * @param {*String} nickName
 */
async function register (phoneNumber, password, nickName) {
  const functionName = 'server: managers/user/register'
  let result = { errorCode: errorCode.ERROR_PARAMETER, errorMsg: errorMsg.PARAMETER_ERRORMSG }

  if (phoneNumber && password && nickName) {
    try {
      result = await userInfoDal.register(phoneNumber, password, nickName)
    } catch (error) {
      result = { errorCode: errorCode.ERROR_DB, errorMsg: errorMsg.ERROR_INSERT_DB + error.message }
      logUtil.logErrorMsg(functionName, result.errorMsg)
    }
  }

  return result
}

/**
 * Login.
 * @param {*String} phoneNumber
 * @param {*String} password
 */
async function login (phoneNumber, password) {
  const funcName = 'server: managers/user/login'
  let result = { errorCode: errorCode.ERROR_PARAMETER, errorMsg: errorMsg.PARAMETER_ERRORMSG }

  if (phoneNumber && password) {
    try {
      result = await userInfoDal.login(phoneNumber, password)
    } catch (error) {
      result = { errorCode: errorCode.ERROR_DB, errorMsg: errorMsg.ERROR_LOAD_DBDATA + error.message }
      logUtil.logErrorMsg(funcName, result.errorMsg)
    }
  }

  return result
}

/**
 * Updates the user's personnal information.
 * @param {*Object} userInfo
 */
async function updateInfo (userInfo) {
  let result = { errorCode: errorCode.ERROR_PARAMETER, errorMsg: errorMsg.PARAMETER_ERRORMSG }

  if (userInfo) {
    try {
      result = await userInfoDal.updateInfo(userInfo)
    } catch (error) {
      result = { errorCode: errorCode.ERROR_DB, errorMsg: errorMsg.ERROR_INSERT_DB }
      logUtil.logErrorMsg('server: managers/user/update', result.errorMsg)
    }
  }

  return result
}

exports.register = register
exports.login = login
exports.updateInfo = updateInfo