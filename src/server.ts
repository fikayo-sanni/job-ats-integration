import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import { JobBoardPayload } from './types';
import { transformInputToContact, createApplicationPayload } from './transformers';
import dotenv from 'dotenv';
import { createATSApplication, createATSContact } from './services';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Middleware for authentication
const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];
    if (!token || token !== `Bearer ${process.env.JOBBOARD_API_KEY}`) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

app.post('/apply', authenticate, async (req: Request, res: Response) => {
    try {
        const inputData: JobBoardPayload = req.body;

        // convert jobboardpayload into contact data;
        const contactData = transformInputToContact(inputData);

        // Create Contact in ATS
        const contactResponse = await createATSContact(contactData)
        const contactId = contactResponse.data.id;

        // Create Application in ATS
        const applicationData = createApplicationPayload(inputData.jobid, contactId);
        const { data } = await createATSApplication(applicationData);

        res.status(200).json({ message: 'Application submitted successfully', data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to submit application', error: String(error) });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
