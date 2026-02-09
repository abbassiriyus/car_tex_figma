const fs = require('fs');
const path = require('path');

// DELETE IMAGE
exports.deleteImage = (imageUrl) => {
  if (!imageUrl) return;

  const filename = imageUrl.split('/uploads/')[1];
  if (!filename) return;

  const filePath = path.join(__dirname, '../uploads', filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// GET IMAGE URL
exports.getImageUrl = (req, file) => {
  return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
};
