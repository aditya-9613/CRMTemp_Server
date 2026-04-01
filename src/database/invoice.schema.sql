CREATE TABLE invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    invoice_number VARCHAR(100) NOT NULL UNIQUE,

    user_id UUID NOT NULL,
    payment_id UUID NOT NULL,
    billing_id UUID NOT NULL,

    plan_label VARCHAR(50) NOT NULL,

    amount NUMERIC NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',

    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status VARCHAR(20) DEFAULT 'issued'
        CHECK (status IN ('issued', 'void')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invoice_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_invoice_payment
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,

    CONSTRAINT fk_invoice_billing
        FOREIGN KEY (billing_id) REFERENCES billings(id) ON DELETE CASCADE
);