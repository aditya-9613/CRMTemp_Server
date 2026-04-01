CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    billing_id UUID NOT NULL,

    plan_id VARCHAR(50) NOT NULL,

    amount NUMERIC NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',

    payment_method VARCHAR(20) NOT NULL
        CHECK (payment_method IN ('card', 'upi', 'netbanking', 'wallet')),

    transaction_id VARCHAR(255) UNIQUE,

    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'success', 'failed', 'refunded')),

    paid_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_payment_billing
        FOREIGN KEY (billing_id) REFERENCES billings(id) ON DELETE CASCADE
);