CREATE TABLE billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    
    plan_id VARCHAR(50) NOT NULL,        -- monthly, quarterly, yearly
    plan_label VARCHAR(100) NOT NULL,    -- Monthly, Quarterly, Yearly

    rate NUMERIC(10,2) NOT NULL,         -- better than string for money
    duration INTEGER NOT NULL,           -- months
    total_amount NUMERIC(10,2) NOT NULL,

    start_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP NOT NULL,

    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'cancelled')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);