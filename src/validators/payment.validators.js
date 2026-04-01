import { z } from "zod";

// ─────────────────────────────────────────────
// Shared Enums
// ─────────────────────────────────────────────

export const PlanIdEnum = z.enum(["monthly", "quarterly", "yearly"]);

export const PlanLabelEnum = z.enum(["Monthly", "Quarterly", "Yearly"]);

// ─────────────────────────────────────────────
// Billing
// ─────────────────────────────────────────────

// INSERT payload — what you send to the DB
export const CreateBillingSchema = z.object({
    userId:      z.number().int().positive(),           // SQL: INT, FK → users.id
    planId:      PlanIdEnum,                            // SQL: VARCHAR(20)
    planLabel:   PlanLabelEnum,                         // SQL: VARCHAR(20)
    rate:        z.number().nonnegative(),              // SQL: DECIMAL(10,2)
    duration:    z.number().int().positive().max(120),  // SQL: TINYINT UNSIGNED
    totalAmount: z.number().nonnegative(),              // SQL: DECIMAL(10,2)
    startDate:   z.coerce.date(),                       // SQL: DATETIME
    expiryDate:  z.coerce.date(),                       // SQL: DATETIME
    status:      z.enum(["active", "expired", "cancelled"]).default("active"), // SQL: ENUM
}).refine(
    (data) => data.expiryDate > data.startDate,
    { message: "expiryDate must be after startDate", path: ["expiryDate"] }
);

// SELECT row — what comes back from the DB (includes auto fields)
export const BillingRowSchema = CreateBillingSchema.innerType().extend({
    id:        z.number().int().positive(),             // SQL: INT AUTO_INCREMENT PK
    createdAt: z.coerce.date(),                         // SQL: DATETIME DEFAULT NOW()
    updatedAt: z.coerce.date(),                         // SQL: DATETIME ON UPDATE NOW()
});

// ─────────────────────────────────────────────
// Invoice
// ─────────────────────────────────────────────

export const CreateInvoiceSchema = z.object({
    invoiceNumber: z.string().min(1).max(50),           // SQL: VARCHAR(50) UNIQUE
    userId:        z.number().int().positive(),          // SQL: INT, FK → users.id
    paymentId:     z.number().int().positive(),          // SQL: INT, FK → payments.id
    billingId:     z.number().int().positive(),          // SQL: INT, FK → billings.id
    planLabel:     PlanLabelEnum,                        // SQL: VARCHAR(20)
    amount:        z.number().nonnegative(),             // SQL: DECIMAL(10,2)
    currency:      z.string().length(3).default("USD"),  // SQL: CHAR(3)
    issuedAt:      z.coerce.date().default(() => new Date()), // SQL: DATETIME
    status:        z.enum(["issued", "void"]).default("issued"), // SQL: ENUM
});

export const InvoiceRowSchema = CreateInvoiceSchema.extend({
    id:        z.number().int().positive(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

// ─────────────────────────────────────────────
// Payment
// ─────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
    userId:        z.number().int().positive(),          // SQL: INT, FK → users.id
    billingId:     z.number().int().positive(),          // SQL: INT, FK → billings.id
    planId:        PlanIdEnum,                           // SQL: VARCHAR(20)
    amount:        z.number().nonnegative(),             // SQL: DECIMAL(10,2)
    currency:      z.string().length(3).default("USD"),  // SQL: CHAR(3)
    paymentMethod: z.enum(["card", "upi", "netbanking", "wallet"]), // SQL: ENUM
    transactionId: z.string().min(1).max(100).optional(), // SQL: VARCHAR(100) UNIQUE NULLABLE
    status:        z.enum(["pending", "success", "failed", "refunded"]).default("pending"), // SQL: ENUM
    paidAt:        z.coerce.date().nullable().default(null), // SQL: DATETIME NULLABLE
});

export const PaymentRowSchema = CreatePaymentSchema.extend({
    id:        z.number().int().positive(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

// ─────────────────────────────────────────────
// Subscription
// ─────────────────────────────────────────────

export const CreateSubscriptionSchema = z.object({
    userId:             z.number().int().positive(),     // SQL: INT UNIQUE, FK → users.id
    paymentId:          z.number().int().positive(),     // SQL: INT, FK → payments.id
    billingId:          z.number().int().positive(),     // SQL: INT, FK → billings.id
    planId:             PlanIdEnum,                      // SQL: VARCHAR(20)
    planLabel:          PlanLabelEnum,                   // SQL: VARCHAR(20)
    status:             z.enum(["active", "expired", "cancelled", "paused"]).default("active"), // SQL: ENUM
    startDate:          z.coerce.date(),                 // SQL: DATETIME
    expiryDate:         z.coerce.date(),                 // SQL: DATETIME
    autoRenew:          z.boolean().default(false),      // SQL: TINYINT(1) DEFAULT 0
    cancelledAt:        z.coerce.date().nullable().default(null),  // SQL: DATETIME NULLABLE
    cancellationReason: z.string().max(500).nullable().default(null), // SQL: VARCHAR(500) NULLABLE
}).refine(
    (data) => data.expiryDate > data.startDate,
    { message: "expiryDate must be after startDate", path: ["expiryDate"] }
);

export const SubscriptionRowSchema = CreateSubscriptionSchema.innerType().extend({
    id:        z.number().int().positive(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

// ─────────────────────────────────────────────
// Plan
// ─────────────────────────────────────────────

export const CreatePlanSchema = z.object({
    planId:      PlanIdEnum,                            // SQL: VARCHAR(20) UNIQUE PK
    label:       PlanLabelEnum,                         // SQL: VARCHAR(20)
    rate:        z.number().nonnegative(),              // SQL: DECIMAL(10,2)
    duration:    z.number().int().positive().max(120),  // SQL: TINYINT UNSIGNED
    totalAmount: z.number().nonnegative(),              // SQL: DECIMAL(10,2)
    isActive:    z.boolean().default(true),             // SQL: TINYINT(1) DEFAULT 1
});

export const PlanRowSchema = CreatePlanSchema.extend({
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});