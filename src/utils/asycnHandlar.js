const asyncHandlar = (requentHandlar) => {
    return (req, res, next) => {
        Promise.resolve(requentHandlar(req,res,next)).catch((err) => next(err))
    }
}
export {asyncHandlar}



