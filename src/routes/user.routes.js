import { Router } from "express";
import { loginController, registerController, userDetailsControllers } from "../controllers/user.controllers.js";
import { validate } from "../middlewares/validate.middlewares.js";
import { loginUserSchema, registerUserSchema } from "../validators/user.validator.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";



const router = Router()

router.route('/userRegister').post(validate(registerUserSchema), registerController)
router.route('/loginUser').post(validate(loginUserSchema), loginController)

//Secured Routes

router.route('/getUserDetails').get(verifyJWT, userDetailsControllers)


export default router