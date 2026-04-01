import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createContactService, getContactService, getActivity, getStats, updateContact, deleteContact } from '../services/contact.service.js';

const createContact = asyncHandler(async (req, res) => {
    const data = await createContactService(req.body, req.user.id);

    return res.status(200).json(
        new ApiResponse(200, { data }, 'Contact created successfully')
    );
})

const getContacts = asyncHandler(async (req, res) => {
    const data = await getContactService(req.user.id)

    return res.status(200).json(
        new ApiResponse(200, { data }, 'Contact Details')
    )
})

const getActivities = asyncHandler(async (req, res) => {
    const data = await getActivity(req.user.id)

    return res.status(200).json(
        new ApiResponse(200, { data }, 'Contact Details')
    )
})

const getStatsController = asyncHandler(async (req, res) => {
    const data = await getStats(req.user.id)

    return res
        .status(200)
        .json(
            new ApiResponse(200, { data }, 'Contact Stats')
        )
})

const updateContactController = asyncHandler(async (req, res) => {
    const data = await updateContact(req.body)

    return res
        .status(200)
        .json(
            new ApiResponse(200, { data }, 'Contact Updated')
        )
})

const deleteContactController = asyncHandler(async (req,res) => {
    const data = await deleteContact(req.body)

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},'Contact Deleted')
    )
})

export {
    createContact,
    getContacts,
    getActivities,
    getStatsController,
    updateContactController,
    deleteContactController
}