import { createNotificationEvent } from '../services/notification-service.js'

// 这一层是新代码进入持久化通知队列的薄包装。
// 旧的内存队列已经被 notification-service.ts 取代。

export async function notifyNewOrder(
  familyId: number,
  orderId: number,
  userName: string,
  mealType: string,
  items: string[],
): Promise<void> {
  const message = `🍽️ ${userName}点了${mealType}：${items.join('、')}`
  await createNotificationEvent({
    familyId,
    eventType: 'order_created',
    entityType: 'order',
    entityId: orderId,
    payload: {
      orderId,
      userName,
      mealType,
      items,
      message,
    },
  })
}

export async function notifyNewRecipe(
  familyId: number,
  recipeId: number,
  userName: string,
  recipeName: string,
  cookMinutes?: number,
): Promise<void> {
  let msg = `👨‍🍳 ${userName}新增菜谱：${recipeName}`
  if (cookMinutes !== undefined) {
    msg += `（预计${cookMinutes}分钟）`
  }
  await createNotificationEvent({
    familyId,
    eventType: 'recipe_created',
    entityType: 'recipe',
    entityId: recipeId,
    payload: {
      recipeId,
      userName,
      recipeName,
      cookMinutes,
      message: msg,
    },
  })
}

export async function notifyNewWish(
  familyId: number,
  wishId: number,
  userName: string,
  dishName: string,
): Promise<void> {
  await createNotificationEvent({
    familyId,
    eventType: 'wish_created',
    entityType: 'wish',
    entityId: wishId,
    payload: {
      wishId,
      userName,
      dishName,
      message: `🌟 ${userName}许愿想吃：${dishName}`,
    },
  })
}
