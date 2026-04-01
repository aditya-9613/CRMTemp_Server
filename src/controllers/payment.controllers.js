import { capturePayPalOrderService, createPayPalOrderService, getInvoiceService, getSubscriptionStatusService } from "../services/payment.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createPayPalOrder = asyncHandler(async (req, res) => {
    const orderId = await createPayPalOrderService(req.body, req.user.id)

    return res
        .status(200)
        .json(
            new ApiResponse(200, { orderId }, 'PayPal Order ID')
        )
})

const capturePayPalOrder = asyncHandler(async (req, res) => {
    const jsonData = await capturePayPalOrderService(req.body, req.user.id)

    return res
        .status(200)
        .json(
            new ApiResponse(200, { jsonData }, 'Payment Details')
        )
})

const getSubscriptionStatus = asyncHandler(async (req, res) => {
    const data = await getSubscriptionStatusService(req.user.id)

    return res
        .status(200)
        .json(
            new ApiResponse(200, { data }, 'Subscription Details')
        )
})

const getInvoiceData = asyncHandler(async (req, res) => {
    const data = await getInvoiceService(req.user.id)

    return res
        .status(200)
        .json(
            new ApiResponse(200, { data }, 'Invoice Data')
        )
})


export {
    createPayPalOrder,
    capturePayPalOrder,
    getSubscriptionStatus,
    getInvoiceData
}