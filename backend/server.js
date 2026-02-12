require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Configure multer for CV uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'cv-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// SIMPLE DATABASE CONNECTION CHECK - NO RESETTING
const checkDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    
    // Check if tables exist
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📊 Found ${tables.length} existing tables`);
    
    connection.release();
    
    // Only add test data if it doesn't exist - NO DROPPING
    await addTestDataIfNeeded();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Only add test data if it doesn't exist - NO DROPPING
const addTestDataIfNeeded = async () => {
  try {
    // Check if test users already exist
    const [existingEmployer] = await pool.query(
      'SELECT id FROM users WHERE email = ?', 
      ['employer@test.com']
    );
    
    const [existingSeeker] = await pool.query(
      'SELECT id FROM users WHERE email = ?', 
      ['seeker@test.com']
    );
    
    // Only add if they don't exist
    if (existingEmployer.length === 0) {
      const employerPass = await bcrypt.hash('employer123', 10);
      const [employerUser] = await pool.query(
        'INSERT INTO users (email, password, user_type) VALUES (?, ?, ?)',
        ['employer@test.com', employerPass, 'employer']
      );
      
      await pool.query(
        'INSERT INTO employers (user_id, company_name, email) VALUES (?, ?, ?)',
        [employerUser.insertId, 'Tech Corp', 'employer@test.com']
      );
      console.log('✅ Added test employer');
    }
    
    if (existingSeeker.length === 0) {
      const seekerPass = await bcrypt.hash('seeker123', 10);
      const [seekerUser] = await pool.query(
        'INSERT INTO users (email, password, user_type) VALUES (?, ?, ?)',
        ['seeker@test.com', seekerPass, 'jobseeker']
      );
      
      await pool.query(
        'INSERT INTO job_seekers (user_id, name, email) VALUES (?, ?, ?)',
        [seekerUser.insertId, 'John Smith', 'seeker@test.com']
      );
      console.log('✅ Added test job seeker');
    }
    
    if (existingEmployer.length === 0 || existingSeeker.length === 0) {
      console.log('📋 Test Login:');
      console.log('   Employer: employer@test.com / employer123');
      console.log('   Job Seeker: seeker@test.com / seeker123');
    }
    
  } catch (error) {
    console.error('❌ Error adding test data:', error.message);
  }
};

// Initialize database connection - NO RESETTING
checkDatabaseConnection();

// Auth middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.id;
    req.userType = decoded.userType;
    next();
  });
};

// ========== ROUTES ==========

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT NOW() as time');
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    res.json({ 
      status: 'OK', 
      time: result[0].time,
      tables: tableNames,
      message: 'Job Portal API is running'
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, userType } = req.body;
    
    // Validate
    if (!name || !email || !password || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!['jobseeker', 'employer'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }
    
    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Create user
      const [userResult] = await connection.query(
        'INSERT INTO users (email, password, user_type) VALUES (?, ?, ?)',
        [email, hashedPassword, userType]
      );
      
      const userId = userResult.insertId;
      
      // Create user-specific record
      if (userType === 'jobseeker') {
        await connection.query(
          'INSERT INTO job_seekers (user_id, name, email) VALUES (?, ?, ?)',
          [userId, name, email]
        );
      } else if (userType === 'employer') {
        await connection.query(
          'INSERT INTO employers (user_id, company_name, email) VALUES (?, ?, ?)',
          [userId, name, email]
        );
      }
      
      await connection.commit();
      connection.release();
      
      console.log(`✅ New user registered: ${email} (${userType})`);
      res.status(201).json({ message: 'Registration successful' });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get user's name
    let userName = '';
    if (user.user_type === 'jobseeker') {
      const [seeker] = await pool.query('SELECT name FROM job_seekers WHERE user_id = ?', [user.id]);
      userName = seeker[0]?.name || '';
    } else if (user.user_type === 'employer') {
      const [emp] = await pool.query('SELECT company_name FROM employers WHERE user_id = ?', [user.id]);
      userName = emp[0]?.company_name || '';
    }
    
    // Create token
    const token = jwt.sign(
      { id: user.id, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`✅ User logged in: ${email} (${user.user_type})`);
    
    res.json({
      token,
      user: {
        id: user.id,
        name: userName,
        email: user.email,
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all jobs (public)
app.get('/api/jobs', async (req, res) => {
  try {
    const [jobs] = await pool.query(`
      SELECT j.*, e.company_name 
      FROM jobs j 
      JOIN employers e ON j.employer_id = e.id 
      WHERE j.status = 'active'
      ORDER BY j.created_at DESC
    `);
    
    console.log(`📋 Fetched ${jobs.length} jobs`);
    res.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Employer: Post job
app.post('/api/jobs', verifyToken, async (req, res) => {
  if (req.userType !== 'employer') {
    return res.status(403).json({ error: 'Only employers can post jobs' });
  }
  
  try {
    const { title, description, location, salary, job_type } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    // Get employer ID
    const [employers] = await pool.query('SELECT id FROM employers WHERE user_id = ?', [req.userId]);
    if (employers.length === 0) {
      return res.status(404).json({ error: 'Employer not found' });
    }
    
    const employerId = employers[0].id;
    
    // Create job
    const [result] = await pool.query(
      `INSERT INTO jobs (employer_id, title, description, location, salary, job_type, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [employerId, title, description, location || 'Not specified', salary || 'Not specified', job_type || 'full-time']
    );
    
    console.log(`✅ New job posted: ${title} by employer ${req.userId}`);
    
    res.status(201).json({ 
      message: 'Job posted successfully', 
      jobId: result.insertId 
    });
  } catch (error) {
    console.error('Post job error:', error);
    res.status(500).json({ error: 'Failed to post job' });
  }
});

