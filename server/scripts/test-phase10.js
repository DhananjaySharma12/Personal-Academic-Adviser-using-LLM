import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'scholarsense' })
  const user = await mongoose.connection.collection('users').findOne({})
  console.log('Testing user:', user.email)

  // 1. Forgot password test
  const forgotRes = await fetch('http://localhost:5000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email })
  })
  const forgotData = await forgotRes.json()
  console.log('Forgot Password Status:', forgotRes.status, 'Success:', forgotData.success, 'DevUrl:', forgotData.data?.devResetUrl?.substring(0, 50))

  // 2. Reminders test
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' })
  const remRes = await fetch('http://localhost:5000/api/reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({
      title: 'Review Chapter 4 Algorithms',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      priority: 'high',
      type: 'study_task'
    })
  })
  const remData = await remRes.json()
  console.log('Create Reminder Status:', remRes.status, 'Title:', remData.data?.title)

  // 3. Admin stats test (grant admin role)
  await mongoose.connection.collection('users').updateOne({ _id: user._id }, { $set: { role: 'admin' } })
  const adminRes = await fetch('http://localhost:5000/api/admin/stats', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  const adminData = await adminRes.json()
  console.log('Admin Stats Status:', adminRes.status, 'Total Users:', adminData.data?.telemetry?.totalUsers)
  console.log('Admin Stats Total Reminders:', adminData.data?.telemetry?.totalReminders)

  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
