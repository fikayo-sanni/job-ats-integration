import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import { JobBoardPayload } from './types';
import { transformInputToContact, createApplicationPayload } from './transformers';
import dotenv from 'dotenv';
import { ATS_APPLICATION_URL, ATS_CONTRACT_URL } from './urls';

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
        const contactResponse = await axios.post(ATS_CONTRACT_URL, contactData, {
            headers: {
                'Authorization': `Bearer ${process.env.ATS_API_KEY}`
            }
        });
        const contactId = contactResponse.data.id;

        // Create Application in ATS
        const applicationData = createApplicationPayload(inputData.jobid, contactId);
        await axios.post(ATS_APPLICATION_URL, applicationData, {
            headers: {
                'Authorization': `Bearer ${process.env.ATS_API_KEY}`
            }
        });

        res.status(200).json({ message: 'Application submitted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to submit application', error: String(error) });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
