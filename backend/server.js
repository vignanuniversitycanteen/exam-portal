require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const session = require('express-session');
const { connectDB } = require('./db');
const { Exam, Seating, Admin, Student, Malpractice, syncDB } = require('./models');
const { Op } = require('sequelize');

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
// Google Client Removed
const nodemailer = require('nodemailer');

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const app = express();
app.enable('trust proxy'); // essential for correct protocol detection behind proxies

app.use(cors({
    origin: '*', // Allow all origins for dev
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Passport Config
app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: "/api/auth/microsoft/callback", // Relative URL for automatic domain detection
    scope: ['user.read']
},
    async function (accessToken, refreshToken, profile, done) {
        try {
            const email = profile.emails[0].value;
            if (!email.endsWith('@vignan.ac.in')) {
                return done(null, false, { message: 'Only @vignan.ac.in emails are allowed' });
            }

            // Logic similar to OTP login: Find or create student
            console.log('[DEBUG] Microsoft Login for:', email); // DEBUG LOG
            let student = await Student.findOne({ where: { email } });
            let isNewUser = false;

            if (!student) {
                isNewUser = true;
                // Extract reg number from email
                const emailPrefix = email.split('@')[0];
                const regNo = emailPrefix.toUpperCase();

                student = await Student.create({
                    email,
                    reg_no: regNo,
                    username: regNo,
                    full_name: profile.displayName, // Save Name from Microsoft
                    password_hash: await bcrypt.hash(speakeasy.generateSecret().base32, 10),
                    is_email_verified: true,
                    is_profile_complete: false // NEW USER
                });
            } else {

                // EXISTING USER:
                // Strict check: Only set to TRUE if data is present. 
                // CRITICAL FIX: NEVER auto-set to false here. If the DB says it's true, trust it unless we are sure.
                // Resetting to false caused the "loop" issue.

                const hasData = student.branch && student.academic_start && student.branch !== '-' && student.academic_start > 0;

                // Only upgrade to true if we found valid data
                if (hasData && !student.is_profile_complete) {
                    student.is_profile_complete = true;
                    await student.save();
                }

                // REMOVED the else-if block that set is_profile_complete = false
                // This prevents accidental resets if for some reason data lookup fails or is partial.
            }

            // Return user with isNewUser flag attached to the instance for initial redirect
            student.dataValues.isNewUser = isNewUser;
            return done(null, student);
        } catch (err) {
            return done(err);
        }
    }
));

// Microsoft Auth Routes
app.get('/api/auth/microsoft', passport.authenticate('microsoft', { prompt: 'select_account' }));

app.get('/api/auth/microsoft/callback', (req, res, next) => {
    passport.authenticate('microsoft', { session: false }, (err, user, info) => {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

        if (err) {
            console.error('Microsoft Auth Error:', err);
            return res.redirect(`${clientUrl}/student/login?error=server_error`);
        }

        if (!user) {
            // Check info for specific message
            const message = info && info.message ? info.message : 'auth_failed';
            if (message.includes('@vignan.ac.in')) {
                return res.redirect(`${clientUrl}/student/login?error=invalid_domain`);
            }
            return res.redirect(`${clientUrl}/student/login?error=auth_failed`);
        }

        // Success
        console.log(`[Auth] Microsoft Login Success for: ${user.email} (ID: ${user.id})`);

        // Ensure id exists
        const userId = user.id || user.dataValues?.id;
        if (!userId) {
            console.error('[Auth] Critical Error: User ID missing during token signing');
            return res.redirect(`${clientUrl}/student/login?error=auth_failed`);
        }

        const token = jwt.sign(
            { id: userId, role: 'student', username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Check if profile is complete (DB flag)
        // BUG FIX: Ignore DB flag if actual data is missing. Force checking data.
        const isProfileComplete = !!(user.branch && user.academic_start && user.branch !== '-' && user.academic_start > 0);
        const isNewUser = user.dataValues?.isNewUser || false;
        const email = user.email;

        res.redirect(`${clientUrl}/student/login?token=${token}&isNewUser=${isNewUser}&profileComplete=${isProfileComplete}&email=${email}`);
    })(req, res, next);
});

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

// Connect and Sync DB
connectDB();
syncDB().then(async () => {
    // Seed Main Admin
    const adminExists = await Admin.findOne({ where: { role: 'main_admin' } });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await Admin.create({
            username: 'admin',
            password_hash: hashedPassword,
            role: 'main_admin'
        });
        console.log('>>> Main Admin Created: admin / admin123');
    }
});

// Test Route
app.get('/', (req, res) => res.send('API is running...'));


// Middleware Definitions
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // console.log(`[Auth] Header: ${authHeader ? 'Present' : 'Missing'}`);

    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        // console.log('[Auth] Access Denied: No Token');
        return res.status(401).json({ error: 'Access Denied' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            console.log(`[Auth] Invalid Token: ${err.message}`);
            return res.status(403).json({ error: 'Invalid Token' });
        }

        try {
            let user = null;
            if (decoded.role === 'student') {
                user = await Student.findByPk(decoded.id);
            } else {
                user = await Admin.findByPk(decoded.id);
            }

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            req.user = user; // Sequelize instance
            next();
        } catch (error) {
            return res.status(500).json({ error: 'Auth Error' });
        }
    });
};

const authenticateTempToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access Denied' });

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid Token' });

        // specific check for mfa_setup stage
        if (decoded.stage !== 'mfa_setup') {
            return res.status(403).json({ error: 'Invalid Token Type' });
        }

        const user = await Admin.findByPk(decoded.id);
        if (!user) return res.status(401).json({ error: 'User not found' });

        req.user = user;
        next();
    });
};

const checkPermission = (permission) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Main Admin: Access All
        if (user.role === 'main_admin') return next();

        // Sub Admin: Check specific permission
        if (user.permissions && user.permissions.includes(permission)) {
            return next();
        }

        return res.status(403).json({ error: `Permission Denied: Requires '${permission}'` });
    };
};

const requireAdminManagement = checkPermission('manage_admins');

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, mfa_token } = req.body;

        // Allow login with Employee ID or Username
        const user = await Admin.findOne({
            where: {
                [Op.or]: [
                    { employee_id: username },
                    { username: username }
                ]
            }
        });

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        // MFA Check for Sub Admin (Main admins too if wanted, but code prioritized sub_admin)
        // Let's enforce MFA for ALL admins based on is_mfa_setup logic if desired, 
        // but preserving original logic: only checked for sub_admin? 
        // Original: if (user.role === 'sub_admin')
        // We should likely apply to both or keep logic same.
        // Let's keep logic same but verify fields exist on Admin model.

        if (user.role === 'sub_admin') {
            // Case 1: First time login (MFA not setup)
            if (!user.is_mfa_setup) {
                const tempToken = jwt.sign({ id: user.id, stage: 'mfa_setup' }, process.env.JWT_SECRET, { expiresIn: '10m' });
                return res.json({ mfa_setup_required: true, temp_token: tempToken });
            }

            // Case 2: Standard TOTP check
            if (!mfa_token) return res.status(403).json({ error: 'MFA Token required', mfa_required: true });

            const verified = speakeasy.totp.verify({
                secret: user.mfa_secret,
                encoding: 'base32',
                token: mfa_token
            });

            if (!verified) {
                // Backup Code Check
                const backupCodes = user.backup_codes || [];
                let codeIndex = -1;

                // Find match
                for (let i = 0; i < backupCodes.length; i++) {
                    const codeEntry = backupCodes[i];
                    const code = typeof codeEntry === 'string' ? codeEntry : codeEntry.code;
                    const isUsed = typeof codeEntry === 'string' ? false : codeEntry.used;

                    if (code === mfa_token && !isUsed) {
                        codeIndex = i;
                        break;
                    }
                }

                if (codeIndex !== -1) {
                    console.log('Backup Code Match!');
                    // Mark as used
                    const newCodes = [...backupCodes];
                    if (typeof newCodes[codeIndex] === 'string') {
                        newCodes[codeIndex] = { code: newCodes[codeIndex], used: true, usedAt: new Date() };
                    } else {
                        newCodes[codeIndex].used = true;
                        newCodes[codeIndex].usedAt = new Date();
                    }
                    // Convert rest if needed
                    user.backup_codes = newCodes.map(c => typeof c === 'string' ? { code: c, used: false } : c);
                    user.changed('backup_codes', true);
                    await user.save();

                } else {
                    return res.status(403).json({ error: 'Invalid MFA Token or Backup Code' });
                }
            }
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, permissions: user.permissions },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({ token, role: user.role, username: user.username, permissions: user.permissions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Google Login Removed

// Send Verification Email
app.post('/api/auth/send-verify-email', authenticateToken, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60000); // 10 mins

        const user = await Student.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.email_verification_otp = otp;
        user.email_verification_expires = expires;
        // If email is changing, we update it temporarily or just verify the new one?
        // Basic flow: User enters email -> Verify -> if success -> Update email and set verified=true
        // But for now, let's assume we are verifying the email provided in the body before saving it to profile?
        // Actually, for profile completion, we want to verify the email *before* finding it "valid".
        // But we need to save the OTP somewhere.
        // Let's save OTP to the user record.
        // We will NOT update user.email yet if it's different. We just verify.
        // Wait, if we don't update email, we can't verify 'that' email.
        // So: User says "I want this email". We send OTP to "this email".
        // Use session or temp storage? No, store on User but maybe adding a 'temp_email' field?
        // simpler: Store OTP. Frontend sends email + OTP to verify. Verified -> Update email & set is_email_verified=true.

        // BETTER APPROACH for simplicity:
        // 1. Send OTP to `email`. Store `otp` and `temp_email_target` (or just trust client sends same email back? No, insecure).
        // Let's add `temp_email` to model? Or just `email_verification_otp` and we trust the user receives it.
        // When verifying: Client sends email + OTP. We check if OTP matches. If yes -> user.email = email; user.is_email_verified = true.

        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your Email - Vignan Exam Portal',
            text: `Your verification code is: ${otp}. It expires in 10 minutes.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Email error:', error);
                // For development without valid creds, we can log it
                console.log(`[DEV] OTP for ${email}: ${otp}`);
                return res.json({ message: 'OTP sent (Check server logs if email fails)', dev_otp: otp });
            } else {
                console.log('Email sent: ' + info.response);
                res.json({ message: 'OTP sent successfully' });
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify Email OTP
app.post('/api/auth/verify-email-otp', authenticateToken, async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await Student.findByPk(req.user.id);

        if (!user.email_verification_otp || user.email_verification_otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (new Date() > user.email_verification_expires) {
            return res.status(400).json({ error: 'OTP Expired' });
        }

        // Verify Success
        user.email = email; // Update to the verified email
        user.is_email_verified = true;
        user.email_verification_otp = null;
        user.email_verification_expires = null;
        await user.save();

        res.json({ message: 'Email verified successfully', email: user.email });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- STUDENT OTP LOGIN (Microsoft Style) ---

// 1. Init Login (Send OTP)
app.post('/api/auth/student/otp-login-init', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        if (!email.endsWith('@vignan.ac.in')) {
            return res.status(400).json({ error: 'Only @vignan.ac.in emails are allowed.' });
        }

        // Extract Registration Number from Email (e.g., 211fa04113@vignan.ac.in -> 211FA04113)
        const regNo = email.split('@')[0].toUpperCase();

        // Check if student exists
        let user = await Student.findOne({ where: { email } });

        // If not found by email, try finding by Reg No (case where email might be different in DB? No, assume email is key)
        // Actually, we should try to find by reg_no too if we rely on it, but for now stick to email.

        if (!user) {
            // Create new student if not exists (Auto-register for first time login)
            user = await Student.create({
                username: regNo, // Use RegID as username
                reg_no: regNo,   // Auto-fill Reg No
                email: email,
                role: 'student',
                is_email_verified: true,
                is_profile_complete: false
            });
        } else {
            // Existing student: Smart check for data
            const isTrulyComplete = !!(user.branch && user.academic_start && user.branch !== '-' && user.academic_start > 0);
            if (user.is_profile_complete !== isTrulyComplete) {
                user.is_profile_complete = isTrulyComplete;
                await user.save();
            }
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60000); // 10 mins

        user.email_verification_otp = otp;
        user.email_verification_expires = expires;
        await user.save();

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Login Code - Vignan Exam Portal',
            text: `Your login verification code is: ${otp}. Do not share this code.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Email error:', error);
                console.log(`[DEV ONLY] OTP for ${email}: ${otp}`);
                return res.json({ message: 'OTP sent (Check logs for DEV)', dev_otp: otp });
            }
            res.json({ message: 'OTP sent successfully' });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server validation failed: ' + err.message });
    }
});

