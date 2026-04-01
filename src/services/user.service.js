import { ApiError } from '../utils/ApiError.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// User Creation
const createUser = async (userData) => {
    const { fullName, username, email, password, confirmPassword } = userData

    if (password !== confirmPassword) {
        throw new ApiError(422, 'Password and Confirm Password not Match')
    }

    const findUser = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
    )

    if (findUser.rows[0]) {
        throw new ApiError(429, 'User Already Exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
        `INSERT INTO users ("fullName", username, email, password)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [fullName, username, email, hashedPassword]
    )

    const data = result.rows[0]

    if (!data) {
        throw new ApiError(422, 'Failed to create user')
    }

    return data
}

// Login User
const loginUser = async (userData) => {
    const { username, password } = userData
    const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
    );
    const user = result.rows[0]


    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new ApiError(401, 'Invalid credentials')
    }

    const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )

    return {
        user: {
            id: user.id,
            email: user.email
        },
        accessToken,
        refreshToken
    }
}

// Get User
const getUser = async (uid) => {
    const result = await pool.query(
        'SELECT "fullName", username, email FROM users WHERE id = $1',
        [uid]
    )

    const user = result.rows[0]
    return user
}


export {
    createUser,
    loginUser,
    getUser
};