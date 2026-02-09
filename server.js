require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
// const homeCarouselRoutes = require('./routes/homeCarousel');


const app = express();

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// app.use('/api/users', require('./routes/user.routes'));
// app.use('/api/home-carousel', homeCarouselRoutes);
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT} portda ishlayapti`));
