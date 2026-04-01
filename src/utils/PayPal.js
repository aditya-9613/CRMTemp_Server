import axios from "axios"

const PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com"  // 🔁 change to https://api-m.paypal.com in production

const getPaypalAccessToken = async () => {
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET

    // Exactly what your curl command does
    const response = await axios.post(
        `${PAYPAL_BASE_URL}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
            auth: {
                username: clientId,
                password: clientSecret,
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    )

    return response.data.access_token
}

export { getPaypalAccessToken, PAYPAL_BASE_URL }