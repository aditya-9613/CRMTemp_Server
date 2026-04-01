import axios from "axios";
import { ApiError } from "../utils/ApiError.js"
import { getPaypalAccessToken, PAYPAL_BASE_URL } from "../utils/PayPal.js";
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

const createPayPalOrderService = async (paymentData, uid) => {
    const { planLabel, totalAmount } = paymentData

    const accessToken = await getPaypalAccessToken()

    const response = await axios.post(
        `${PAYPAL_BASE_URL}/v2/checkout/orders`,
        {
            intent: "CAPTURE",
            purchase_units: [{
                reference_id: "default",
                amount: {
                    currency_code: "USD",
                    value: parseFloat(totalAmount).toFixed(2),
                },
                description: `CRM ${planLabel} Plan`
            }]
        },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            }
        }
    )

    return response.data.id
}

const capturePayPalOrderService = async (orderData, userId) => {
    const { orderId, planId, planLabel, rate, duration, totalAmount } = orderData

    const accessToken = await getPaypalAccessToken()

    const response = await axios.post(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            }
        }
    )

    const captureData = response.data

    if (captureData.status !== "COMPLETED") {
        throw new ApiError(400, "Payment was not completed")
    }

    const transactionId = captureData.purchase_units[0].payments.captures[0].id
    const paidAt = new Date(captureData.purchase_units[0].payments.captures[0].update_time)

    const startDate = new Date()
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + duration)

    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        // 1. Save Billing record
        const billingResult = await client.query(
            `INSERT INTO billings (user_id, plan_id, plan_label, rate, duration, total_amount, start_date, expiry_date, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
             RETURNING id`,
            [userId, planId, planLabel, rate, duration, totalAmount, startDate, expiryDate]
        )
        const billingId = billingResult.rows[0].id

        // 2. Save Payment record
        const paymentResult = await client.query(
            `INSERT INTO payments (user_id, billing_id, plan_id, amount, currency, payment_method, transaction_id, status, paid_at)
             VALUES ($1, $2, $3, $4, 'USD', 'card', $5, 'success', $6)
             RETURNING id`,
            [userId, billingId, planId, totalAmount, transactionId, paidAt]
        )
        const paymentId = paymentResult.rows[0].id

        // 3. Upsert Subscription record
        await client.query(
            `INSERT INTO subscriptions (user_id, billing_id, payment_id, plan_id, plan_label, status, start_date, expiry_date, auto_renew, cancelled_at, cancellation_reason)
             VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, FALSE, NULL, NULL)
             ON CONFLICT (user_id)
             DO UPDATE SET
                billing_id          = EXCLUDED.billing_id,
                payment_id          = EXCLUDED.payment_id,
                plan_id             = EXCLUDED.plan_id,
                plan_label          = EXCLUDED.plan_label,
                status              = 'active',
                start_date          = EXCLUDED.start_date,
                expiry_date         = EXCLUDED.expiry_date,
                auto_renew          = FALSE,
                cancelled_at        = NULL,
                cancellation_reason = NULL,
                updated_at          = CURRENT_TIMESTAMP`,
            [userId, billingId, paymentId, planId, planLabel, startDate, expiryDate]
        )

        // 4. Generate Invoice number e.g. INV-2026-0001
        const invoiceCountResult = await client.query(`SELECT COUNT(*) FROM invoice`)
        const invoiceCount = parseInt(invoiceCountResult.rows[0].count)
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, "0")}`

        // 5. Save Invoice record
        await client.query(
            `INSERT INTO invoice (invoice_number, user_id, payment_id, billing_id, plan_label, amount, currency, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'USD', 'issued')`,
            [invoiceNumber, userId, paymentId, billingId, planLabel, totalAmount]
        )

        await client.query("COMMIT")

        return {
            transactionId,
            invoiceNumber,
            planLabel,
            totalAmount,
            startDate,
            expiryDate,
            paidAt,
        }

    } catch (error) {
        await client.query("ROLLBACK")
        throw new ApiError(500, "Payment records could not be saved: " + error.message)
    } finally {
        client.release()
    }
}

const getSubscriptionStatusService = async (userId) => {
    const result = await pool.query(
        `SELECT 
            s.plan_label,
            s.start_date,
            s.expiry_date,
            s.status,
            b.total_amount
         FROM subscriptions s
         JOIN billings b ON s.billing_id = b.id
         WHERE s.user_id = $1`,
        [userId]
    )

    if (result.rows.length === 0) {
        return { isPremium: false }
    }

    const subscription = result.rows[0]
    const now = new Date()

    if (subscription.status === "active" && new Date(subscription.expiry_date) <= now) {
        await pool.query(
            `UPDATE subscriptions 
             SET status = 'expired', updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = $1`,
            [userId]
        )
        subscription.status = "expired"
    }

    const isActive = subscription.status === "active" && new Date(subscription.expiry_date) > now

    return {
        isPremium: isActive,
        planLabel: subscription.plan_label,
        startDate: subscription.start_date,
        expiryDate: subscription.expiry_date,
        status: subscription.status,
        totalAmount: subscription.total_amount
    }
}

const getInvoiceService = async (userId) => {
    const query = `
        SELECT
            jsonb_build_object(
                'invoice', jsonb_build_object(
                    'id',             i.id,
                    'invoice_number', i.invoice_number,
                    'plan_label',     i.plan_label,
                    'amount',         i.amount,
                    'currency',       i.currency,
                    'status',         i.status,
                    'issued_at',      i.issued_at
                ),
                'billing', jsonb_build_object(
                    'id',           b.id,
                    'plan_id',      b.plan_id,
                    'plan_label',   b.plan_label,
                    'rate',         b.rate,
                    'duration',     b.duration,
                    'total_amount', b.total_amount,
                    'start_date',   b.start_date,
                    'expiry_date',  b.expiry_date,
                    'status',       b.status
                ),
                'payment', jsonb_build_object(
                    'id',             p.id,
                    'plan_id',        p.plan_id,
                    'amount',         p.amount,
                    'currency',       p.currency,
                    'payment_method', p.payment_method,
                    'transaction_id', p.transaction_id,
                    'status',         p.status,
                    'paid_at',        p.paid_at
                )
            ) AS invoice_details
        FROM invoice i
        JOIN billings b ON i.billing_id = b.id
        JOIN payments p ON i.payment_id = p.id
        WHERE i.user_id = $1
    `

    const { rows } = await pool.query(query, [userId])

    if (rows.length === 0) {
        return []
    }

    return rows.map((row) => row.invoice_details)
}


export {
    createPayPalOrderService,
    capturePayPalOrderService,
    getSubscriptionStatusService,
    getInvoiceService
}