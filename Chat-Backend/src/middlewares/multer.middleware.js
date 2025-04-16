import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, cb, file) {
    file(null, cb.originalname);
  },
});

export const upload = multer({
  storage,
});
