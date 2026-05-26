const multer = require("multer");

const ALLOWED_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/svg+xml",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
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

exports.imageUploadMiddleware = (req, res, next) => {
	upload.single("file")(req, res, (err) => {
		if (err) {
			if (err.code === "LIMIT_FILE_SIZE") {
				return res
					.status(400)
					.json({ error: "El archivo excede el tamaño máximo de 5MB." });
			}
			return res.status(400).json({ error: err.message });
		}
		next();
	});
};
