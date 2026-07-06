export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.safeParseAsync(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          status: "fail",
          message: "Validation failed",
          errors: parsed.error.format()
        });
      }
      req.body = parsed.data; // replace with parsed/typed data
      next();
    } catch (err) {
      next(err);
    }
  };
};
