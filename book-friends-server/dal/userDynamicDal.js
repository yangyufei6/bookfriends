const UserDynamicInfo = require('../models').UserDynamicInfo
const PAGE_SIZE = require('../config/systemConfig').pageSize

/**
 * Publishes one dynamic.
 * @param {*Object} dynamicInfo
 */
async function addDynamicInfo (dynamicInfo) {
  let result = null

  if (dynamicInfo) {
    const userDynamicInfo = new UserDynamicInfo(dynamicInfo)
    result = await userDynamicInfo.save()
  }

  return result
}

/**
 * Adds likeCount for one dynamic.
 * @param {*String} dynamicId
 */
async function updateDynamicLikeCount (dynamicId) {
  let data = null

  if (dynamicId) {
    const find = await UserDynamicInfo.findOne({id: dynamicId, isActive: true})
    if (find) {
      data = await UserDynamicInfo.update({id: dynamicId}, {likeCount: find.likeCount + 1})
    }
  }

  return data
}

/**
 * Querys the certain user's dynamical info.
 * @param {*String} userId
 * @param {*Number} pageIndex
 */
async function queryDynamicIdsByUserId (userId, pageIndex) {
  let ids = []

  if (userId && pageIndex > 0) {
    const skipCount = (pageIndex - 1) * PAGE_SIZE
    ids = await UserDynamicInfo.find({userId: userId, isActive: true}, '-_id id createTime').sort({'createTime': -1})
      .skip(skipCount).limit(PAGE_SIZE)
  }

  return ids
}

/**
 * Querys the all dynamic infos.
 * @param {*Number} pageIndex
 */
async function queryAllDaynamicInfos (pageIndex) {
  let ids = null

  if (pageIndex > 0) {
    const skipCount = (pageIndex - 1) * PAGE_SIZE
    ids = await UserDynamicInfo.find({isActive: true}, '-_id -__v id createTime').sort({'createTime': -1})
      .skip(skipCount).limit(PAGE_SIZE)
  }

  return ids
}

/**
 * Querys the certain dynamic info's comments.
 * @param {*String} dynamicId
 */
async function queryDynamicInfoByDynamicId (dynamicId) {
  let data = null

  if (dynamicId) {
    data = await UserDynamicInfo.findOne({id: dynamicId, isActive: true}, '-_id id content likeCount createTime isbn')
  }

  return data
}

exports.addDynamicInfo = addDynamicInfo
exports.queryAllDaynamicInfos = queryAllDaynamicInfos
exports.updateDynamicLikeCount = updateDynamicLikeCount
exports.queryDynamicIdsByUserId = queryDynamicIdsByUserId
exports.queryDynamicInfoByDynamicId = queryDynamicInfoByDynamicId
