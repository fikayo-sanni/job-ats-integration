## Plan of Approach

### 1. Requirements Description

1. **Receive Payload**: The backend should be able to receive a payload from the job board.
2. **Transform Payload**: The backend should transform the incoming payload into the required data format of its 
3. **Send Data to ATS**: Use two REST APIs to send the data to the ATS:
   - Create a contact and get an ID.
   - Create an application using the contact ID.
4. **Clarify Authentication Techniques**: The above requests to ATS should use the preferred authentication techniques specifications defined in the ATS documentation. In this implementation, we are assuming that non expiring Bearer Tokens are going to be used, however further clarification will required. 

### 2. Breakdown of Tasks

In this breakdown of tasks, we are assuming that a fresh codebase is being used as a standalone service. Otherwise tasks 1 & 3 should be skipped.
1. **Setup Node.js Project**:
   - Initialize a new Node.js project.
   - Install necessary dependencies (e.g., Express.js for the server, Axios for HTTP requests, dotenv for environment variables).

2. **Define Models**:
   - Create models for the input data and the transformed data (Contact and Application).

3. **Create Express Server**:
   - Setup Express server to handle incoming POST requests.
   - Implement middleware for authentication using API keys.

4. **Transform Data**:
   - Implement logic to transform the input payload to the Contact model.
   - Extract first name and last name from the full name.
   - Convert phone number to international format (assume a default country code if not provided).
   - Encode CV as Base64.

5. **Interact with ATS APIs**:
   - Implement function to create a contact in the ATS and get the contact ID.
   - Implement function to create an application in the ATS using the contact ID.

6. **Handle Responses and Errors**:
   - Send appropriate success/failure responses back to the job board.
   - Log errors for debugging.

7. **Testing**:
   - Use Postman or a similar tool to simulate incoming data and test the endpoints.
   - Verify that data is correctly transformed and sent to the ATS.

### 3. Refinement Questions

1. **API Details**: What are the exact endpoints and authentication details for the ATS APIs?
2. **Test Environements**: Is there a test environment we can use for testing the integration, pending when we roll it out in production? If yes, please share access details to the environments we need
2. **International Phone Format**: What country code should we assume for phone numbers, if we're considering multiple countries, how do we determine the country code from current payload?
3. **Error Handling**: What should be the response format in case of an error?
4. **Additional Fields**: Are there any additional fields in the payload that need to be handled?
5. **ATS Field Requirements**: Are there any specific validation rules for the ATS fields?

## Conceptual Code

### 1. Setup Node.js Project

Initialize a new Node.js project:

```bash
mkdir jobboard-ats-integration
cd jobboard-ats-integration
npm init -y
npm install express axios body-parser dotenv
mkdir src
cd src
```

### 2. Create Types

Create a file that defines all the types expected as typescript interfaces

```typescript
// src/transformers.ts
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
```

### 3. Create Transformers

Create Data Transformers that collect the input data Define the models for the input data and transformed data:

```typescript
// src/transformers.ts
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
```

### 4. Create URLs file

Create a file to hold all the URLs to be used in the service, this is done to have a single source of truth/point of change in case of future refactoring

```typescript
// src/urls.ts
export const ATS_CONTRACT_URL=`${process.env.ATS_BASE_URL}/createContact`
export const ATS_APPLICATION_URL=`${process.env.ATS_BASE_URL}/createApplication`

```

### 5. Create Services File

The services file contains functions that handle all outbound requests from the project. It also allows us to mock the behaviour of the ATS service in test environments to make sure that everything our code works smoothly

### 5. Create Express Server

Create an Express server to handle incoming POST requests:

```typescript
// src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import { JobBoardPayload } from './types';
import { transformInputToContact, createApplicationPayload } from './transformers';
import dotenv from 'dotenv';
import { createATSApplication, createATSContact } from './requests';

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
       await createATSApplication(applicationData);

        res.status(200).json({ message: 'Application submitted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to submit application', error: String(error) });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

### 6. Environment Variables

Create a `.env` file to store your API keys and other sensitive information:

```
//.env
NODE_ENV=development
ATS_BASE_URL=https://ats.example.com/api
JOBBOARD_API_KEY=your_jobboard_api_key
ATS_API_KEY=your_ats_api_key
```

### 7. Testing

Run
```bash
npm run start
```

Use Postman to simulate incoming data and test the endpoints:

- **Base URL** `http://localhost:3000`
- **Endpoint**: `POST /apply`
- **Headers**:
  - `Authorization`: `Bearer your_jobboard_api_key`
- **Request Body**:
  ```json
  {
      "jobid": "108203183",
      "name": "Anouk Wendeltje",
      "email": "anoukjewendeltje@hotmail.nl",
      "phone": "0612233454",
      "city": "Amersfoort",
      "motivation": "MOTIVATION TEXT",
      "cv": "BINARY STRING COMES HERE"
  }
  ```

### 8. Refinement and Error Handling

Refine the code based on the answers to the refinement questions and additional testing.