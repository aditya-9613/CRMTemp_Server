import { Router } from "express";
import { createContact, deleteContactController, getActivities, getContacts, getStatsController, updateContactController } from "../controllers/contact.controllers.js";
import { validate } from "../middlewares/validate.middlewares.js";
import { createContactSchema } from "../validators/contact.validators.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";


const router = Router()

router.route('/createContact').post(verifyJWT, validate(createContactSchema), createContact)
router.route('/getContact').get(verifyJWT, getContacts)
router.route('/getActivity').get(verifyJWT, getActivities)
router.route('/getStats').get(verifyJWT, getStatsController)
router.route('/updateContact').put(verifyJWT, updateContactController)
router.route('/deleteContact').put(verifyJWT, deleteContactController)


export default router