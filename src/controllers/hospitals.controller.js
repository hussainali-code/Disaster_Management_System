const { getPool, sql } = require('../config/db');

// GET /api/hospitals  — uses vw_HospitalCapacity view
const getAllHospitals = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`SELECT * FROM vw_HospitalCapacity ORDER BY occupancy_pct DESC`);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/hospitals/admit  — admit a patient (calls stored proc)
const admitPatient = async (req, res) => {
    const { hospital_id, report_id, patient_name, condition_severity, is_critical } = req.body;
    if (!hospital_id || !patient_name || !condition_severity) {
        return res.status(400).json({ success: false, message: 'hospital_id, patient_name and condition_severity are required.' });
    }
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('hospital_id',        sql.Int,     hospital_id)
            .input('report_id',          sql.Int,     report_id || null)
            .input('patient_name',       sql.VarChar, patient_name)
            .input('condition_severity', sql.VarChar, condition_severity)
            .input('is_critical',        sql.Bit,     is_critical ? 1 : 0)
            .execute('sp_AdmitPatient');

        res.status(201).json({ success: true, message: 'Patient admitted.', data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/hospitals/discharge/:id  — discharge a patient
const dischargePatient = async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('patient_id', sql.Int, req.params.id)
            .query(`UPDATE Patients SET discharged_at = SYSDATETIME() WHERE patient_id = @patient_id`);
        res.json({ success: true, message: 'Patient discharged.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/hospitals/patients  — get all current patients
const getAllPatients = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT p.*, h.hospital_name, h.location AS hospital_location
            FROM Patients p
            JOIN Hospitals h ON p.hospital_id = h.hospital_id
            WHERE p.discharged_at IS NULL
            ORDER BY p.is_critical DESC, p.admitted_at DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAllHospitals, admitPatient, dischargePatient, getAllPatients };
