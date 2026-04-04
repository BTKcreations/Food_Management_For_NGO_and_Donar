const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Local Disk Storage for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB for local storage
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
  }
});

// Middleware wrapper to normalize paths for DB storage
const normalizePaths = (req) => {
  const normalizePath = (p) => {
    if (!p) return p;
    // Ensure it starts with /uploads/ and uses forward slashes
    let normalized = p.replace(/\\/g, '/');
    if (!normalized.startsWith('/')) normalized = '/' + normalized;
    return normalized;
  };

  if (req.file) {
    req.file.path = normalizePath(req.file.path);
  }
  if (req.files) {
    if (Array.isArray(req.files)) {
      req.files.forEach(f => f.path = normalizePath(f.path));
    } else {
      Object.keys(req.files).forEach(key => {
        req.files[key].forEach(f => f.path = normalizePath(f.path));
      });
    }
  }
};

const uploadMiddleware = {
  single: (fieldName) => (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) return next(err);
      normalizePaths(req);
      next();
    });
  },
  array: (fieldName, maxCount) => (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) return next(err);
      normalizePaths(req);
      next();
    });
  },
  fields: (fields) => (req, res, next) => {
    upload.fields(fields)(req, res, (err) => {
      if (err) return next(err);
      normalizePaths(req);
      next();
    });
  },
  any: () => (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) return next(err);
      normalizePaths(req);
      next();
    });
  }
};

module.exports = uploadMiddleware;
