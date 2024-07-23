export interface JobBoardPayload {
    jobid: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    motivation: string;
    cv: string;
}

export interface ContactPayload {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    motivation: string;
    cv: string;
}

export interface ApplicationPayload {
    jobId: string;
    timestamp: number;
    contactId: string;
}