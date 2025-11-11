
export const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            error.cause = error.cause || 500;
            return next(error);
        }
    };
};

export const globalErrorHandling = (error, req, res, next) => {

    return res.status(error.cause || 400).json({
        message: error.message,
        error,
        stack: process.env.MOOD === "DEV" ?
            error.stack : undefined
    })
}
export const successResponse = ({ res, status = 200, data = {}, message = "Done" } = {}) => {
    return res.status(status).json({ message, data })
}