// 2. Verify OTP & Login
app.post('/api/auth/student/otp-login-verify', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

        const user = await Student.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.email_verification_otp || user.email_verification_otp !== otp) {
            return res.status(400).json({ error: 'Invalid code. Please try again.' });
        }

        if (new Date() > user.email_verification_expires) {
            return res.status(400).json({ error: 'Code expired. Request a new one.' });
        }

        // Verification Successful
        user.email_verification_otp = null;
        user.email_verification_expires = null;
        user.is_email_verified = true;
        await user.save();

        // Generate Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: 'student' },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({
            token,
            role: 'student',
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            reg_no: user.reg_no,
            branch: user.branch,
            section: user.section,
            current_year: user.current_year,
            academic_start: user.academic_start,
            academic_end: user.academic_end,
            academic_end: user.academic_end,
            is_profile_complete: !!(user.branch && user.academic_start && user.branch !== '-' && user.academic_start > 0)
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Complete Student Profile
app.post('/api/student/complete-profile', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can complete profile' });
        }

        const user = await Student.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check Email Verification
        if (!user.is_email_verified) {
            return res.status(400).json({ error: 'Please verify your email address first.' });
        }

        const { reg_no, section, branch, academic_start, academic_end, full_name, email, mobile_number, gender, dob } = req.body;

        // Ensure email matches user.email (which should be verified)
        if (email && email !== user.email) {
            return res.status(400).json({ error: 'Email mismatch. Please verify the new email.' });
        }

        const missing = [];
        if (!reg_no) missing.push('Registration Number');
        if (!section) missing.push('Section');
        if (!branch) missing.push('Branch');
        if (!academic_start) missing.push('Academic Start');
        if (!academic_end) missing.push('Academic End');
        if (!full_name) missing.push('Full Name');
        if (!mobile_number) missing.push('Mobile Number');
        if (!gender) missing.push('Gender');
        if (!dob) missing.push('Date of Birth');

        if (missing.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
        }

        // user fetched above

        // Calculate Current Year (Fully Dynamic)
        const currentYearNum = new Date().getFullYear();
        const yearNumber = currentYearNum - parseInt(academic_start) + 1;

        console.log('[DEBUG] Saving Profile:', { reg_no, branch, academic_start, yearNumber }); // DEBUG LOG

        let calculatedYear = '1st Year';
        if (currentYearNum > parseInt(academic_end)) {
            calculatedYear = 'Graduated / Alumni';
        } else if (yearNumber <= 0) {
            calculatedYear = 'Admission Pending';
        } else {
            const lastDigit = yearNumber % 10;
            const lastTwoDigits = yearNumber % 100;
            let suffix = 'th';
            if (lastTwoDigits < 11 || lastTwoDigits > 13) {
                if (lastDigit === 1) suffix = 'st';
                else if (lastDigit === 2) suffix = 'nd';
                else if (lastDigit === 3) suffix = 'rd';
            }
            calculatedYear = `${yearNumber}${suffix} Year`;
        }

        user.full_name = full_name;
        user.mobile_number = mobile_number;
        user.gender = gender;
        user.dob = dob;
        user.reg_no = reg_no;
        user.current_year = calculatedYear;
        user.section = section;
        user.branch = branch;
        user.academic_start = parseInt(academic_start);
        user.academic_end = parseInt(academic_end);
        user.is_profile_complete = true;
        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                ...user.toJSON(),
                is_profile_complete: true
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Get Current User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        let user = null;
        if (req.user.role === 'student') {
            user = await Student.findByPk(req.user.id);
        } else {
            user = await Admin.findByPk(req.user.id);
        }

        if (!user) return res.status(404).json({ error: 'User not found' });

        const userData = user.toJSON();
        if (userData.password_hash) delete userData.password_hash; // Security: Don't send hash

        // Profile Complete check mainly for students
        if (req.user.role === 'student') {
            // Dynamic check: Require essential fields to be truthy
            const hasData = user.branch && user.academic_start && user.branch !== '-' && user.academic_start > 0;
            userData.is_profile_complete = !!hasData;
        }

        res.json(userData);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Change Password (Self)
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await Admin.findByPk(req.user.id);

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password_hash = hashedPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Setup MFA (Self - if not already setup or if resetting)
app.post('/api/auth/setup-mfa-init', authenticateToken, async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({ name: `ExamPortal (${req.user.username})` });
        res.json({ secret: secret.base32, otpauth_url: secret.otpauth_url });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/setup-mfa-verify', authenticateToken, async (req, res) => {
    try {
        const { token, secret } = req.body; // Secret comes from client temporary storage during setup flow
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            const user = await Admin.findByPk(req.user.id);
            user.mfa_secret = secret;
            user.is_mfa_setup = true;

            // Generate Backup Codes (New Format: Objects)
            const backupCodes = Array.from({ length: 10 }, () => ({
                code: Array(6).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join(''),
                used: false
            }));

            user.backup_codes = backupCodes;

            await user.save();
            // Return just the codes for display
            res.json({ message: 'MFA Setup Complete', backup_codes: backupCodes.map(c => c.code) });
        } else {
            res.status(400).json({ error: 'Invalid Token' });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// View Backup Codes (Password Protected)
app.post('/api/auth/backup-codes/view', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        const user = await Admin.findByPk(req.user.id);

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });

        // Normalize codes (migration check)
        let codes = user.backup_codes || [];
        if (codes.length > 0 && typeof codes[0] === 'string') {
            codes = codes.map(c => ({ code: c, used: false }));
            user.backup_codes = codes;
            await user.save();
        }

        res.json({ backup_codes: codes });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Regenerate Backup Codes (Password Protected)
app.post('/api/auth/backup-codes/regenerate', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        const user = await Admin.findByPk(req.user.id);

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });

        const newCodes = Array.from({ length: 10 }, () => ({
            code: Array(6).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join(''),
            used: false
        }));

        user.backup_codes = newCodes;
        await user.save();

        res.json({ message: 'Codes Regenerated', backup_codes: newCodes });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 1. Generate QR Code (Setup Step 1)
