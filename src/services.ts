import axios from "axios";
import { ApplicationPayload, ContactPayload } from "./types";
import { ATS_APPLICATION_URL, ATS_CONTRACT_URL } from "./urls";
import { v4 as uuidv4 } from 'uuid';

export const createATSContact = async (contactData: ContactPayload) => {
    if (process.env.NODE_ENV === 'production') {
        return await axios.post(ATS_CONTRACT_URL, contactData, {
            headers: {
                'Authorization': `Bearer ${process.env.ATS_API_KEY}`
            }
        });
    } else {
        return {
            data: {
                id: uuidv4()
            }
        }
    }
}

export const createATSApplication = async(applicationData: ApplicationPayload) => {
    if (process.env.NODE_ENV === 'production') {
        return  await axios.post(ATS_APPLICATION_URL, applicationData, {
            headers: {
                'Authorization': `Bearer ${process.env.ATS_API_KEY}`
            }
        });
    } else {
        return {
            data: {
                ...applicationData
            }
        }
    }
}