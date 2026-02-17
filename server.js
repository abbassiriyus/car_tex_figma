require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const homeCarouselRoutes = require('./routes/homeCarousel');
const usersRoutes=require('./routes/user.routes')
const carsRoutes=require('./routes/car.routes')
const cars2Routes=require('./routes/car_2.router')

const FeatureRoutes=require('./routes/feature.routes')
const RiskRoutes=require('./routes/legalRisks.routes')
const OtchotsRoutes=require('./routes/otchot')
const app = express();

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'mysecret123',
  resave: false,
  saveUninitialized: true
}));

// Static folder
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'public')));

// API routelar
app.use('/api/home-carousel', homeCarouselRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/cars', cars2Routes);

app.use('/api/features', FeatureRoutes);
app.use('/api/legal-risks', RiskRoutes);
app.use('/api/otchots', OtchotsRoutes);
app.use('/api', require('./routes/reportRoutes.js'));


// --- LOGIN ---
// Hardcoded login (keyin DB bilan almashtirish mumkin)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Login submit
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // ✅ Login muvaffaqiyatli → layout.htmlga yuborish
    req.session.user = { username };
    return res.sendFile(path.join(__dirname, 'public/layout.html'));
  } else {
    // ❌ Login xato → index.htmlga qaytarish
    return res.sendFile(path.join(__dirname, 'public/index.html'));
  }
});
// Logout
app.post('/layout', (req, res) => {
return res.sendFile(path.join(__dirname, 'public/layout.html'));
});

// Middleware: login tekshirish
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

// "/" ga GET qilinsa index.html ni yuboramiz (login kerak)
app.get('/', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// --- DB va server ishga tushurish ---
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT} portda ishlayapti`));
