const multer = require("multer");
const path = require("path");

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});

// File filter for images + text/json/csv
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|csv|txt|json/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  // Handle mimetypes properly
  const mimetype =
    file.mimetype.startsWith("image/") ||
    file.mimetype === "text/plain" ||
    file.mimetype === "application/json" ||
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel";

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only images or files are allowed in (jpeg, jpg, png, gif, csv, txt, json)"));
  }
};

// Max file size: 2MB
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;
