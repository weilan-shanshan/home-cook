import { sql } from 'drizzle-orm'
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
  check,
} from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('member'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export const families = sqliteTable('families', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type Family = typeof families.$inferSelect
export type NewFamily = typeof families.$inferInsert

export const familyMembers = sqliteTable(
  'family_members',
  {
    familyId: integer('family_id')
      .notNull()
      .references(() => families.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    joinedAt: text('joined_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.familyId, t.userId] }),
  }),
)

export type FamilyMember = typeof familyMembers.$inferSelect
export type NewFamilyMember = typeof familyMembers.$inferInsert

export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  familyId: integer('family_id')
    .notNull()
    .references(() => families.id),
  title: text('title').notNull(),
  description: text('description'),
  steps: text('steps'),
  cookMinutes: integer('cook_minutes'),
  servings: integer('servings').default(2),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type Recipe = typeof recipes.$inferSelect
export type NewRecipe = typeof recipes.$inferInsert

export const recipeImages = sqliteTable('recipe_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  thumbUrl: text('thumb_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type RecipeImage = typeof recipeImages.$inferSelect
export type NewRecipeImage = typeof recipeImages.$inferInsert

export const tags = sqliteTable(
  'tags',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    familyId: integer('family_id')
      .notNull()
      .references(() => families.id),
    name: text('name').notNull(),
  },
  (t) => ({
    unqFamilyName: unique('tags_family_id_name_unique').on(
      t.familyId,
      t.name,
    ),
  }),
)

export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert

export const recipeTags = sqliteTable(
  'recipe_tags',
  {
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.recipeId, t.tagId] }),
  }),
)

export type RecipeTag = typeof recipeTags.$inferSelect
export type NewRecipeTag = typeof recipeTags.$inferInsert

export const cookLogs = sqliteTable('cook_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id),
  cookedBy: integer('cooked_by')
    .notNull()
    .references(() => users.id),
  cookedAt: text('cooked_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  note: text('note'),
})

export type CookLog = typeof cookLogs.$inferSelect
export type NewCookLog = typeof cookLogs.$inferInsert

export const ratings = sqliteTable(
  'ratings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cookLogId: integer('cook_log_id')
      .notNull()
      .references(() => cookLogs.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    score: integer('score').notNull(),
    comment: text('comment'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    unqCookLogUser: unique('ratings_cook_log_id_user_id_unique').on(
      t.cookLogId,
      t.userId,
    ),
    scoreRange: check('ratings_score_check', sql`${t.score} >= 1 AND ${t.score} <= 5`),
  }),
)

export type Rating = typeof ratings.$inferSelect
export type NewRating = typeof ratings.$inferInsert

export const wishes = sqliteTable('wishes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  familyId: integer('family_id')
    .notNull()
    .references(() => families.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  dishName: text('dish_name').notNull(),
  note: text('note'),
  status: text('status').notNull().default('pending'),
  recipeId: integer('recipe_id').references(() => recipes.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type Wish = typeof wishes.$inferSelect
export type NewWish = typeof wishes.$inferInsert

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  familyId: integer('family_id')
    .notNull()
    .references(() => families.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  cookUserId: integer('cook_user_id').references(() => users.id),
  mealType: text('meal_type').notNull(),
  mealDate: text('meal_date').notNull(),
  note: text('note'),
  status: text('status').notNull().default('submitted'),
  completedAt: text('completed_at'),
  cancelledAt: text('cancelled_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export const orderStatusEvents = sqliteTable('order_status_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  operatorId: integer('operator_id').references(() => users.id),
  note: text('note'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type OrderStatusEvent = typeof orderStatusEvents.$inferSelect
export type NewOrderStatusEvent = typeof orderStatusEvents.$inferInsert

export const notificationEvents = sqliteTable('notification_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  familyId: integer('family_id')
    .notNull()
    .references(() => families.id),
  eventType: text('event_type').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  payload: text('payload').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  sentAt: text('sent_at'),
  lastError: text('last_error'),
})

export type NotificationEvent = typeof notificationEvents.$inferSelect
export type NewNotificationEvent = typeof notificationEvents.$inferInsert

export const notificationDeliveries = sqliteTable('notification_deliveries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  notificationId: integer('notification_id')
    .notNull()
    .references(() => notificationEvents.id),
  targetUserId: integer('target_user_id')
    .notNull()
    .references(() => users.id),
  channel: text('channel').notNull().default('wechat'),
  status: text('status').notNull().default('pending'),
  attemptCount: integer('attempt_count').notNull().default(0),
  lastError: text('last_error'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type NotificationDelivery = typeof notificationDeliveries.$inferSelect
export type NewNotificationDelivery = typeof notificationDeliveries.$inferInsert

export const orderComments = sqliteTable('order_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  roleType: text('role_type').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type OrderComment = typeof orderComments.$inferSelect
export type NewOrderComment = typeof orderComments.$inferInsert

export const orderReviews = sqliteTable(
  'order_reviews',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    score: integer('score').notNull(),
    tasteScore: integer('taste_score').notNull(),
    portionScore: integer('portion_score').notNull(),
    overallNote: text('overall_note'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    unqOrderReviewUser: unique('order_reviews_order_id_user_id_unique').on(
      t.orderId,
      t.userId,
    ),
    scoreRange: check('order_reviews_score_check', sql`${t.score} >= 1 AND ${t.score} <= 5`),
    tasteScoreRange: check('order_reviews_taste_score_check', sql`${t.tasteScore} >= 1 AND ${t.tasteScore} <= 5`),
    portionScoreRange: check('order_reviews_portion_score_check', sql`${t.portionScore} >= 1 AND ${t.portionScore} <= 5`),
  }),
)

export type OrderReview = typeof orderReviews.$inferSelect
export type NewOrderReview = typeof orderReviews.$inferInsert

export const orderLikes = sqliteTable(
  'order_likes',
  {
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.orderId, t.userId] }),
  }),
)

export type OrderLike = typeof orderLikes.$inferSelect
export type NewOrderLike = typeof orderLikes.$inferInsert

export const orderShares = sqliteTable('order_shares', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  shareType: text('share_type').notNull(),
  channel: text('channel').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type OrderShare = typeof orderShares.$inferSelect
export type NewOrderShare = typeof orderShares.$inferInsert

export const shares = sqliteTable(
  'shares',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    familyId: integer('family_id')
      .notNull()
      .references(() => families.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    shareType: text('share_type').notNull(),
    channel: text('channel').notNull(),
    token: text('token').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    tokenUnique: unique().on(t.token),
  }),
)

export type Share = typeof shares.$inferSelect
export type NewShare = typeof shares.$inferInsert

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull().default(1),
})

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert

export const favorites = sqliteTable(
  'favorites',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.recipeId] }),
  }),
)

export type Favorite = typeof favorites.$inferSelect
export type NewFavorite = typeof favorites.$inferInsert

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
})

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
