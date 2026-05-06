import { Router } from 'express'
import { getHello } from './hello.controller.js'

const router = Router()

router.get('/', getHello)

export default router
