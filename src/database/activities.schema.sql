CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to contact
    contact_id UUID NOT NULL,
    username VARCHAR(100) NOT NULL,

    -- Activity history (arrays)
    dates TIMESTAMPTZ[] NOT NULL DEFAULT '{}',
    activity VARCHAR(255)[] NOT NULL DEFAULT '{}',
    status VARCHAR(50)[] NOT NULL DEFAULT '{}',
    message TEXT[] NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_contact
    FOREIGN KEY (contact_id)
    REFERENCES contacts(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activities_contact_id 
ON activities(contact_id);