app.post('/api/auth/mfa/setup', authenticateTempToken, async (req, res) => {
    try {
        const user = await Admin.findByPk(req.user.id);

        // Format: EMP001@username.examportal (Exactly as requested)
        const label = `${user.employee_id || user.id}@${user.username}.ExamPortal`;
        const secret = speakeasy.generateSecret({ name: label });

        user.mfa_secret = secret.base32;
        await user.save();

        QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return res.status(500).json({ error: 'QR Gen Failed' });
            res.json({ secret: secret.base32, qr_code: data_url });
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Verify & Finalize Setup (Setup Step 2)
app.post('/api/auth/mfa/verify', authenticateTempToken, async (req, res) => {
    try {
        const { token } = req.body;
        const user = await Admin.findByPk(req.user.id);

        const verified = speakeasy.totp.verify({
            secret: user.mfa_secret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            // Generate 10 random 6-letter alphabetic codes
            const backupCodes = Array.from({ length: 10 }, () => ({
                code: Array(6).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join(''),
                used: false
            }));

            user.is_mfa_setup = true;
            user.backup_codes = backupCodes;
            await user.save();
            res.json({ message: 'MFA Verified & Enabled', backup_codes: backupCodes.map(c => c.code) }); // Send only codes for display
        } else {
            res.status(400).json({ error: 'Invalid Token' });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create Admin (Sub Admin OR Main Admin)
app.post('/api/admin/create-user', authenticateToken, requireAdminManagement, async (req, res) => {
    try {
        const { username, employee_id, password, permissions, admin_password, role } = req.body;
        // Default to 'sub_admin' if not specified for backward compatibility
        const targetRole = role || 'sub_admin';

        if (!username || !password) return res.status(400).json({ error: 'Fields required' });
        if (!admin_password) return res.status(400).json({ error: 'Admin Password Check required' });

        // Security Check: Only Main Admin can create another Main Admin
        if (targetRole === 'main_admin' && req.user.role !== 'main_admin') {
            return res.status(403).json({ error: 'Only Main Admins can create other Main Admins.' });
        }

        const adminUser = await Admin.findByPk(req.user.id);
        if (!adminUser) return res.status(401).json({ error: 'Admin user not found. Please login again.' });

        const isAdminMatch = await bcrypt.compare(admin_password, adminUser.password_hash);
        if (!isAdminMatch) return res.status(403).json({ error: 'Incorrect Admin Password' });

        const existing = await Admin.findOne({ where: { username } });
        if (existing) return res.status(400).json({ error: 'Username already exists' });

        if (employee_id) {
            const existingId = await Admin.findOne({ where: { employee_id } });
            if (existingId) return res.status(400).json({ error: 'Employee ID already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // If creating Main Admin, they get ALL permissions explicitly
        // If creating Main Admin, they get ALL permissions explicitly
        const ALL_PERMISSIONS = ['manage_admins', 'manage_permissions', 'create_exams', 'edit_exams', 'delete_exams', 'archive_exams', 'publish_exams', 'download_attendance', 'download_seating', 'malpractice_entry'];
        const finalPermissions = targetRole === 'main_admin' ? ALL_PERMISSIONS : (permissions || []);

        await Admin.create({
            username,
            employee_id,
            password_hash: hashedPassword,
            role: targetRole,
            permissions: finalPermissions,
            is_mfa_setup: false
        });

        res.json({ message: `${targetRole === 'main_admin' ? 'Main Admin' : 'Sub Admin'} created. They must setup MFA on login.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List All Admins (Main & Sub)
app.get('/api/admin/users', authenticateToken, requireAdminManagement, async (req, res) => {
    try {
        const users = await Admin.findAll({
            // List ALL users (both main_admin and sub_admin)
            attributes: ['id', 'username', 'employee_id', 'createdAt', 'is_mfa_setup', 'permissions', 'role']
        });
        res.json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update Permissions
app.put('/api/admin/users/:id/permissions', authenticateToken, requireAdminManagement, async (req, res) => {
    try {
        const { permissions } = req.body;
        const user = await Admin.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.permissions = permissions;
        await user.save();
        res.json({ message: 'Permissions updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reset MFA (In case they lose phone)
app.post('/api/admin/users/:id/reset-mfa', authenticateToken, requireAdminManagement, async (req, res) => {
    try {
        const user = await Admin.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.is_mfa_setup = false;
        user.mfa_secret = null;
        user.backup_codes = [];
        await user.save();

        res.json({ message: 'MFA Reset. User must setup again.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete Sub Admin
app.delete('/api/admin/users/:id', authenticateToken, requireAdminManagement, async (req, res) => {
    try {
        const targetUser = await Admin.findByPk(req.params.id);
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        if (targetUser.role === 'main_admin') {
            return res.status(403).json({ error: 'Cannot delete Main Admin accounts.' });
        }

        await Admin.destroy({ where: { id: req.params.id } });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Get Live & Upcoming Exams
app.get('/api/exams/live', async (req, res) => {
    try {
        console.log('[API] /api/exams/live hit');
        const today = new Date().toISOString().split('T')[0];
        console.log('[API] querying exams >=', today);
        const exams = await Exam.findAll({
            where: {
                status: 'published',
                archived: false,
                date: {
                    [Op.gte]: today
                }
            },
            order: [['date', 'ASC'], ['time', 'ASC']]
        });
        console.log(`[API] found ${exams.length} live/upcoming exams`);
        res.json(exams);
    } catch (error) {
        console.error('[API] Error in /api/exams/live:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Create Exam & Generate Seating (Multi-Room Support)
app.post('/api/exams', authenticateToken, checkPermission('create_exams'), async (req, res) => {
    try {
        const { name, academicYear, date, time, batches, room_config, excluded_reg } = req.body;

        // Basic validation
        if (!name || !date || !time || !room_config || !Array.isArray(room_config)) {
            return res.status(400).json({ error: 'Missing required fields (name, date, time, room_config)' });
        }

        // 1. Calculate Total Students from all batches
        let allStudents = [];
        // Support legacy single-branch request or new multi-batch
        // If batches is present, use it. Otherwise construct from legacy fields if they exist.
        let batchList = batches;

        if (!batchList || batchList.length === 0) {
            // Check legacy fields
            if (req.body.branch && req.body.year && req.body.start_reg && req.body.end_reg) {
                batchList = [{
                    branch: req.body.branch,
                    year: req.body.year,
                    start_reg: req.body.start_reg,
                    end_reg: req.body.end_reg
                }];
            } else {
                return res.status(400).json({ error: 'Missing student data. Provide "batches" or legacy branch/year/reg fields.' });
            }
        }

        // Use a color/index for each batch to map to zones
        // batchList[0] -> Index 0, batchList[1] -> Index 1...

        // Create Set for O(1) exclusion check (Case Insensitive)
        const exclusionSet = new Set((excluded_reg || []).map(r => r.trim().toUpperCase()));

        batchList.forEach((batch, batchIdx) => {
            const startRegUpper = batch.start_reg.trim().toUpperCase();
            const endRegUpper = batch.end_reg.trim().toUpperCase();

            const prefix = startRegUpper.replace(/\d+$/, '');
            const startStr = startRegUpper.match(/\d+$/)?.[0];
            const endStr = endRegUpper.match(/\d+$/)?.[0];

            if (startStr && endStr) {
                const start = parseInt(startStr);
                const end = parseInt(endStr);
                for (let i = start; i <= end; i++) {
                    const regNo = `${prefix}${String(i).padStart(startStr.length, '0')}`.toUpperCase();
                    if (exclusionSet.has(regNo)) continue;
                    allStudents.push({
                        student_reg: regNo,
                        // Attach metadata to student for allocation
                        batchIndex: batchIdx
                    });
                }
            }
        });

        // 2. Validate Capacity
        // Calculate effective capacity considering disabled seats AND zones
        let totalCapacity = 0;
        room_config.forEach(room => {
            const blockedCount = room.disabled_seats ? room.disabled_seats.length : 0;
            totalCapacity += (room.rows * room.cols) - blockedCount;
        });

        if (allStudents.length > totalCapacity) {
            return res.status(400).json({ error: `Not enough seats! Students: ${allStudents.length}, Capacity: ${totalCapacity}` });
        }

        // 3. Create Exam Record
        const exam = await Exam.create({
            name, academicYear, date, time,
            // Store batches. For legacy fields, just use the first batch or empty
            branch: batchList.map(b => b.branch).join(', '),
            year: batchList[0]?.year || '',
            start_reg: batchList[0]?.start_reg || '',
            end_reg: batchList[batchList.length - 1]?.end_reg || '',
            batches: batchList,
            subjects: req.body.subjects || [], // Save optional subjects
            room_config,
            excluded_reg: excluded_reg || [],
            total_seats: totalCapacity
        });

        // 4. Allocate Seats (Zone-Aware Strategy)
        const seatings = [];

        // We need to distribute students into "Batch Queues"
        const batchQueues = {}; // { 0: [students...], 1: [students...] }
        batchList.forEach((_, idx) => batchQueues[idx] = []);
        allStudents.forEach(s => batchQueues[s.batchIndex].push(s));

        for (const room of room_config) {
            const { name, rows, cols, disabled_seats = [], zone_config = {}, fill_strategy = 'row', prevent_adjacency = false, aisle_interval = 0, strict_flow = false } = room;

            // Identify "Restricted Batches" for this room
            const restrictedBatchIndices = new Set(Object.values(zone_config).map(i => Number(i)));

            // Determine iteration order based on fill_strategy
            let seatOrder = [];
            if (fill_strategy === 'col') {
                for (let c = 1; c <= cols; c++) {
                    for (let r = 1; r <= rows; r++) seatOrder.push({ r, c });
                }
            } else {
                for (let r = 1; r <= rows; r++) {
                    for (let c = 1; c <= cols; c++) seatOrder.push({ r, c });
                }
            }

            // Track allocations to check adjacency: [r-c] -> batchIndex
            const allocations = {};

            for (const { r, c } of seatOrder) {
                const seatId = `${r}-${c}`;
                if (disabled_seats.includes(seatId)) continue; // Skip blocked

                let student = null;
                let allocatedBatchIndex = null;

                // --- ADJACENCY / STRICT FLOW CHECK ---
                let blockedBatches = new Set();

                if (prevent_adjacency) {
                    const isAisleInterval = aisle_interval > 0;


                    // Check logic (Refactored for Subject Strictness)
                    const checkNeighbor = (nBatchIdx) => {
                        if (nBatchIdx !== undefined) {
                            blockedBatches.add(nBatchIdx);
                            // Block Same Subject
                            const nSubject = batchList[nBatchIdx]?.subject;
                            if (nSubject) {
                                batchList.forEach((b, idx) => {
                                    if (b.subject && b.subject.trim().toLowerCase() === nSubject.trim().toLowerCase()) {
                                        blockedBatches.add(idx);
                                    }
                                });
                            }

                            // Block Same Branch (NEW: Strings "CSE" vs "CSE" check)
                            const nBranch = batchList[nBatchIdx]?.branch;
                            if (nBranch) {
                                batchList.forEach((b, idx) => {
                                    if (b.branch && b.branch.trim().toLowerCase() === nBranch.trim().toLowerCase()) {
                                        blockedBatches.add(idx);
                                    }
                                });
                            }
                        }
                    };

                    if (isAisleInterval && strict_flow) {
                        // STRICT MODE: Check ALL seats in the current "Bench"
                        const benchStartC = Math.floor((c - 1) / aisle_interval) * aisle_interval + 1;
                        for (let checkC = benchStartC; checkC < c; checkC++) {
                            checkNeighbor(allocations[`${r}-${checkC}`]);
                        }
                    } else {
                        // STANDARD MODE: Check only Left Neighbor
                        const leftC = c - 1;
                        const isAisleGap = isAisleInterval && (leftC % aisle_interval === 0);
                        if (leftC > 0 && !isAisleGap) {
                            checkNeighbor(allocations[`${r}-${leftC}`]);
                        }
                    }
                }

                // 1. Check Zone Restriction
                if (zone_config[seatId] !== undefined) {
                    const targetBatch = zone_config[seatId];

                    // Conflict Check
                    if (blockedBatches.has(targetBatch)) {
                        student = null; // Conflict! Leave empty.
                    } else if (batchQueues[targetBatch] && batchQueues[targetBatch].length > 0) {
                        student = batchQueues[targetBatch].shift();
                        allocatedBatchIndex = targetBatch;
                    }
                }
                // 2. No Zone: Take next available from any batch
                else {
                    for (const bIdx in batchQueues) {
                        const batchIndexNum = parseInt(bIdx);
                        if (restrictedBatchIndices.has(batchIndexNum)) continue; // SKIP restricted batches
                        if (blockedBatches.has(batchIndexNum)) continue; // SKIP conflicted batches

                        if (batchQueues[bIdx].length > 0) {
                            student = batchQueues[bIdx].shift();
                            allocatedBatchIndex = batchIndexNum;
                            break;
                        }
                    }
                }

                if (student) {
                    allocations[`${r}-${c}`] = allocatedBatchIndex;
                    seatings.push({
                        ExamId: exam.id,
                        student_reg: student.student_reg,
                        room_name: name,
                        seat_number: seatId,
                        row: r,
                        col: c
                    });
                }
            }
        }

        // Log warning if some students remain unseated (due to zone mismatches)
        const unseated = Object.values(batchQueues).reduce((acc, q) => acc + q.length, 0);
        if (unseated > 0) {
            console.warn(`${unseated} students could not be seated due to zone constraints or capacity.`);
            // In a real app, we might want to error out or alert the user.
        }

        await Seating.bulkCreate(seatings);

        res.status(201).json({ message: 'Exam created & Seating generated!', id: exam.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Edit Exam
app.put('/api/exams/:id', authenticateToken, checkPermission('edit_exams'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, academicYear, date, time, batches, room_config, excluded_reg } = req.body;

        // Basic validation
        if (!name || !date || !time || !room_config || !Array.isArray(room_config)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const exam = await Exam.findByPk(id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        if (exam.archived) return res.status(400).json({ error: 'Cannot edit an archived exam' });

        // 1. Calculate Total Students
        let allStudents = [];
        let batchList = batches || [];
        const exclusionSet = new Set((excluded_reg || []).map(r => r.trim().toUpperCase()));

        batchList.forEach((batch, batchIdx) => {
            const startRegUpper = batch.start_reg.trim().toUpperCase();
            const endRegUpper = batch.end_reg.trim().toUpperCase();

            const prefix = startRegUpper.replace(/\d+$/, '');
            const startStr = startRegUpper.match(/\d+$/)?.[0];
            const endStr = endRegUpper.match(/\d+$/)?.[0];
            if (startStr && endStr) {
                const start = parseInt(startStr);
                const end = parseInt(endStr);
                for (let i = start; i <= end; i++) {
                    const regNo = `${prefix}${String(i).padStart(startStr.length, '0')}`.toUpperCase();
                    if (exclusionSet.has(regNo)) continue;
                    allStudents.push({ student_reg: regNo, batchIndex: batchIdx });
                }
            }
        });

        // 2. Validate Capacity
        let totalCapacity = 0;
        room_config.forEach(room => {
            const blockedCount = room.disabled_seats ? room.disabled_seats.length : 0;
            totalCapacity += (room.rows * room.cols) - blockedCount;
        });

        if (allStudents.length > totalCapacity) {
            return res.status(400).json({ error: `Not enough seats! Students: ${allStudents.length}, Capacity: ${totalCapacity}` });
        }

        // 3. Update Exam Record
        await exam.update({
            name, academicYear, date, time,
            branch: batchList.map(b => b.branch).join(', '),
            year: batchList[0]?.year || '',
            start_reg: batchList[0]?.start_reg || '',
            end_reg: batchList[batchList.length - 1]?.end_reg || '',
            batches: batchList,
            subjects: req.body.subjects || [],
            room_config,
            excluded_reg: excluded_reg || [],
            total_seats: totalCapacity,
            status: 'created'
        });

        // 4. Re-Allocate Seats (Clear old, create new)
        await Seating.destroy({ where: { ExamId: id } });

        const seatings = [];
        const batchQueues = {};
        batchList.forEach((_, idx) => batchQueues[idx] = []);
        allStudents.forEach(s => batchQueues[s.batchIndex].push(s));

        for (const room of room_config) {
            const { name, rows, cols, disabled_seats = [], zone_config = {}, fill_strategy = 'row', prevent_adjacency = false, aisle_interval = 0, strict_flow = false } = room;

            const restrictedBatchIndices = new Set(Object.values(zone_config).map(i => Number(i)));

            let seatOrder = [];
            if (fill_strategy === 'col') {
                for (let c = 1; c <= cols; c++) {
                    for (let r = 1; r <= rows; r++) seatOrder.push({ r, c });
                }
            } else {
                for (let r = 1; r <= rows; r++) {
                    for (let c = 1; c <= cols; c++) seatOrder.push({ r, c });
                }
            }

            const allocations = {};

            for (const { r, c } of seatOrder) {
                const seatId = `${r}-${c}`;
                if (disabled_seats.includes(seatId)) continue;

                let student = null;
                let allocatedBatchIndex = null;

                // --- ADJACENCY CHECK ---
                let blockedBatches = new Set();
                if (prevent_adjacency) {
                    const isAisleInterval = aisle_interval > 0;
                    const checkNeighbor = (nBatchIdx) => {
                        if (nBatchIdx !== undefined) {
                            blockedBatches.add(nBatchIdx);
                            // Block Same Subject
                            const nSubject = batchList[nBatchIdx]?.subject;
                            if (nSubject) {
                                batchList.forEach((b, idx) => {
                                    if (b.subject && b.subject.trim().toLowerCase() === nSubject.trim().toLowerCase()) {
                                        blockedBatches.add(idx);
                                    }
                                });
                            }

                            // Block Same Branch
                            const nBranch = batchList[nBatchIdx]?.branch;
                            if (nBranch) {
                                batchList.forEach((b, idx) => {
                                    if (b.branch && b.branch.trim().toLowerCase() === nBranch.trim().toLowerCase()) {
                                        blockedBatches.add(idx);
                                    }
                                });
                            }
                        }
                    };

                    if (isAisleInterval && strict_flow) {
                        const benchStartC = Math.floor((c - 1) / aisle_interval) * aisle_interval + 1;
                        for (let checkC = benchStartC; checkC < c; checkC++) {
                            checkNeighbor(allocations[`${r}-${checkC}`]);
                        }
                    } else {
                        const leftC = c - 1;
                        const isAisleGap = isAisleInterval && (leftC % aisle_interval === 0);
                        if (leftC > 0 && !isAisleGap) {
                            checkNeighbor(allocations[`${r}-${leftC}`]);
                        }
                    }
                }

                if (zone_config[seatId] !== undefined) {
                    const targetBatch = zone_config[seatId];
                    if (blockedBatches.has(targetBatch)) {
                        student = null;
                    } else if (batchQueues[targetBatch] && batchQueues[targetBatch].length > 0) {
                        student = batchQueues[targetBatch].shift();
                        allocatedBatchIndex = targetBatch;
                    }
                }
                else {
                    for (const bIdx in batchQueues) {
                        const batchIndexNum = parseInt(bIdx);
                        if (restrictedBatchIndices.has(batchIndexNum)) continue;
                        if (blockedBatches.has(batchIndexNum)) continue;

                        if (batchQueues[bIdx].length > 0) {
                            student = batchQueues[bIdx].shift();
                            allocatedBatchIndex = batchIndexNum;
                            break;
                        }
                    }
                }

                if (student) {
                    allocations[`${r}-${c}`] = allocatedBatchIndex;
                    seatings.push({
                        ExamId: id, // Use ID from params
                        student_reg: student.student_reg,
                        room_name: name,
                        seat_number: seatId,
                        row: r,
                        col: c
                    });
                }
            }
        }

        await Seating.bulkCreate(seatings);
        res.json({ message: 'Exam Updated Successfully!', id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Archive Exam
app.put('/api/exams/:id/archive', authenticateToken, checkPermission('archive_exams'), async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findByPk(id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        exam.archived = !exam.archived; // Toggle
        await exam.save();
        res.json({ message: exam.archived ? 'Exam archived' : 'Exam restored', exam });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Publish Exam
app.put('/api/exams/:id/publish', authenticateToken, checkPermission('publish_exams'), async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findByPk(id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        if (exam.archived) return res.status(400).json({ error: 'Cannot publish an archived exam' });

        exam.status = 'published';
        await exam.save();
        res.json({ message: 'Exam published successfully', exam });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete Exam
app.delete('/api/exams/:id', authenticateToken, checkPermission('delete_exams'), async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findByPk(id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        await Seating.destroy({ where: { ExamId: id } }); // Cleanup seats
        await exam.destroy();

        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});




const sanitize = require('sanitize-filename');

// Excel: Attendance Sheet (Strict Branch Separation per Room)
app.get('/api/exams/:id/excel/attendance', authenticateToken, checkPermission('download_attendance'), async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findByPk(id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        const seatings = await Seating.findAll({
            where: { ExamId: id },
            order: [['student_reg', 'ASC']]
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Exam Cell';
        workbook.created = new Date();

        // 1. Group by ROOM first
        const groupedByRoom = {};
        seatings.forEach(seat => {
            if (!groupedByRoom[seat.room_name]) groupedByRoom[seat.room_name] = [];
            groupedByRoom[seat.room_name].push(seat);
        });

        const sortedRooms = Object.keys(groupedByRoom).sort();

        for (const roomName of sortedRooms) {
            const roomSeats = groupedByRoom[roomName];

            // 2. Sub-group by BRANCH within the room
            const groupedByBranch = {};

            roomSeats.forEach(seat => {
                let branchName = 'Unknown';
                let year = 'Unknown';

                if (exam.batches) {
                    const b = exam.batches.find(batch => {
                        const s = parseInt(batch.start_reg.replace(/\D/g, ''));
                        const e = parseInt(batch.end_reg.replace(/\D/g, ''));
                        const current = parseInt(seat.student_reg.replace(/\D/g, ''));
                        return current >= s && current <= e;
                    });
                    if (b) {
                        branchName = b.branch;
                        year = b.year;
                        subjectName = b.subject || '';
                    }
                }

                if (!groupedByBranch[branchName]) groupedByBranch[branchName] = [];
                groupedByBranch[branchName].push({ ...seat.dataValues, branchName, year, subjectName });
            });

            // 3. Create SINGLE Sheet per Room (All Branches Combined)

            // Sheet Name: Room Name (Sanitized & Limited)
            let rawSheetName = `${roomName}`;
            let sheetName = sanitize(rawSheetName).substring(0, 31);

            // Ensure unique sheet name
            let counter = 1;
            let originalName = sheetName;
            while (workbook.getWorksheet(sheetName)) {
                sheetName = `${originalName.substring(0, 28)}(${counter})`;
                counter++;
            }

            const sheet = workbook.addWorksheet(sheetName);
            // Page Setup: Fit width to 1 page, height unlimited
            sheet.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

            // Columns
            sheet.columns = [
                { header: 'S.No', key: 'sno', width: 8 },
                { header: 'Registration No', key: 'reg', width: 20 },
                { header: 'Branch', key: 'branch', width: 15 },
                { header: 'Year', key: 'year', width: 15 },
                { header: 'Subject', key: 'subject', width: 20 },
                { header: 'Room Number', key: 'room', width: 20 },
                { header: 'Signature', key: 'sign', width: 25 },
            ];

            // Header Style
            const headerRow = sheet.getRow(1);
            headerRow.font = { bold: true, size: 12 };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 25;

            // Titles (Insert at Top)
            // Note: Since we insert rows at top, we do it in reverse order or adjust indices. 
            // BUT, inserting rows shifts everything down. So we should add data first or insert titles last?
            // ExcelJS insertRow(1) pushes existing 1 to 2.

            // Let's add data first, then insert titles at the top.

            const sortedBranches = Object.keys(groupedByBranch).sort();

            // Continuous Serial Number Counter for the Room
            let currentSNo = 1;

            // Collect all rows first to calculate range
            let allRows = [];

            for (const branch of sortedBranches) {
                const branchSeats = groupedByBranch[branch];
                // Sort by Reg
                branchSeats.sort((a, b) => {
                    const regA = a.student_reg || '';
                    const regB = b.student_reg || '';
                    return regA.localeCompare(regB, undefined, { numeric: true, sensitivity: 'base' });
                });

                branchSeats.forEach(seat => allRows.push({ ...seat, branch }));
            }

            // Write Data
            allRows.forEach((seat) => {
                sheet.addRow({
                    sno: currentSNo++,
                    reg: seat.student_reg,
                    branch: seat.branchName,
                    year: seat.year,
                    subject: seat.subjectName,
                    room: roomName,
                    sign: ''
                });
            });

            // Calculate Range from allRows
            // Calculate Range from allRows
            // Create a string like "CSE: 101-120 | ECE: 201-225"
            const rangeStrings = [];
            for (const branch of sortedBranches) {
                const branchSeats = groupedByBranch[branch];
                if (branchSeats && branchSeats.length > 0) {
                    // Assuming already sorted by reg
                    const min = branchSeats[0].student_reg;
                    const max = branchSeats[branchSeats.length - 1].student_reg;
                    rangeStrings.push(`${branch}: ${min} - ${max}`);
                }
            }
            const rangeText = rangeStrings.join('  |  ');

            // Now Insert Title Rows at Top
            // Use spliceRows to insert 4 rows at index 1 (pushing current 1 down)
            sheet.spliceRows(1, 0,
                [`${exam.name} - ${roomName}`],
                [`Date: ${new Date(exam.date).toLocaleDateString()} | Time: ${exam.time}`],
                [rangeText],
                []
            );

            // Repeat Headers on Each Page (Row 5 is the Header)
            sheet.pageSetup.printTitlesRow = '5:5';

            // --- UNIVERSAL BORDER STYLING (Post-Splice) ---
            // Iterate from Row 5 (Header) to the last row
            // We use explicit loop to ensuring EMPTY cells also get borders!
            const lastRowIdx = sheet.lastRow ? sheet.lastRow.number : 5;
            for (let r = 5; r <= lastRowIdx; r++) {
                const row = sheet.getRow(r);
                for (let c = 1; c <= 7; c++) {
                    const cell = row.getCell(c);
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };

                    if (r === 5) { // Header Row Special Style
                        cell.border = { top: { style: 'thick' }, left: { style: 'thick' }, bottom: { style: 'thick' }, right: { style: 'thick' } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }; // Light Gray
                        cell.font = { bold: true, size: 12 };
                    }
                }
            }

            // Now Merge Cells for the newly inserted rows
            sheet.mergeCells('A1:G1'); // Main Title (Up to G because added Subject col)
            const titleRow = sheet.getRow(1);
            titleRow.font = { bold: true, size: 14 };
            titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
            titleRow.height = 30;

            sheet.mergeCells('A2:G2'); // Sub Title
            const subTitleRow = sheet.getRow(2);
            subTitleRow.font = { italic: true, size: 11 };
            subTitleRow.alignment = { vertical: 'middle', horizontal: 'center' };
            subTitleRow.height = 20;

            sheet.mergeCells('A3:G3'); // Range
            const rangeRow = sheet.getRow(3);
            rangeRow.font = { bold: true, size: 11 };
            rangeRow.alignment = { vertical: 'middle', horizontal: 'center' };
            rangeRow.height = 20;
        }

        const safeFilename = sanitize(`${exam.name}_Attendance.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// PDF: Attendance Sheet (Strict Branch Separation per Room)
app.get('/api/exams/:id/pdf/attendance', authenticateToken, checkPermission('download_attendance'), async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findByPk(id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        const seatings = await Seating.findAll({
            where: { ExamId: id },
            order: [['student_reg', 'ASC']]
        });

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const safeFilename = sanitize(`${exam.name}_Attendance.pdf`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}`);
        doc.pipe(res);

        // 1. Group by ROOM first
        const groupedByRoom = {};
        seatings.forEach(seat => {
            if (!groupedByRoom[seat.room_name]) groupedByRoom[seat.room_name] = [];
            groupedByRoom[seat.room_name].push(seat);
        });

        const sortedRooms = Object.keys(groupedByRoom).sort();
        let isFirstPage = true;

        for (const roomName of sortedRooms) {
            const roomSeats = groupedByRoom[roomName];

            // 2. Sub-group by BRANCH within the room
            const groupedByBranch = {};

            roomSeats.forEach(seat => {
                let branchName = 'Unknown';
                let year = 'Unknown';

                if (exam.batches) {
                    const b = exam.batches.find(batch => {
                        const s = parseInt(batch.start_reg.replace(/\D/g, ''));
                        const e = parseInt(batch.end_reg.replace(/\D/g, ''));
                        const current = parseInt(seat.student_reg.replace(/\D/g, ''));
                        return current >= s && current <= e;
                    });
                    if (b) {
                        branchName = b.branch;
                        year = b.year;
                        subjectName = b.subject || '';
                    }
                }

                if (!groupedByBranch[branchName]) groupedByBranch[branchName] = [];
                groupedByBranch[branchName].push({ ...seat.dataValues, branchName, year, subjectName });
            });

            const sortedBranches = Object.keys(groupedByBranch).sort();

            // Continuous Serial Number Counter for the Room
            let currentSNo = 1;

            // Collect All Rows for this Room
            let allRows = [];
            for (const branch of sortedBranches) {
                const branchSeats = groupedByBranch[branch];
                // Sort by Reg
                branchSeats.sort((a, b) => {
                    const regA = a.student_reg || '';
                    const regB = b.student_reg || '';
                    return regA.localeCompare(regB, undefined, { numeric: true, sensitivity: 'base' });
                });

                branchSeats.forEach(seat => allRows.push({ ...seat, branch }));
            }

            // Calculate Range from allRows
            const rangeStrings = [];
            for (const branch of sortedBranches) {
                const branchSeats = groupedByBranch[branch];
                if (branchSeats && branchSeats.length > 0) {
                    const min = branchSeats[0].student_reg;
                    const max = branchSeats[branchSeats.length - 1].student_reg;
                    rangeStrings.push(`${branch}: ${min} - ${max}`);
                }
            }
            const rangeText = rangeStrings.join('  |  ');

            // --- ROOM HEADER (Start New Page per Room) ---
            if (!isFirstPage) doc.addPage();
            isFirstPage = false;

            // Function to draw Page Header
            const drawHeader = () => {
                doc.font('Helvetica-Bold').fontSize(16).text(exam.name, { align: 'center' });
                doc.fontSize(12).text(`Attendance Sheet - ${roomName}`, { align: 'center' });
                doc.moveDown(0.2);

                doc.font('Helvetica-Oblique').fontSize(10).text(`${new Date(exam.date).toLocaleDateString()}  |  ${exam.time}`, { align: 'center' });
                doc.text(rangeText, { align: 'center' });
                doc.moveDown(0.8);
            };

            drawHeader();

            // Table Settings
            const tableTop = doc.y;
            const startX = 30;
            const rowHeight = 25;

            // Define Columns (Widths)
            const colWidths = [30, 80, 60, 45, 80, 80, 160];
            const headers = ['S.No', 'Reg No', 'Branch', 'Year', 'Subject', 'Room No', 'Signature'];

            // Function to draw a row (header or data)
            const drawRow = (y, data, isHeader = false) => {
                let currentX = startX;
                doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(isHeader ? 10 : 9);

                data.forEach((text, idx) => {
                    // Draw Cell Box
                    doc.rect(currentX, y, colWidths[idx], rowHeight).stroke();

                    // Draw Text (Centered)
                    doc.text(text, currentX, y + 8, {
                        width: colWidths[idx],
                        align: 'center'
                    });

                    currentX += colWidths[idx];
                });
            };

            // Draw Initial Table Header
            doc.fillColor('black');
            doc.lineWidth(1);
            doc.rect(startX, tableTop, 535, rowHeight).fill('#f1f5f9').stroke();
            doc.fillColor('black');
            drawRow(tableTop, headers, true);

            let y = tableTop + rowHeight;

            // Draw All Data Rows
            allRows.forEach((seat) => {
                if (y > 750) { // New page if full
                    doc.addPage();
                    y = 50; // Restart Y

                    // Simple Header on continuation pages
                    doc.rect(startX, y, 535, rowHeight).fill('#f1f5f9').stroke();
                    doc.fillColor('black');
                    drawRow(y, headers, true);
                    y += rowHeight;
                }

                const rowData = [
                    (currentSNo++).toString(),
                    seat.student_reg,
                    seat.branchName, // Branch is now just a column value
                    seat.year,
                    seat.subjectName || '-',
                    roomName,
                    '' // Signature is empty
                ];

                drawRow(y, rowData, false);
                y += rowHeight;
            });
        }

        doc.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// PDF: Seating Chart
app.get('/api/exams/:id/pdf/seating', authenticateToken, checkPermission('download_seating'), async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findByPk(id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        const seatings = await Seating.findAll({
            where: { ExamId: id },
            order: [['room_name', 'ASC'], ['row', 'ASC'], ['col', 'ASC']]
        });

        // A4 Landscape: 841.89 x 595.28 points
        const pageW = 841.89;
        const pageH = 595.28;
        const margin = 20; // Reduced margin for wider boxes

        // autoFirstPage: false because we add pages manually in the loop
        const doc = new PDFDocument({ margin: margin, layout: 'landscape', size: 'A4', autoFirstPage: false });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=seating_chart_${id}.pdf`);
        doc.pipe(res);

        // Group by Room
        const seatsByRoom = {};
        seatings.forEach(seat => {
            if (!seatsByRoom[seat.room_name]) seatsByRoom[seat.room_name] = [];
            seatsByRoom[seat.room_name].push(seat);
        });

        for (const [roomName, seats] of Object.entries(seatsByRoom)) {
            doc.addPage();

            // --- PAGE HEADER ---
            doc.font('Helvetica-Bold').fontSize(18).text(exam.name, { align: 'center' });

            let headerInfo = `${exam.branch} - ${exam.year} | ${new Date(exam.date).toLocaleDateString()} | ${exam.time}`;
            if (exam.subjects && exam.subjects.length > 0) {
                headerInfo += `\nSubject(s): ${exam.subjects.join(', ')}`;
            }

            doc.font('Helvetica').fontSize(12).text(headerInfo, { align: 'center' });
            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').fontSize(14).text(`Room: ${roomName}`, { underline: true });

            // --- STAGE AREA ---
            // Calculate available vertical space first to position grid correctly
            const topHeaderY = doc.y; // Y position after headers

            const stageH = 25;
            const stageY = topHeaderY + 10;
            const stageW = 300;
            const stageX = (pageW - stageW) / 2; // Center horizontally

            doc.roundedRect(stageX, stageY, stageW, stageH, 5)
                .lineWidth(2)
                .strokeColor('#cbd5e1')
                .fillColor('#f1f5f9')
                .fillAndStroke();

            doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(10)
                .text('STAGE / BLACKBOARD AREA', stageX, stageY + 8, { width: stageW, align: 'center' });

            doc.fillColor('black').strokeColor('black'); // Reset

            // --- GRID CALCULATIONS ---
            const startGridY = stageY + stageH + 20; // Gap below stage

            // Find room config
            const roomConfig = exam.room_config.find(r => r.name === roomName) || { rows: 5, cols: 5 };
            const rows = roomConfig.rows;
            const cols = roomConfig.cols;
            const aisleInterval = roomConfig.aisle_interval || 0;

            const usableW = pageW - (margin * 2);
            const usableH = pageH - startGridY - margin; // Remaining height

            const gap = 5;
            const aisleGap = 20; // Wider gap for aisles

            // Calculate Total Gap Width
            let totalGapW = 0;
            if (aisleInterval > 0) {
                const numAisles = Math.floor((cols - 1) / aisleInterval);
                const numStdGaps = (cols - 1) - numAisles;
                totalGapW = (numAisles * aisleGap) + (numStdGaps * gap);
            } else {
                totalGapW = (cols - 1) * gap;
            }

            const totalGapH = (rows - 1) * gap;

            // Calculate max cell size allowed by space
            let cellW = (usableW - totalGapW) / cols;
            let cellH = (usableH - totalGapH) / rows;

            // Optional: Cap max size if few seats
            const MAX_CELL_H = 100;
            if (cellH > MAX_CELL_H) cellH = MAX_CELL_H;

            // --- DRAW SEATS (Iterate Full Layout) ---
            for (let r = 1; r <= rows; r++) {
                for (let c = 1; c <= cols; c++) {
                    const seatId = `${r}-${c}`;

                    // Skip Disabled
                    if (roomConfig.disabled_seats && roomConfig.disabled_seats.includes(seatId)) {
                        continue;
                    }

                    // Calculate Position
                    const cIndex = c - 1;
                    const rIndex = r - 1;

                    let x = margin;
                    if (aisleInterval > 0) {
                        const numAislesBefore = Math.floor(cIndex / aisleInterval);
                        const numStdGapsBefore = cIndex - numAislesBefore;
                        x += (cIndex * cellW) + (numStdGapsBefore * gap) + (numAislesBefore * aisleGap);
                    } else {
                        x += cIndex * (cellW + gap);
                    }

                    const y = startGridY + rIndex * (cellH + gap);

                    // Check for Assignment
                    const assignment = seats.find(s => s.row === r && s.col === c);

                    if (assignment) {
                        // --- DRAW FILLED SEAT ---

                        // Find branch
                        let branchName = 'STUDENT';
                        if (exam.batches) {
                            const b = exam.batches.find(batch => {
                                const s = parseInt(batch.start_reg.replace(/\D/g, ''));
                                const e = parseInt(batch.end_reg.replace(/\D/g, ''));
                                const current = parseInt(assignment.student_reg.replace(/\D/g, ''));
                                return current >= s && current <= e;
                            });
                            if (b) branchName = b.branch;
                        }

                        // Draw Box
                        doc.rect(x, y, cellW, cellH).lineWidth(1).stroke();

                        // 1. Reg No (Top)
                        const regFontSize = Math.min(8, cellH * 0.18);
                        doc.font('Helvetica-Bold').fontSize(regFontSize).text(assignment.student_reg, x, y + (cellH * 0.15), {
                            width: cellW, align: 'center'
                        });

                        // 2. Branch (Middle)
                        const branchFontSize = Math.min(7, cellH * 0.12);
                        doc.font('Helvetica').fontSize(branchFontSize).fillColor('gray')
                            .text(branchName, x, y + (cellH * 0.45), {
                                width: cellW, align: 'center'
                            });
                        doc.fillColor('black'); // Reset

                        // 3. Signature (Bottom - Empty)

                    } else {
                        // --- DRAW EMPTY SEAT ---
                        // Just an outline, no text
                        doc.rect(x, y, cellW, cellH).lineWidth(1).strokeColor('#e2e8f0').stroke(); // Lighter border for empty
                        doc.strokeColor('black'); // Reset
                    }
                }
            }
        } // End Room Loop

        if (Object.keys(seatsByRoom).length === 0) {
            // Handle edge case: Exam exists but no seats? Add blank page to avoid error or simple msg
            doc.addPage();
            doc.text("No seating data available for this exam.");
        }

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});



// Get Room Layout for Visualization
app.get('/api/exams/:id/rooms/:room_name/layout', async (req, res) => {
    try {
        const { id, room_name } = req.params;
        const exam = await Exam.findByPk(id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // Find the specific room config
        const roomConfig = exam.room_config.find(r => r.name === room_name);
        if (!roomConfig) return res.status(404).json({ error: 'Room not found in exam config' });

        // Get all seats for this room to mark them as occupied
        const seats = await Seating.findAll({
            where: {
                ExamId: id,
                room_name: room_name
            },
            attributes: ['row', 'col', 'seat_number', 'student_reg']
        });

        res.json({
            room: roomConfig,
            seats: seats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/seating/lookup - Find student seat for malpractice entry
app.get('/api/seating/lookup', authenticateToken, checkPermission('malpractice_entry'), async (req, res) => {
    try {
        const { reg, exam_id } = req.query;
        if (!reg || !exam_id) {
            return res.status(400).json({ error: 'Registration number and Exam ID are required' });
        }

        const cleanReg = reg.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const cleanExamId = parseInt(exam_id);

        console.log(`[Seat Lookup] Querying for Reg: "${cleanReg}", ExamID: ${cleanExamId}`);

        // Try direct match
        let seat = await Seating.findOne({
            where: {
                student_reg: cleanReg,
                ExamId: cleanExamId
            }
        });

        // Fallback: Case-insensitive search if direct match fails
        if (!seat) {
            console.log(`[Seat Lookup] Direct match failed for "${cleanReg}". Trying case-insensitive...`);
            seat = await Seating.findOne({
                where: {
                    ExamId: cleanExamId,
                    [Op.and]: [
                        sequelize.where(
                            sequelize.fn('UPPER', sequelize.col('student_reg')),
                            cleanReg
                        )
                    ]
                }
            });
        }

        if (!seat) {
            console.log(`[Seat Lookup] No seat found for ${cleanReg} in Exam ${cleanExamId}`);
            return res.status(404).json({ error: 'No seat found for this student in this exam' });
        }

        res.json(seat);
    } catch (error) {
        console.error('Seat Lookup Error:', error);
        res.status(500).json({ error: 'Server error during seat lookup' });
    }
});


// Get Seating for Student (Strict Check)
app.get('/api/seating', async (req, res) => {
    try {
        let { reg_no, branch, year } = req.query;
        if (reg_no) reg_no = reg_no.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        // Validation: Need either (Reg No) OR (Branch AND Year)
        if (!reg_no && (!branch || !year)) {
            return res.status(400).json({ error: 'Provide either Registration Number OR (Branch and Year)' });
        }

        console.log(`Searching for Seat: Reg=${reg_no}, Branch=${branch}, Year=${year}`);

        const seatings = await Seating.findAll({
            where: { student_reg: reg_no },
            include: [{
                model: Exam,
                where: {
                    // Removed strict branch/year check to allow multi-branch exams to work
                    status: 'published', // Only show published exams
                    archived: false // Strict check: Don't show if archived
                }
            }]
        });

        console.log(`Found ${seatings.length} seats.`);
        if (seatings.length === 0) {
            // Debug: Check if student exists at all
            const studentExists = await Seating.findOne({ where: { student_reg: reg_no } });
            console.log(`Debug - Student ${reg_no} exists in DB (any status): ${!!studentExists}`);
        }

        // Filter results strictly if branch/year provided
        const filteredSeatings = seatings.filter(seat => {
            if (!branch && !year) return true; // No filter requested

            const exam = seat.Exam;
            let studentBranch = exam.branch; // Default
            let studentYear = exam.year;
            let resolvedFromBatch = false;

            // Resolve specific branch from batches if available
            if (exam.batches && Array.isArray(exam.batches) && exam.batches.length > 0) {
                const getNum = (str) => parseInt(str.replace(/\D/g, '')) || 0;
                const currentReg = getNum(seat.student_reg);

                const match = exam.batches.find(b => {
                    const startVal = getNum(b.start_reg);
                    const endVal = getNum(b.end_reg);
                    return currentReg >= startVal && currentReg <= endVal;
                });

                if (match) {
                    studentBranch = match.branch;
                    studentYear = match.year;
                    resolvedFromBatch = true;
                }
            }

            // Perform strict check
            const branchMatch = !branch || (studentBranch && studentBranch.toUpperCase() === branch.toUpperCase());
            const yearMatch = !year || (studentYear && studentYear === year);

            if (!branchMatch || !yearMatch) {
                console.log(`Debug - Filter Reject: Student ${seat.student_reg} (Resolved: ${studentBranch}, ${studentYear}) vs Request (${branch}, ${year}) [BatchResolved: ${resolvedFromBatch}]`);
            } else {
                console.log(`Debug - Filter Match: Student ${seat.student_reg} (Resolved: ${studentBranch})`);
            }

            return branchMatch && yearMatch;
        });

        res.json(filteredSeatings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all exams (for Admin view)
app.get('/api/exams', authenticateToken, async (req, res) => {
    try {
        const { archived } = req.query;
        const whereClause = {};
        if (archived === 'true') {
            whereClause.archived = true;
        } else {
            whereClause.archived = false;
        }
        const exams = await Exam.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});


// Get Unique Branches
app.get('/api/branches', async (req, res) => {
    try {
        const exams = await Exam.findAll({ attributes: ['batches'] });
        const branches = new Set();
        exams.forEach(exam => {
            if (exam.batches && Array.isArray(exam.batches)) {
                exam.batches.forEach(b => {
                    if (b.branch) branches.add(b.branch.toUpperCase());
                });
            }
        });
        res.json(Array.from(branches).sort());
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Seating Summary (Ranges per Room for a Branch)
app.get('/api/seating/summary', async (req, res) => {
    try {
        const { branch, year } = req.query;
        if (!branch) return res.status(400).json({ error: 'Branch is required' });

        const seats = await Seating.findAll({
            include: [{
                model: Exam,
                where: { status: 'published', archived: false },
                attributes: ['id', 'name', 'batches']
            }],
            order: [['room_name', 'ASC'], ['seat_number', 'ASC']]
        });

        // Filter for Branch match
        const relevantSeats = seats.filter(seat => {
            const examBatches = seat.Exam.batches || [];
            const studentReg = seat.student_reg;
            const matchBatch = examBatches.find(b => {
                const s = parseInt(b.start_reg.replace(/\D/g, ''));
                const e = parseInt(b.end_reg.replace(/\D/g, ''));
                const curr = parseInt(studentReg.replace(/\D/g, ''));
                return curr >= s && curr <= e;
            });
            return matchBatch && matchBatch.branch.toUpperCase() === branch.toUpperCase();
        });

        // Group by Room
        const byRoom = {};
        relevantSeats.forEach(s => {
            if (!byRoom[s.room_name]) byRoom[s.room_name] = [];
            byRoom[s.room_name].push(s.student_reg);
        });

        // Calculate Ranges
        const summary = [];
        for (const [room, regs] of Object.entries(byRoom)) {
            if (regs.length === 0) continue;
            const distinctRegs = [...new Set(regs)].sort();
            const min = distinctRegs[0];
            const max = distinctRegs[distinctRegs.length - 1];

            summary.push({
                room_name: room,
                start_reg: min,
                end_reg: max,
                count: distinctRegs.length
            });
        }
        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


// Malpractice Entry
app.post('/api/malpractice', authenticateToken, checkPermission('malpractice_entry'), async (req, res) => {
    try {
        let { student_reg, exam_id, reason, severity, action_taken } = req.body;
        if (student_reg) student_reg = student_reg.trim().toUpperCase();

        if (!student_reg || !exam_id || !reason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const entry = await Malpractice.create({
            student_reg,
            exam_id,
            reason,
            severity: severity || 'Medium',
            action_taken,
            reported_by: req.user.username
        });

        res.json({ message: 'Malpractice Recorded', entry });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Malpractice Entry
app.put('/api/malpractice/:id', authenticateToken, checkPermission('malpractice_entry'), async (req, res) => {
    try {
        const { id } = req.params;
        const { student_reg, reason, severity, action_taken } = req.body;

        const entry = await Malpractice.findByPk(id);
        if (!entry) return res.status(404).json({ error: 'Entry not found' });

        // Update fields
        if (student_reg) entry.student_reg = student_reg;
        if (reason) entry.reason = reason;
        if (severity) entry.severity = severity;
        if (action_taken) entry.action_taken = action_taken;

        await entry.save();

        res.json({ message: 'Entry Updated', entry });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete Malpractice Entry
app.delete('/api/malpractice/:id', authenticateToken, checkPermission('malpractice_entry'), async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await Malpractice.findByPk(id);
        if (!entry) return res.status(404).json({ error: 'Entry not found' });

        await entry.destroy();
        res.json({ message: 'Entry Deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Malpractice Logs
app.get('/api/malpractice', authenticateToken, checkPermission('malpractice_entry'), async (req, res) => {
    try {
        const logs = await Malpractice.findAll({
            include: [{ model: Exam, attributes: ['name', 'date'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


// -------------------------------------------------------------------------
// NEW: Malpractice Registry Downloads (Specific to Exam)
// -------------------------------------------------------------------------

// JSON List (for selection UI)
app.get('/api/exams/:id/malpractice', authenticateToken, checkPermission('malpractice_entry'), async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findByPk(id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        const entries = await Malpractice.findAll({
            where: { exam_id: id },
            order: [['student_reg', 'ASC']]
        });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Excel Download
app.get('/api/exams/:id/malpractice/excel', authenticateToken, checkPermission('malpractice_entry'), async (req, res) => {
    try {
        console.log(`[Excel Download] Request for Exam ${req.params.id}`);
        const { id } = req.params;
        const { ids } = req.query; // Optional: Comma separated IDs
        console.log(`[Excel] IDs Param: ${ids}`);

        const exam = await Exam.findByPk(id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        const whereClause = { exam_id: id };
        if (ids) {
            const idList = ids.split(',').map(Number);
            whereClause.id = { [Op.in]: idList };
        }

        const entries = await Malpractice.findAll({
            where: whereClause,
            order: [['student_reg', 'ASC']]
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Malpractice Registry');

        sheet.columns = [
            { header: 'S.No', key: 'sno', width: 8 },
            { header: 'Student Reg', key: 'reg', width: 20 },
            { header: 'Branch', key: 'branch', width: 15 },
            { header: 'Severity', key: 'severity', width: 15 },
            { header: 'Incident Details', key: 'reason', width: 40 },
            { header: 'Action Taken', key: 'action', width: 30 },
            { header: 'Reported By', key: 'reporter', width: 20 },
            { header: 'Date', key: 'date', width: 15 }
        ];

        // Header Style
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }; // Dark Gray
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        let sno = 1;
        entries.forEach(entry => {
            // Resolve Branch from Exam Batches if possible
            let branch = '-';
            if (exam.batches && Array.isArray(exam.batches)) {
                // Simple regex fetch
                const regNum = parseInt(entry.student_reg.replace(/\D/g, '')) || 0;
                const batch = exam.batches.find(b => {
                    const s = parseInt(b.start_reg.replace(/\D/g, ''));
                    const e = parseInt(b.end_reg.replace(/\D/g, ''));
                    return regNum >= s && regNum <= e;
                });
                if (batch) branch = batch.branch;
            }

            const row = sheet.addRow({
                sno: sno++,
                reg: entry.student_reg,
                branch: branch,
                severity: entry.severity,
                reason: entry.reason,
                action: entry.action_taken || 'Pending',
                reporter: entry.reported_by || '-',
                date: new Date(entry.createdAt).toLocaleDateString()
            });

            // Styling
            row.alignment = { vertical: 'top', wrapText: true };
            const sevCell = row.getCell('severity');
            if (entry.severity === 'Critical') sevCell.font = { color: { argb: 'FFDC2626' }, bold: true };
            if (entry.severity === 'High') sevCell.font = { color: { argb: 'FFF97316' }, bold: true };
        });

        // Add Title Row at Top
        sheet.spliceRows(1, 0, [`${exam.name} - Malpractice Registry`], [`Date: ${new Date(exam.date).toLocaleDateString()}`], []);

        sheet.mergeCells('A1:H1');
        sheet.getCell('A1').font = { bold: true, size: 14 };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        sheet.mergeCells('A2:H2');
        sheet.getCell('A2').font = { italic: true };
        sheet.getCell('A2').alignment = { horizontal: 'center' };

        const safeFilename = `${exam.name.replace(/[^a-z0-9]/gi, '_')}_Malpractice.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PDF Download
app.get('/api/exams/:id/malpractice/pdf', authenticateToken, checkPermission('malpractice_entry'), async (req, res) => {
    try {
        console.log(`[PDF Download] Request for Exam ${req.params.id}`);
        const { id } = req.params;
        const { ids } = req.query;
        console.log(`[PDF] IDs Param: ${ids}`);

        const exam = await Exam.findByPk(id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        const whereClause = { exam_id: id };
        if (ids) {
            const idList = ids.split(',').map(Number);
            whereClause.id = { [Op.in]: idList };
        }

        const entries = await Malpractice.findAll({
            where: whereClause,
            order: [['student_reg', 'ASC']]
        });

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const safeFilename = `${exam.name.replace(/[^a-z0-9]/gi, '_')}_Malpractice.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}`);
        doc.pipe(res);

        // Header
        doc.font('Helvetica-Bold').fontSize(16).text(exam.name, { align: 'center' });
        doc.fontSize(12).text('Malpractice Registry', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Date: ${new Date(exam.date).toLocaleDateString()} | Time: ${exam.time}`, { align: 'center' });
        doc.moveDown(1);

        // Table Constants
        const startX = 30;
        const colWidths = [30, 80, 50, 60, 150, 100, 65];
        // S.No, Reg, Branch, Severity, Reason, Action, Date
        const headers = ['#', 'Reg No', 'Branch', 'Severity', 'Incident', 'Action Taken', 'Date'];

        let y = doc.y;
        const rowHeight = 20;

        // Draw Header
        doc.font('Helvetica-Bold').fontSize(9);
        doc.fillColor('#f1f5f9');
        doc.rect(startX, y, 535, rowHeight).fill();
        doc.fillColor('black');

        let currentX = startX;
        headers.forEach((h, i) => {
            doc.text(h, currentX + 2, y + 6, { width: colWidths[i], align: 'left' });
            currentX += colWidths[i];
        });

        y += rowHeight;

        // Draw Rows
        doc.font('Helvetica').fontSize(9);
        let sno = 1;

        entries.forEach(entry => {
            if (y > 750) {
                doc.addPage();
                y = 50;
            }

            let branch = '-';
            if (exam.batches && Array.isArray(exam.batches)) {
                const regNum = parseInt(entry.student_reg.replace(/\D/g, '')) || 0;
                const batch = exam.batches.find(b => {
                    const s = parseInt(b.start_reg.replace(/\D/g, ''));
                    const e = parseInt(b.end_reg.replace(/\D/g, ''));
                    return regNum >= s && regNum <= e;
                });
                if (batch) branch = batch.branch;
            }

            const rowData = [
                (sno++).toString(),
                entry.student_reg,
                branch,
                entry.severity,
                entry.reason,
                entry.action_taken || '-',
                new Date(entry.createdAt).toLocaleDateString()
            ];

            // Determine Row Height (Dynamic based on text wrap)
            // Ideally we calculate max height needed, but for now fixed/flexible
            // Simple approach: Use single line,truncate if too long, OR multi-line support
            // For simplicity (MVP): Allow reason to wrap

            const reasonHeight = doc.heightOfString(entry.reason, { width: colWidths[4] });
            const finalRowHeight = Math.max(rowHeight, reasonHeight + 10);

            // Draw Background for alternate rows (optional)
            if (sno % 2 !== 0) {
                doc.fillColor('#f8fafc').rect(startX, y, 535, finalRowHeight).fill();
                doc.fillColor('black');
            }

            // Border
            doc.rect(startX, y, 535, finalRowHeight).strokeColor('#e2e8f0').stroke();
            doc.strokeColor('black'); // Reset

            currentX = startX;
            rowData.forEach((text, i) => {
                // Color Severity
                if (i === 3) {
                    if (text === 'Critical') doc.fillColor('red');
                    else if (text === 'High') doc.fillColor('orange');
                }

                doc.text(text, currentX + 2, y + 6, {
                    width: colWidths[i] - 4,
                    align: 'left'
                });
                doc.fillColor('black'); // Reset
                currentX += colWidths[i];
            });

            y += finalRowHeight;
        });

        if (entries.length === 0) {
            doc.moveDown();
            doc.font('Helvetica-Oblique').text('No malpractice incidents recorded for this exam.', { align: 'center' });
        }

        doc.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


app.get('/api/malpractice/download', authenticateToken, checkPermission('malpractice_entry'), async (req, res) => {
    try {
        const { exam_id, ids } = req.query;
        console.log(`[Main Registry Excel] ExamID: ${exam_id}, IDs: ${ids}`);

        let whereClause = {};
        if (ids) {
            const idList = ids.split(',').map(Number);
            whereClause.id = { [Op.in]: idList };
        } else if (exam_id) {
            whereClause.exam_id = exam_id;
        }

        const entries = await Malpractice.findAll({
            where: whereClause,
            include: [Exam],
            order: [['createdAt', 'DESC']]
        });

        // Use exceljs to create workbook

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Malpractice Registry');

        // Styles
        const headerStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } } };
        const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

        // Define Columns
        worksheet.columns = [
            { header: 'Student Reg No', key: 'reg', width: 20 },
            { header: 'Exam Name', key: 'exam', width: 30 },
            { header: 'Exam Date', key: 'date', width: 20 },
            { header: 'Severity', key: 'severity', width: 15 },
            { header: 'Incident Details', key: 'reason', width: 50 },
            { header: 'Action Taken', key: 'action', width: 30 },
            { header: 'Reported Date', key: 'created', width: 20 }
        ];

        // Apply Header Styles
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = headerStyle.font;
            cell.fill = headerStyle.fill;
            cell.border = borderStyle;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Add Rows
        entries.forEach(entry => {
            const row = worksheet.addRow({
                reg: entry.student_reg,
                exam: entry.Exam?.name || 'Unknown',
                date: entry.Exam?.date ? new Date(entry.Exam.date).toLocaleDateString() : '-',
                severity: entry.severity,
                reason: entry.reason || '-',
                action: entry.action_taken || 'Pending',
                created: new Date(entry.createdAt).toLocaleDateString()
            });

            // Color Code Severity
            const severityCell = row.getCell('severity');
            if (entry.severity === 'Critical') severityCell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Red
            if (entry.severity === 'High') severityCell.font = { color: { argb: 'FFF97316' }, bold: true }; // Orange
            if (entry.severity === 'Medium') severityCell.font = { color: { argb: 'FFF59E0B' }, bold: true }; // Amber

            // Borders
            row.eachCell((cell) => {
                cell.border = borderStyle;
                cell.alignment = { vertical: 'top', wrapText: true };
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Malpractice_Sheet_${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Download Error:', err);
        res.status(500).json({ error: 'Failed to generate sheet' });
    }
});

// PDF Download for Main Registry
app.get('/api/malpractice/pdf', authenticateToken, checkPermission('malpractice_entry'), async (req, res) => {
    try {
        const { exam_id, ids } = req.query;
        console.log(`[Main Registry PDF] ExamID: ${exam_id}, IDs: ${ids}`);

        let whereClause = {};
        if (ids) {
            const idList = ids.split(',').map(Number);
            whereClause.id = { [Op.in]: idList };
        } else if (exam_id) {
            whereClause.exam_id = exam_id;
        }

        const entries = await Malpractice.findAll({
            where: whereClause,
            include: [Exam],
            order: [['createdAt', 'DESC']]
        });

        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        const safeFilename = `Malpractice_Registry_${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}`);
        doc.pipe(res);

        // Header
        doc.font('Helvetica-Bold').fontSize(18).text('Malpractice Registry Report', { align: 'center' });
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(1.5);

        // Table Constants
        const startX = 30;
        const colWidths = [30, 90, 130, 80, 200, 140, 70];
        const headers = ['#', 'Reg No', 'Exam Name', 'Severity', 'Incident Details', 'Action Taken', 'Date'];

        let y = doc.y;
        const rowHeight = 25;

        // Draw Header
        doc.font('Helvetica-Bold').fontSize(10);
        doc.fillColor('#1f2937'); // dark gray
        doc.rect(startX, y, 780, rowHeight).fill();
        doc.fillColor('white');

        let currentX = startX;
        headers.forEach((h, i) => {
            doc.text(h, currentX + 5, y + 8, { width: colWidths[i] });
            currentX += colWidths[i];
        });

        y += rowHeight;

        // Draw Rows
        doc.font('Helvetica').fontSize(9).fillColor('black');
        let sno = 1;

        for (const entry of entries) {
            const reasonText = entry.reason || '-';
            const actionText = entry.action_taken || '-';
            const examName = entry.Exam?.name || 'Unknown';

            const reasonHeight = doc.heightOfString(reasonText, { width: colWidths[4] - 10 });
            const actionHeight = doc.heightOfString(actionText, { width: colWidths[5] - 10 });
            const examHeight = doc.heightOfString(examName, { width: colWidths[2] - 10 });
            const finalRowHeight = Math.max(30, reasonHeight + 10, actionHeight + 10, examHeight + 10);

            if (y + finalRowHeight > 550) {
                doc.addPage({ layout: 'landscape' });
                y = 50;
                // Redraw header on new page
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#1f2937').rect(startX, y, 780, rowHeight).fill();
                doc.fillColor('white');
                let tempX = startX;
                headers.forEach((h, i) => {
                    doc.text(h, tempX + 5, y + 8, { width: colWidths[i] });
                    tempX += colWidths[i];
                });
                y += rowHeight;
                doc.font('Helvetica').fontSize(9).fillColor('black');
            }

            // Alternating row bg
            if (sno % 2 === 0) {
                doc.fillColor('#f9fafb').rect(startX, y, 780, finalRowHeight).fill();
                doc.fillColor('black');
            }

            // Border
            doc.rect(startX, y, 780, finalRowHeight).strokeColor('#e5e7eb').stroke();
            doc.strokeColor('black');

            let rowX = startX;
            // SNo
            doc.text((sno++).toString(), rowX + 5, y + 8);
            rowX += colWidths[0];
            // Reg
            doc.text(entry.student_reg, rowX + 5, y + 8);
            rowX += colWidths[1];
            // Exam Name
            doc.text(examName, rowX + 5, y + 8, { width: colWidths[2] - 10 });
            rowX += colWidths[2];
            // Severity
            if (entry.severity === 'Critical') doc.fillColor('red');
            else if (entry.severity === 'High') doc.fillColor('orange');
            doc.font('Helvetica-Bold').text(entry.severity, rowX + 5, y + 8);
            doc.fillColor('black').font('Helvetica');
            rowX += colWidths[3];
            // Reason
            doc.text(reasonText, rowX + 5, y + 8, { width: colWidths[4] - 10 });
            rowX += colWidths[4];
            // Action
            doc.text(actionText, rowX + 5, y + 8, { width: colWidths[5] - 10 });
            rowX += colWidths[5];
            // Date
            doc.text(new Date(entry.createdAt).toLocaleDateString(), rowX + 5, y + 8);

            y += finalRowHeight;
        }

        if (entries.length === 0) {
            doc.moveDown();
            doc.font('Helvetica-Oblique').text('No records found.', { align: 'center' });
        }

        doc.end();

    } catch (err) {
        console.error('PDF Registry Error:', err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test URL: http://127.0.0.1:${PORT}/`);
});
