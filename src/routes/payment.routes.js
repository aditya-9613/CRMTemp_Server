import { Router } from "express";
import { verifyJWT } from '../middlewares/auth.middlewares.js'
import { createPayPalOrder, capturePayPalOrder, getSubscriptionStatus, getInvoiceData } from '../controllers/payment.controllers.js'

const router = Router()

router.route('/createOrder').post(verifyJWT, createPayPalOrder)
router.route('/captureOrder').post(verifyJWT, capturePayPalOrder)
router.route('/getSubscription').get(verifyJWT, getSubscriptionStatus)
router.route('/getInvoices').get(verifyJWT, getInvoiceData)

export default router