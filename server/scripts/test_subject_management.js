import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { signToken } from '../src/utils/jwt.js'

dotenv.config()

async function testSubjectManagement() {
  console.log('🧪 Starting Subject Management API & Database Verification...\n')

  await mongoose.connect(process.env.MONGO_URI, { dbName: 'scholarsense' })
  console.log('✅ Connected to MongoDB scholarsense')

  const User = mongoose.connection.collection('users')
  const userA = await User.findOne({})
  if (!userA) {
    console.error('❌ No user found in database to test with!')
    process.exit(1)
  }

  // Find or create userB for user-isolation test
  let userB = await User.findOne({ _id: { $ne: userA._id } })
  if (!userB) {
    const insertRes = await User.insertOne({
      email: 'test_isolation_user@example.com',
      displayName: 'Test Isolation User',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    userB = { _id: insertRes.insertedId }
  }

  const tokenA = signToken(userA._id.toString())
  const tokenB = signToken(userB._id.toString())
  const BASE_URL = 'http://localhost:5000/api'

  const headersA = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenA}`,
  }

  const headersB = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenB}`,
  }

  // ── TEST 1: Initial list ──────────────────────────────────────────────────
  console.log('Test 1: Fetching existing subjects for User A...')
  const initialRes = await fetch(`${BASE_URL}/subjects`, { headers: headersA })
  const initialData = await initialRes.json()
  console.log(`   User A has ${initialData.data?.length || 0} subjects initially.`)

  // ── TEST 2: Create a new subject ──────────────────────────────────────────
  console.log('\nTest 2: Creating a new subject (name, code, credits, targetGrade, color, syllabusTopics)...')
  const newSubjectPayload = {
    name: 'Advanced Algorithms & Complexity',
    code: 'CS401',
    credits: 4,
    targetGrade: 'A+',
    color: '#5E7A5C',
    syllabusTopics: [
      { topic: 'Divide and Conquer Paradigm', completed: false },
      { topic: 'Dynamic Programming & Memoization', completed: true },
      { topic: 'Network Flow & Bipartite Matching', completed: false },
    ],
  }

  const createRes = await fetch(`${BASE_URL}/subjects`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify(newSubjectPayload),
  })
  const createData = await createRes.json()

  if (createRes.status !== 201 || !createData.success) {
    console.error('❌ Failed to create subject:', createData)
    process.exit(1)
  }
  const createdSubject = createData.data
  console.log(`✅ Subject created successfully! ID: ${createdSubject._id}`)
  console.log(`   Name: "${createdSubject.name}", Code: "${createdSubject.code}", Credits: ${createdSubject.credits}`)
  console.log(`   Topics count: ${createdSubject.syllabusTopics?.length}`)

  // ── TEST 3: Persistence check via GET ─────────────────────────────────────
  console.log('\nTest 3: Checking immediate persistence via GET /api/subjects...')
  const listRes = await fetch(`${BASE_URL}/subjects`, { headers: headersA })
  const listData = await listRes.json()
  const foundInList = listData.data.find((s) => s._id === createdSubject._id)
  if (!foundInList) {
    console.error('❌ Subject not found in User A list!')
    process.exit(1)
  }
  console.log(`✅ Subject confirmed in database and returned in GET list!`)

  // ── TEST 4: Duplicate prevention check ────────────────────────────────────
  console.log('\nTest 4: Attempting to create duplicate subject (same name and code)...')
  const duplicateRes = await fetch(`${BASE_URL}/subjects`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: '  Advanced Algorithms & Complexity  ', // test case-insensitive and trimmed
      code: 'cs401',
      credits: 3,
    }),
  })
  const duplicateData = await duplicateRes.json()
  if (duplicateRes.status === 409 && !duplicateData.success) {
    console.log(`✅ Duplicate blocked with 409 Conflict! Error: "${duplicateData.error?.message}"`)
  } else {
    console.error('❌ Duplicate was NOT blocked:', duplicateRes.status, duplicateData)
    process.exit(1)
  }

  // ── TEST 5: User isolation check ──────────────────────────────────────────
  console.log('\nTest 5: Verifying User B cannot access or see User A subject...')
  const listBRes = await fetch(`${BASE_URL}/subjects`, { headers: headersB })
  const listBData = await listBRes.json()
  const userBHasSubject = listBData.data?.some((s) => s._id === createdSubject._id)
  if (userBHasSubject) {
    console.error('❌ Data leak! User B can see User A subject!')
    process.exit(1)
  }
  console.log(`✅ User isolation verified: User B list does not contain User A subject.`)

  // ── TEST 6: Edit / Update subject ─────────────────────────────────────────
  console.log('\nTest 6: Updating subject targetGrade and credits...')
  const updateRes = await fetch(`${BASE_URL}/subjects/${createdSubject._id}`, {
    method: 'PATCH',
    headers: headersA,
    body: JSON.stringify({
      targetGrade: 'O',
      credits: 5,
    }),
  })
  const updateData = await updateRes.json()
  if (updateRes.status === 200 && updateData.data?.targetGrade === 'O' && updateData.data?.credits === 5) {
    console.log(`✅ Subject updated successfully: targetGrade='O', credits=5`)
  } else {
    console.error('❌ Subject update failed:', updateData)
    process.exit(1)
  }

  // ── TEST 7: Delete subject ────────────────────────────────────────────────
  console.log('\nTest 7: Deleting subject...')
  const deleteRes = await fetch(`${BASE_URL}/subjects/${createdSubject._id}`, {
    method: 'DELETE',
    headers: headersA,
  })
  const deleteData = await deleteRes.json()
  if (deleteRes.status === 200 && deleteData.success) {
    console.log(`✅ Subject deleted successfully! Message: "${deleteData.data?.message}"`)
  } else {
    console.error('❌ Subject deletion failed:', deleteData)
    process.exit(1)
  }

  // Verify it is gone
  const finalListRes = await fetch(`${BASE_URL}/subjects`, { headers: headersA })
  const finalListData = await finalListRes.json()
  const stillExists = finalListData.data.some((s) => s._id === createdSubject._id)
  if (stillExists) {
    console.error('❌ Subject still exists after deletion!')
    process.exit(1)
  }
  console.log(`✅ Confirmed subject is completely removed from database.`)

  console.log('\n🎉 ALL 7 API & DATABASE TESTS PASSED SUCCESSFULLY!\n')
  await mongoose.disconnect()
}

testSubjectManagement().catch(console.error)
