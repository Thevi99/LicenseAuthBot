const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimitMiddleware = require('./middleware/rateLimit'); // ✅ ใส่ middleware

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true); // ✅ สำหรับอ่าน IP ที่แท้จริงจาก header

mongoose.connect(process.env.MONGODB_URI, {})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('Failed to connect to MongoDB', err));

// ✅ Middleware พื้นฐาน
app.use(rateLimitMiddleware); // ✅ เปิดใช้ Rate Limiting
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


// ✅ Routes
const userRoutes = require('./routes/userRoutes');
const licenseRoutes = require('./routes/licenseRoutes');

app.use('/license', licenseRoutes);
app.use('/users', userRoutes);

// ✅ 404 fallback
app.use((req, res, next) => {
    res.status(404).send('Page not found');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
