const {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

let s3Client = null;

function getS3Client() {
	if (!s3Client) {
		s3Client = new S3Client({
			region: "auto",
			endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: process.env.R2_ACCESS_KEY_ID,
				secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
			},
		});
	}
	return s3Client;
}

async function uploadToR2(fileBuffer, key, contentType) {
	const command = new PutObjectCommand({
		Bucket: process.env.R2_BUCKET_NAME,
		Key: key,
		Body: fileBuffer,
		ContentType: contentType,
	});
	await getS3Client().send(command);
	return { url: `${process.env.R2_PUBLIC_URL}/${key}` };
}

async function deleteFromR2(key) {
	const command = new DeleteObjectCommand({
		Bucket: process.env.R2_BUCKET_NAME,
		Key: key,
	});
	await getS3Client().send(command);
}

function generateKey(nombre, mimetype) {
	const uuid = crypto.randomUUID().split("-")[0];
	const ext =
		mimetype === "image/jpeg"
			? ".jpg"
			: mimetype === "image/png"
				? ".png"
				: mimetype === "image/webp"
					? ".webp"
					: ".svg";
	const slug = nombre
		? nombre
				.toLowerCase()
				.replace(/[^a-z0-9]/g, "-")
				.substring(0, 50)
		: "imagen";
	return `${uuid}-${slug}${ext}`;
}

module.exports = { uploadToR2, deleteFromR2, generateKey };
