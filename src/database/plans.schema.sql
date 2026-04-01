CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    plan_id VARCHAR(50) NOT NULL UNIQUE,     -- "monthly", "quarterly", "yearly"
    label VARCHAR(50) NOT NULL,              -- "Monthly", etc.

    rate NUMERIC NOT NULL,                   -- per month price
    duration INTEGER NOT NULL,               -- months (1, 3, 12)
    total_amount NUMERIC NOT NULL,           -- rate * duration

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);