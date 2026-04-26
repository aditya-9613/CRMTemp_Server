import { ApiError } from '../utils/ApiError.js';
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const createContactService = async (payload, uid) => {
    const { name, email, designation, phone, status, profileURL, company, source } = payload

    // Get user
    const userResult = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [uid]
    )

    const findUser = userResult.rows[0]

    if (!findUser) {
        throw new ApiError(401, 'Unauthorized Access')
    }

    // Check duplicate
    const duplicateResult = await pool.query(
        'SELECT * FROM contacts WHERE email = $1 OR phone = $2 OR "profileURL" = $3',
        [email, phone, profileURL]
    )

    if (duplicateResult.rows.length > 0 && (email !== 'NA' || phone !== 'NA')) {
        throw new ApiError(422, 'Data Duplicate')
    }

    // Insert contact
    const contactResult = await pool.query(
        `INSERT INTO contacts (username, name, email, designation, phone, status, "profileURL", company, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [findUser.username, name, email, designation, phone, status, profileURL, company, source]
    )

    const saveData = contactResult.rows[0]

    if (!saveData) {
        throw new ApiError(500, 'Failed to create contact')
    }

    // Insert activity
    const activityResult = await pool.query(
        `INSERT INTO activities (contact_id, username, dates, activity, status, message)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
            saveData.id,
            findUser.username,
            [new Date()],
            ['Contact Created'],
            ['New'],
            ['Contact Created Successfully']
        ]
    )

    const activity = activityResult.rows[0]

    if (!activity) {
        throw new ApiError(500, 'Failed to log activity')
    }

    return { saveData, activity }
}

const getContactService = async (uid) => {
    // Step 1: Resolve uid → username
    const userResult = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [uid]
    )

    if (userResult.rows.length === 0) {
        throw new ApiError(404, 'User not found')
    }

    const username = userResult.rows[0].username

    // Step 2: Fetch contacts with activities for this username
    const { rows } = await pool.query(
        `SELECT
            c.id,
            c.username,
            c.name,
            c.designation,
            c.phone,
            c.email,
            c.company,
            c."profileURL",
            c.status,
            c.source,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT('dates', a.dates)
                ) FILTER (WHERE a.dates IS NOT NULL),
                '[]'
            ) AS activities
        FROM contacts c
        LEFT JOIN activities a ON a.contact_id = c.id
        WHERE c.username = $1
          AND c.status NOT IN ('Deleted', 'Eradicated')
        GROUP BY c.id, c.username, c.name, c.designation, c.phone, c.email, c.company, c.status, c.source
        ORDER BY c.created_at DESC`,
        [username]
    )

    // Step 3: Format and return
    const formattedContacts = (rows || []).map((element) => {
        const avatar = element.name
            ?.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()

        let lastActivity = element?.activities?.[0]?.dates?.slice(-1)[0]

        if (lastActivity) {
            lastActivity = new Date(lastActivity).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            })
        } else {
            lastActivity = null
        }

        return {
            id: element.id,
            name: element.name,
            designation: element.designation,
            phone: element.phone,
            email: element.email,
            company: element.company,
            profileURL: element.profileURL,
            status: element.status,
            source: element.source,
            lastActivity,
            avatar,
        }
    })

    return formattedContacts
}

const getActivity = async (uid) => {
    const { rows } = await pool.query(
        `SELECT
            u.date,
            u.activity,
            u.status,
            u.message,
            c.name,
            a.contact_id AS uid
        FROM activities a
        CROSS JOIN LATERAL (
            SELECT
                d.val   AS date,
                act.val AS activity,
                s.val   AS status,
                m.val   AS message
            FROM
                unnest(a.dates)         WITH ORDINALITY AS d(val, idx)
                JOIN unnest(a.activity) WITH ORDINALITY AS act(val, idx) ON act.idx = d.idx
                JOIN unnest(a.status)   WITH ORDINALITY AS s(val, idx)   ON s.idx   = d.idx
                JOIN unnest(a.message)  WITH ORDINALITY AS m(val, idx)   ON m.idx   = d.idx
        ) u
        LEFT JOIN contacts c ON c.id = a.contact_id
        WHERE c.username = (
            SELECT username FROM users WHERE id = $1
        )
        ORDER BY u.date DESC
        LIMIT 5`,
        [uid]
    )

    return rows
}

