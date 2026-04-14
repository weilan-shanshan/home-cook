import { db, sqlite } from './index.js'
import { users, families, familyMembers, tags } from './schema.js'
import { hash } from '@node-rs/argon2'

async function seed() {
  const passwordHash = await hash('admin123')

  db.insert(users)
    .values({
      username: 'chef',
      displayName: '大厨',
      passwordHash,
      role: 'admin',
    })
    .run()

  const familyResult = db
    .insert(families)
    .values({
      name: '我们家',
      inviteCode: '888888',
      createdBy: 1,
    })
    .run()

  db.insert(familyMembers)
    .values({
      familyId: Number(familyResult.lastInsertRowid),
      userId: 1,
    })
    .run()

  const defaultTags = ['家常菜', '川菜', '粤菜', '汤类', '主食', '甜品', '凉菜', '快手菜']
  for (const name of defaultTags) {
    db.insert(tags)
      .values({
        familyId: Number(familyResult.lastInsertRowid),
        name,
      })
      .run()
  }

  console.log('Seed complete: admin user "chef" / password "admin123", family "我们家", invite code "888888"')
  sqlite.close()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  sqlite.close()
  process.exit(1)
})
