import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'scholarsense' })
  console.log('Connected to DB scholarsense')
  
  const subjects = await mongoose.connection.collection('subjects').find({}).toArray()
  console.log(`Found ${subjects.length} subjects:`)
  subjects.forEach(s => {
    console.log({
      id: s._id.toString(),
      userId: s.userId.toString(),
      name: s.name,
      code: s.code,
      credits: s.credits,
      topicsCount: s.syllabusTopics?.length || 0,
      createdAt: s.createdAt
    })
  })

  await mongoose.disconnect()
}

run().catch(console.error)