const getStats = async (uid) => {
    const userResult = await pool.query(
        'SELECT username FROM users WHERE id = $1',
        [uid]
    )

    if (userResult.rows.length === 0) {
        throw new ApiError(404, `User with ID "${uid}" not found`)
    }

    const { username } = userResult.rows[0]

    const statsResult = await pool.query(
        `SELECT 
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'New') AS new_deals,
            COUNT(*) FILTER (WHERE status = 'In Progress') AS active_tasks,
            COUNT(*) FILTER (WHERE status = 'Archived') AS completed_deals
        FROM contacts
        WHERE username = $1`,
        [username]
    )

    const stats = statsResult.rows[0]

    return [
        { label: 'Total Contacts', value: Number(stats.total).toLocaleString(), key: 'total' },
        { label: 'New Deals', value: Number(stats.new_deals).toLocaleString(), key: 'new' },
        { label: 'Active Tasks', value: Number(stats.active_tasks).toLocaleString(), key: 'active' },
        { label: 'Completed Deals', value: Number(stats.completed_deals).toLocaleString(), key: 'completed' }
    ]
}

const updateContact = async (contactData) => {
    const { id, name, phone, email, company, profileURL, source, status, message, designation } = contactData

    console.log(message)
    if (
        [id, name, phone, email, company, profileURL, source, status, designation]
            .some((item) => !item || item === "")
    ) {
        throw new ApiError(400, 'Required Fields');
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ✅ Fetch contact
        const contactResult = await client.query(
            'SELECT * FROM contacts WHERE id = $1',
            [id]
        );
        const contact = contactResult.rows[0];


        // ✅ Fetch activities
        const activitiesResult = await client.query(
            'SELECT * FROM activities WHERE contact_id = $1',
            [contact.id]
        );


        if (contactResult.rowCount === 0 || activitiesResult.rowCount === 0) {
            throw new ApiError(404, 'Contact or Activity details Missing');
        }


        // ✅ Business Logic
        if ((contact.status === status) && message !== "") {
            throw new ApiError(400, 'Change status for adding Message');
        }

        if ((contact.status !== status) && message === "") {
            throw new ApiError(400, 'If Status Changed then Message Can Not be Null');
        }

        // ✅ Case 1: Only contact update
        if (message === "") {
            await client.query(
                `UPDATE contacts 
                 SET name=$1, phone=$2, email=$3, company=$4,
                     "profileURL"=$5, designation=$6, source=$7
                 WHERE id=$8`,
                [name, phone, email, company, profileURL, designation, source, id]
            );
        }

        // ✅ Case 2: Contact + Activity update
        if (message !== "") {

            // Update contact
            await client.query(
                `UPDATE contacts 
                 SET name=$1, phone=$2, email=$3, company=$4,
                     "profileURL"=$5, source=$6, status=$7
                 WHERE id=$8`,
                [name, phone, email, company, profileURL, source, status, id]
            );

            // Append to arrays in activities table
            await client.query(
                `UPDATE activities
                 SET 
                    dates = array_append(dates, $1),
                    activity = array_append(activity, $2),
                    status = array_append(status, $3),
                    message = array_append(message, $4)
                 WHERE contact_id = $5`,
                [
                    new Date(),
                    `Contact Status Changed to ${status}`,
                    status,
                    message,
                    contact.id
                ]
            );
        }

        await client.query('COMMIT');

        return true

    } catch (error) {
        await client.query('ROLLBACK');
        throw new ApiError(500, error.message)
    } finally {
        client.release();
    }
}

const deleteContact = async (deleteData) => {
    const { id, message } = deleteData

    // ✅ Validation
    if (!id || !message) {
        throw new ApiError(400, 'UID and Message are required');
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ✅ Fetch contact
        const contactResult = await client.query(
            'SELECT * FROM contacts WHERE id = $1',
            [id]
        );

        if (contactResult.rowCount === 0) {
            throw new ApiError(404, 'Contact details Missing');
        }

        const contact = contactResult.rows[0];

        // ✅ Already deleted check
        if (contact.status === 'Deleted') {
            throw new ApiError(429, 'Contact Already Deleted');
        }

        // ✅ Update contact status
        await client.query(
            `UPDATE contacts 
             SET status = $1
             WHERE id = $2`,
            ['Deleted', id]
        );

        // ✅ Update activities (append to arrays)
        await client.query(
            `UPDATE activities
             SET 
                dates = array_append(dates, $1),
                activity = array_append(activity, $2),
                status = array_append(status, $3),
                message = array_append(message, $4)
             WHERE contact_id = $5`,
            [
                new Date(),
                'This contact is Deleted',
                'Deleted',
                message,
                contact.id
            ]
        );

        await client.query('COMMIT');

        return

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export {
    createContactService,
    getContactService,
    getActivity,
    getStats,
    updateContact,
    deleteContact
}