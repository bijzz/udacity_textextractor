# Capstone - Text extractor

## Introduction

This application allows to upload documents (pdf) and extract its content as raw text. It features:

- User management
- Persistance of documents and their extracted content

## ## Demonstration





## Setup

As a prerequiste one needs to deploy the [image-magick-lambda-layer](https://serverlessrepo.aws.amazon.com/applications/arn:aws:serverlessrepo:us-east-1:145266761615:applications~image-magick-lambda-layer) .

![](C:\Users\kern\AppData\Roaming\marktext\images\2020-08-23-21-34-44-image.png)

The layer can afterwards be used by serverless by selecting the deployed arn within `serverless.yaml`.

![](C:\Users\kern\AppData\Roaming\marktext\images\2020-08-23-21-35-04-image.png)

### Backend

To deploy the application run the following commands:

```
cd backend
npm install
sls deploy -v
```

### Frontend

To run a client application first edit the `client/src/config.ts` file to set correct parameters. And then run the following commands:

```
cd client
npm install
npm start 
```

Frontened locally at: [http://localhost:3000/](http://localhost:3000/)
