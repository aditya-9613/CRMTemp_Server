CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,   -- one subscription per user

    payment_id UUID NOT NULL,
    billing_id UUID NOT NULL,

    plan_id VARCHAR(50) NOT NULL,
    plan_label VARCHAR(50) NOT NULL,

    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'cancelled', 'paused')),

    start_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP NOT NULL,

    auto_renew BOOLEAN DEFAULT FALSE,

    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_subscription_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_subscription_payment
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,

    CONSTRAINT fk_subscription_billing
        FOREIGN KEY (billing_id) REFERENCES billings(id) ON DELETE CASCADE
);