// Employer: Get their jobs
app.get('/api/employer/jobs', verifyToken, async (req, res) => {
  if (req.userType !== 'employer') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const [employers] = await pool.query('SELECT id FROM employers WHERE user_id = ?', [req.userId]);
    if (employers.length === 0) {
      return res.status(404).json({ error: 'Employer not found' });
    }
    
    const employerId = employers[0].id;
    
    const [jobs] = await pool.query(`
      SELECT j.*, 
        (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
      FROM jobs j 
      WHERE j.employer_id = ? 
      ORDER BY j.created_at DESC
    `, [employerId]);
    
    console.log(`📋 Employer ${req.userId} has ${jobs.length} jobs`);
    res.json(jobs);
  } catch (error) {
    console.error('Get employer jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ========== CV UPLOAD ENDPOINTS ==========

// Job seeker: Apply for job with CV
app.post('/api/apply', verifyToken, upload.single('cv'), async (req, res) => {
  if (req.userType !== 'jobseeker') {
    return res.status(403).json({ error: 'Only job seekers can apply' });
  }
  
  try {
    const { jobId, coverLetter } = req.body;
    const cvFile = req.file;
    
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }
    
    // Get job seeker ID
    const [seekers] = await pool.query('SELECT id FROM job_seekers WHERE user_id = ?', [req.userId]);
    if (seekers.length === 0) {
      return res.status(404).json({ error: 'Job seeker not found' });
    }
    
    const jobSeekerId = seekers[0].id;
    
    // Check if already applied
    const [existing] = await pool.query(
      'SELECT id FROM applications WHERE job_seeker_id = ? AND job_id = ?',
      [jobSeekerId, jobId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already applied for this job' });
    }
    
    // Check if job exists and is active
    const [jobCheck] = await pool.query(
      'SELECT id FROM jobs WHERE id = ? AND status = "active"',
      [jobId]
    );
    
    if (jobCheck.length === 0) {
      return res.status(404).json({ error: 'Job not found or not active' });
    }
    
    // Save CV filename if uploaded
    const cvFilename = cvFile ? cvFile.filename : null;
    
    // Create application
    await pool.query(
      'INSERT INTO applications (job_seeker_id, job_id, cover_letter, cv_file, status) VALUES (?, ?, ?, ?, ?)',
      [jobSeekerId, jobId, coverLetter || '', cvFilename, 'pending']
    );
    
    console.log(`✅ Job seeker ${jobSeekerId} applied for job ${jobId} with CV: ${cvFilename || 'none'}`);
    
    res.status(201).json({ 
      message: 'Application submitted successfully',
      cvFile: cvFilename ? {
        filename: cvFilename,
        url: `http://localhost:${PORT}/uploads/${cvFilename}`
      } : null
    });
  } catch (error) {
    console.error('❌ Apply error:', error);
    res.status(500).json({ error: 'Failed to submit application', details: error.message });
  }
});

// Job seeker: Upload CV to profile
app.put('/api/profile/cv', verifyToken, upload.single('cv'), async (req, res) => {
  try {
    if (req.userType !== 'jobseeker') {
      return res.status(403).json({ error: 'Only job seekers can upload CV' });
    }
    
    const cvFile = req.file;
    
    if (!cvFile) {
      return res.status(400).json({ error: 'CV file is required' });
    }
    
    // Get old CV to delete it
    const [oldCV] = await pool.query(
      'SELECT resume FROM job_seekers WHERE user_id = ?',
      [req.userId]
    );
    
    if (oldCV.length > 0 && oldCV[0].resume) {
      const oldFilePath = path.join(__dirname, 'uploads', oldCV[0].resume);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log(`🗑️ Deleted old CV: ${oldCV[0].resume}`);
      }
    }
    
    const cvFilename = cvFile.filename;
    
    await pool.query(
      'UPDATE job_seekers SET resume = ? WHERE user_id = ?',
      [cvFilename, req.userId]
    );
    
    console.log(`✅ CV uploaded for user ${req.userId}: ${cvFilename}`);
    
    res.json({ 
      message: 'CV uploaded successfully',
      cvFile: cvFilename,
      cvUrl: `http://localhost:${PORT}/uploads/${cvFilename}`
    });
  } catch (error) {
    console.error('❌ CV upload error:', error);
    res.status(500).json({ error: 'Failed to upload CV' });
  }
});

// Get CV file
app.get('/api/cv/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'uploads', filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'CV not found' });
    }
    
    res.sendFile(filepath);
  } catch (error) {
    console.error('❌ Get CV error:', error);
    res.status(500).json({ error: 'Failed to retrieve CV' });
  }
});

