// server.js
const express = require('express');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


// Handle preflight requests
app.options('*', cors());


// Middleware to parse JSON bodies
app.use(express.json());

// Define the /service/getAll endpoint
app.get('/service/getAll', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.service');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get("/service/get/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Received id:", id);
  try {
    const report = await pool.query(`
      SELECT * FROM public.service
      WHERE id = $1
    `, [parseInt(id)]);

    if (report.rows.length === 0) {satisfies
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(report.rows[0]);  // Return the first matching service
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Define the /service/getAll endpoint
app.get('/package/getAll', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.package');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/appointment/getAllWithNames', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.*, 
        p.name AS patient_names, 
        p.last_names AS patient_last_names, 
        p.phone AS patient_phone, 
        t.name AS therapist_names, 
        t.last_names AS therapist_last_names, 
        s.name AS service_name
      FROM 
        appointment a
      INNER JOIN 
        public."user" p ON p.id = a.patient_id
      INNER JOIN 
        public."user" t ON t.id = a.therapist_id
      INNER JOIN 
        service s ON s.id = a.service_id
    `);

    const formattedResult = result.rows.map(row => ({
      appointment: {
        id: row.id,
        service_id: row.service_id,
        state: row.state,
        date: row.date,
        hour: row.hour,
        minute: row.minute,
        price: row.price,
        headquarter_id: row.headquarter_id,
        patient_id: row.patient_id,
        therapist_id: row.therapist_id,
        hidden: row.hidden,
        payment_method: row.payment_method,
        assistance: row.assistance,
        from_package: row.from_package,
        order_id: row.order_id,
        invoice_id: row.invoice_id,
        creation_date: row.creation_date,
      },
      data: {
        patient_names: row.patient_names,
        patient_last_names: row.patient_last_names,
        patient_phone: row.patient_phone,
        therapist_names: row.therapist_names,
        therapist_last_names: row.therapist_last_names,
        service_name: row.service_name
      }
    }));

    res.json(formattedResult);
  } catch (err) {
    console.error('Error fetching appointments with names:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.get('/user/getAllPatients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.last_names, 
        u.phone, 
        MAX(a.date) AS last_appointment
      FROM 
        public."user" u
      LEFT JOIN 
        public.appointment a 
      ON 
        a.patient_id = u.id
      AND 
        a.state = 'CLOSED'
      AND 
        a.assistance = 'ATTENDED'
      GROUP BY 
        u.id, u.name, u.last_names, u.phone
    `);

    // Format the response into { user: { ...user fields }, last_appointment }
    const formattedResult = result.rows.map(row => ({
      user: {
        id: row.id,
        names: row.name,
        last_names: row.last_names,
        phone: row.phone,
        // You can add more fields from "user" table if needed, e.g., address, email, etc.
      },
      last_appointment: row.last_appointment
    }));

    res.json(formattedResult);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//TODO: Cambiar el query para que reciba el id de paquete.
app.get("/package/getAllByServiceId/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id)
  try {
    const report = await pool.query(`
      SELECT * FROM public.package
      WHERE service_id = 5
    `);

    if (report.rows.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(report.rows[0]);  // Return the first matching service
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add this endpoint to server.js
app.get('/user/getAllByRole/:role', async (req, res) => {
  const { role } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name as names, 
        last_names, 
        phone, 
        address, 
        email, 
        enabled, 
        profile_picture, 
        cognito_id, 
        "role_id" as role,
        identification, 
        identification_type, 
        headquarter_id, 
        retired, 
        birth_date, 
        genre, 
        residence_country, 
        residence_city, 
        nationality, 
        date_created
      FROM public."user"
      WHERE role_id = $1
    `, [role]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users by role:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this endpoint to server.js
app.get('/userService/getAll', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        user_id, 
        service_id
      FROM public.user_service
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user services:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/appointment/getAll', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        service_id, 
        state, 
        date, 
        hour, 
        price, 
        patient_id, 
        therapist_id, 
        hidden, 
        assistance, 
        payment_method, 
        from_package, 
        order_id, 
        invoice_id,
        creation_date
      FROM public.appointment
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add these endpoints to server.js

// Create appointment with existing patient
app.post('/appointment/create', async (req, res) => {
  try {
    const {
      service_id,
      price,
      state,
      date,
      hour,
      minute,
      patient_id,
      payment_method,
      creation_date
    } = req.body;

    const result = await pool.query(`
      INSERT INTO public.appointment (
        service_id,
        price,
        state,
        date,
        hour,
        minute,
        patient_id,
        payment_method,
        hidden,
        from_package,
        creation_date,
        headquarter_id,
        therapist_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [
      service_id,
      price,
      state,
      date,
      hour,
      minute,
      patient_id,
      payment_method,
      false,
      false,
      creation_date,
      1,
      1
    ]);

    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create appointment with new patient
app.post('/appointment/createWithPatient', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { user, appointment } = req.body;

    // First create the new patient without cognito_id
    const userResult = await client.query(`
      INSERT INTO public."user" (
        name,
        last_names,
        phone,
        address,
        email,
        enabled,
        role_id, 
        profile_picture,
        date_created
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [  
      user.names,
      user.last_names,
      user.phone,
      user.address || null,
      user.email || null,
      true, // enabled
      'PATIENT', // role_id
      "",
      new Date()
    ]);

    const patient_id = userResult.rows[0].id;

    // Get random therapist for the service


    // Create the appointment
    const appointmentResult = await client.query(`
      INSERT INTO public.appointment (
        service_id,
        price,
        state,
        date,
        hour,
        minute,
        patient_id,
        payment_method,
        hidden,
        from_package,
        creation_date,
        headquarter_id,
        therapist_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [
      appointment.service_id,
      appointment.price,
      appointment.state,
      appointment.date,
      appointment.hour,
      appointment.minute || 0,
      patient_id,
      appointment.payment_method,
      false,
      false,
      appointment.creation_date,
      1,
      1
    ]);

    await client.query('COMMIT');
    res.json({ id: appointmentResult.rows[0].id });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating appointment with patient:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});


//Get any user by ID

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Add this endpoint to server.js
app.get('/user/get/:id', async (req, res) => {
  const { id } = req.params; // Extract the user ID from the request parameters

  try {
    // Query the database for the user with the specified ID
    const result = await pool.query(`
      SELECT 
        id, 
        name as names, 
        last_names, 
        phone, 
        address, 
        email, 
        enabled, 
        profile_picture, 
        cognito_id, 
        "role_id" as role,
        identification, 
        identification_type, 
        headquarter_id, 
        retired, 
        birth_date, 
        genre, 
        residence_country, 
        residence_city, 
        nationality, 
        date_created
      FROM public."user"
      WHERE id = $1
    `, [id]);

    // Check if a user was found
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user data
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
