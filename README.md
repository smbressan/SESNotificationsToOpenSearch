# SESNotificationsToOpenSearch
# Lambda Function for Sending SES Notifications to OpenSearch via SNS

This Lambda function is designed to receive email notifications from Amazon SES via SNS and forward them to an OpenSearch cluster for indexing. The function signs requests with AWS credentials to securely send data to OpenSearch.

## Prerequisites

1. AWS account with access to Lambda, SNS, SES, and OpenSearch.
2. Node.js 20.x installed on your local machine.

## Authentication

This Lambda function uses AWS IAM roles for authentication to OpenSearch, SNS, and other AWS services. We do **not** use hardcoded usernames or passwords. The AWS Lambda execution role must have the necessary permissions (e.g., `es:ESHttpPut`, `sns:Publish`) to interact with OpenSearch and SNS. The request signing is handled automatically using the `aws4` library to securely sign requests with AWS credentials.

## Setup and Installation

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

### 2. Install Dependencies
Install the necessary packages:
```
npm install
```
### 3. Package the Lambda Function
```
zip -r lambda-function.zip .
```
### 4. Deploy the Lambda Function via AWS Console
* Create function
* Upload the zip generated in 3
* Configure the environment variables:
```
BASE_URL: Your OpenSearch domain URL (without https://).
PREFIX: The index prefix for storing the data in OpenSearch.
```
* Set Permissions for Lambda
### 5. Create an SNS Topic and Subscribe Lambda
### 6. Configure SES to Notify via SNS

## Code Overview
#### index.js
This function performs the following actions:

1. Receives SNS-triggered events from SES.
2. Parses the email message.
3. Generates a dynamic OpenSearch index name based on the current date.
4. Signs AWS requests using aws4 and sends the email data to OpenSearch.
5. Handles success and error scenarios.

#### package.json
The function depends on the following packages:
```
{
  "dependencies": {
    "@elastic/elasticsearch": "^8.15.0",
    "@opensearch-project/opensearch": "^2.12.0",
    "aws-sdk": "^2.1691.0",
    "aws4": "^1.13.2"
  }
}
```