// Job seeker: Get their applications with CV info
app.get('/api/my-applications', verifyToken, async (req, res) => {
  if (req.userType !== 'jobseeker') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const [seekers] = await pool.query('SELECT id FROM job_seekers WHERE user_id = ?', [req.userId]);
    if (seekers.length === 0) {
      return res.status(404).json({ error: 'Job seeker not found' });
    }
    
    const jobSeekerId = seekers[0].id;
    
    const [applications] = await pool.query(`
      SELECT a.*, j.title, e.company_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employers e ON j.employer_id = e.id
      WHERE a.job_seeker_id = ?
      ORDER BY a.applied_at DESC
    `, [jobSeekerId]);
    
    // Add CV URLs
    const appsWithUrls = applications.map(app => ({
      ...app,
      cv_url: app.cv_file ? `http://localhost:${PORT}/uploads/${app.cv_file}` : null
    }));
    
    console.log(`📋 Job seeker ${jobSeekerId} has ${applications.length} applications`);
    res.json(appsWithUrls);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Employer: Get job applications with CV info
app.get('/api/jobs/:jobId/applications', verifyToken, async (req, res) => {
  if (req.userType !== 'employer') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const { jobId } = req.params;
    
    // Verify employer owns this job
    const [jobs] = await pool.query(`
      SELECT j.id FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE j.id = ? AND e.user_id = ?
    `, [jobId, req.userId]);
    
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found or access denied' });
    }
    
    const [applications] = await pool.query(`
      SELECT a.*, js.name as applicant_name, js.email as applicant_email, js.resume as applicant_cv
      FROM applications a
      JOIN job_seekers js ON a.job_seeker_id = js.id
      WHERE a.job_id = ?
      ORDER BY a.applied_at DESC
    `, [jobId]);
    
    // Add CV URLs
    const appsWithUrls = applications.map(app => ({
      ...app,
      cv_url: app.cv_file ? `http://localhost:${PORT}/uploads/${app.cv_file}` : null,
      applicant_cv_url: app.applicant_cv ? `http://localhost:${PORT}/uploads/${app.applicant_cv}` : null
    }));
    
    console.log(`📋 Job ${jobId} has ${applications.length} applications`);
    res.json(appsWithUrls);
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Update application status
app.put('/api/applications/:id/status', verifyToken, async (req, res) => {
  if (req.userType !== 'employer') {
    return res.status(403).json({ error: 'Only employers can update status' });
  }
  
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Verify employer owns this application's job
    const [apps] = await pool.query(`
      SELECT a.id FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employers e ON j.employer_id = e.id
      WHERE a.id = ? AND e.user_id = ?
    `, [id, req.userId]);
    
    if (apps.length === 0) {
      return res.status(404).json({ error: 'Application not found or access denied' });
    }
    
    await pool.query('UPDATE applications SET status = ? WHERE id = ?', [status, id]);
    
    console.log(`✅ Application ${id} status updated to ${status}`);
    
    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete job
app.delete('/api/jobs/:id', verifyToken, async (req, res) => {
  if (req.userType !== 'employer') {
    return res.status(403).json({ error: 'Only employers can delete jobs' });
  }
  
  try {
    const { id } = req.params;
    
    // Verify employer owns this job
    const [jobs] = await pool.query(`
      SELECT j.id FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE j.id = ? AND e.user_id = ?
    `, [id, req.userId]);
    
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found or access denied' });
    }
    
    await pool.query('DELETE FROM jobs WHERE id = ?', [id]);
    
    console.log(`✅ Job ${id} deleted by employer ${req.userId}`);
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Update job status
app.put('/api/jobs/:id/status', verifyToken, async (req, res) => {
  try {
    if (req.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can update job status' });
    }
    
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Verify the job belongs to this employer
    const [jobCheck] = await pool.query(`
      SELECT j.* FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE j.id = ? AND e.user_id = ?
    `, [id, req.userId]);
    
    if (jobCheck.length === 0) {
      return res.status(404).json({ error: 'Job not found or access denied' });
    }
    
    await pool.query(
      'UPDATE jobs SET status = ? WHERE id = ?',
      [status, id]
    );
    
    console.log(`✅ Job ${id} status updated to ${status} by employer ${req.userId}`);
    
    res.json({ 
      message: 'Job status updated successfully',
      jobId: id,
      newStatus: status
    });
  } catch (error) {
    console.error('❌ Update job status error:', error);
    res.status(500).json({ error: 'Failed to update job status', details: error.message });
  }
});

// Update job details (Edit job)
app.put('/api/jobs/:id', verifyToken, async (req, res) => {
  try {
    if (req.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can edit jobs' });
    }
    
    const { id } = req.params;
    const { title, description, location, salary, job_type } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    // Verify the job belongs to this employer
    const [jobCheck] = await pool.query(`
      SELECT j.* FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE j.id = ? AND e.user_id = ?
    `, [id, req.userId]);
    
    if (jobCheck.length === 0) {
      return res.status(404).json({ error: 'Job not found or access denied' });
    }
    
    await pool.query(
      `UPDATE jobs 
       SET title = ?, description = ?, location = ?, salary = ?, job_type = ?
       WHERE id = ?`,
      [title, description, location || 'Not specified', salary || 'Not specified', job_type || 'full-time', id]
    );
    
    console.log(`✅ Job ${id} updated by employer ${req.userId}`);
    
    res.json({ 
      message: 'Job updated successfully',
      jobId: id
    });
  } catch (error) {
    console.error('❌ Edit job error:', error);
    res.status(500).json({ error: 'Failed to update job', details: error.message });
  }
});

// Get user profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    if (req.userType === 'jobseeker') {
      const [profile] = await pool.query(
        `SELECT js.*, u.email 
         FROM job_seekers js 
         JOIN users u ON js.user_id = u.id 
         WHERE js.user_id = ?`,
        [req.userId]
      );
      
      if (profile.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      const profileData = profile[0];
      // Add CV URL if exists
      if (profileData.resume) {
        profileData.cv_url = `http://localhost:${PORT}/uploads/${profileData.resume}`;
      }
      
      res.json(profileData);
    } else if (req.userType === 'employer') {
      const [profile] = await pool.query(
        `SELECT e.*, u.email 
         FROM employers e 
         JOIN users u ON e.user_id = u.id 
         WHERE e.user_id = ?`,
        [req.userId]
      );
      
      if (profile.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      res.json(profile[0]);
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
app.put('/api/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, skills, company_description, website } = req.body;
    
    if (req.userType === 'jobseeker') {
      await pool.query(
        `UPDATE job_seekers 
         SET name = ?, phone = ?, skills = ?
         WHERE user_id = ?`,
        [name, phone, skills, req.userId]
      );
    } else if (req.userType === 'employer') {
      await pool.query(
        `UPDATE employers 
         SET company_name = ?, phone = ?, company_description = ?, website = ?
         WHERE user_id = ?`,
        [name, phone, company_description, website, req.userId]
      );
    }
    
    console.log(`✅ Profile updated for user ${req.userId}`);
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Register: POST http://localhost:${PORT}/api/register`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/login`);
  console.log(`📋 Jobs: GET http://localhost:${PORT}/api/jobs`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
});