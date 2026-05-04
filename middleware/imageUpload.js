const multer = require("multer");

const ALLOWED_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/svg+xml",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	if (ALLOWED_TYPES.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error("Tipo de archivo no permitido. Solo JPG, PNG, WebP y SVG."),
			false,
		);
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: MAX_SIZE },
});

exports.imageUploadMiddleware = upload.single("file");
