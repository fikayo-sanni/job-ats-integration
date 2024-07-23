import { ApplicationPayload, ContactPayload, JobBoardPayload } from "./types";

export const transformInputToContact = (input: JobBoardPayload): ContactPayload => {
    const [firstName, ...lastNameParts] = input.name.split(' ');
    const lastName = lastNameParts.join(' ');
    const phone = `+31${input.phone.slice(1)}`; // Assuming Dutch numbers
    const cvBase64 = Buffer.from(input.cv, 'binary').toString('base64');

    return {
        firstName,
        lastName,
        email: input.email,
        phone,
        city: input.city,
        motivation: input.motivation,
        cv: cvBase64
    };
};

export const createApplicationPayload = (jobId: string, contactId: string): ApplicationPayload => {
    return {
        jobId,
        timestamp: Date.now() * 1000, // Microseconds
        contactId
    };
};