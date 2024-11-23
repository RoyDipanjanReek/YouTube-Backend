import { apiResponce } from "../utils/apiResponce.js";
import { asyncHandlar } from "../utils/asycnHandlar.js";

const healthcheck = asyncHandlar(async (req, res) => {
    return res
    .status(200)
    .json(new apiResponce(200, "OK", "Health check passed"))
})

export {healthcheck}