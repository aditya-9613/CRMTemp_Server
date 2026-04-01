import { ApiError } from '../utils/ApiError.js';

const validate = (schema) => (req, _, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        const message = result.error.issues
            .map(err => `${err.path[0]}: ${err.message}`)
            .join(", ");

        throw new ApiError(400, message);
    }

    // ✅ replace body with validated data (important)
    req.body = result.data;

    next();
};

export {
    validate
}