import { request, session, key } from './api'

let pendingToken = '', pending = new Map()

// Share retry identifiers between the hall and detail page for the current login.
// A lost response may still have created an order, so only clear after a known success.
export async function acceptRequest(item) {
  const token = session.token
  if (pendingToken !== token) { pendingToken = token; pending = new Map() }
  const attempts = pending, id = Number(item.id)
  if (!attempts.has(id)) attempts.set(id, key())
  const order = await request('/boost/orders/accept', 'POST', {
    listingId: id, requestKey: attempts.get(id), quoteKey: item.quoteKey
  })
  if (session.token !== token) throw new Error('登录状态已变化，请到我的订单查看接单结果')
  attempts.delete(id)
  return order
}
