const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Carpeta destino donde se guardarán las imágenes
const uploadDir = path.join(__dirname, "../mi-carpeta-imagenes");

// Configuración de multer para guardar imágenes
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});

const upload = multer({ storage });

// Middleware para subir una única imagen
exports.imageUploadMiddleware = upload.single("file");
