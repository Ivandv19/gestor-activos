const { z } = require("zod");

const validate = (schema) => (req, res, next) => {
	const result = schema.safeParse(req.body);
	if (!result.success) {
		const flat = z.flattenError(result.error);
		const errores = {};
		if (flat.fieldErrors) {
			for (const [campo, msgs] of Object.entries(flat.fieldErrors)) {
				if (msgs.length > 0) errores[campo] = msgs;
			}
		}
		return res.status(400).json({
			error: result.error.issues[0].message,
			errores,
		});
	}
	req.validated = result.data;
	next();
};

module.exports = validate;
