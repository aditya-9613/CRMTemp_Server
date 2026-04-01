import { z } from 'zod';

export const createContactSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    designation: z.string().min(1),
    phone: z.string().min(10),
    status: z.string().min(3),
    profileURL: z.string().min(3),
    company: z.string().min(1),
    source: z.string().min(1),
})