import z from "zod";

const registerUserSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(100),
    fullName: z
        .string()
        .min(3, 'Name Too Short')
        .max(100),
    email: z
        .string()
        .email('Invalid email format'),

    password: z
        .string()
        .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z
        .string()
        .min(6, 'Password must be at least 6 characters'),

});

const loginUserSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(100),

    password: z
        .string()
        .min(1, 'Password is required')
});

export {
    registerUserSchema,
    loginUserSchema
}