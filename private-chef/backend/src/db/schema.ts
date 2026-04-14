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
  mealType: text('meal_type').notNull(),
  mealDate: text('meal_date').notNull(),
  note: text('note'),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

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
