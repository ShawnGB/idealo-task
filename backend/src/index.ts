import express from 'express'
import { env } from './config/env.js'
import helloRouter from './modules/hello/hello.routes.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(express.json())
app.use('/hello', helloRouter)
app.use(notFound)
app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`Backend running on http://localhost:${env.PORT}`)
})
