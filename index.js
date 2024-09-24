const https = require('https');
const aws4 = require('aws4');
const crypto = require('crypto');

// Function to get today's date in the format YYYY.MM.DD
const getCurrentDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero if needed
  const day = String(date.getDate()).padStart(2, '0'); // Add leading zero if needed
  return `${year}.${month}.${day}`;
};

// Function to generate a unique document ID using UUID
const generateDocumentId = () => {
  return crypto.randomUUID(); // Generate unique document ID
};

// Function to get the current timestamp in ISO format (used for @timestamp)
const getCurrentTimestamp = () => {
  return new Date().toISOString(); // Current timestamp in ISO 8601 format
};

const indexDocument = (event) => {
  // Extract data from the event or provide default values for testing
  const snsRecord = event.Records[0].Sns;  // Extract SNS Record
  const { MessageId = generateDocumentId(), Message } = snsRecord;

  // Parse the message if it's a JSON string
  let parsedMessage = {};
  try {
    parsedMessage = JSON.parse(Message);
  } catch (err) {
    console.error("Failed to parse SNS message", err);
  }

  // Get current date dynamically for the index name
  const currentDate = getCurrentDate(); // Use format YYYY.MM.DD
  const indexName = `${process.env.PREFIX}-${currentDate}`; // Use PREFIX from environment variable

  // Add the current timestamp for Kibana to filter based on time
  const documentBody = {
    "@timestamp": getCurrentTimestamp(), // Add @timestamp field
    data: {
      MessageId,
      Message: parsedMessage,  // Store the parsed message here
    },
  };

  const requestOptions = {
    hostname: process.env.BASE_URL, // Use the BASE_URL environment variable
    path: `/${indexName}/_doc/${MessageId}`, // Use MessageId as the document ID
    method: 'PUT',
    service: 'es',
    region: 'eu-west-1',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(documentBody),
  };

  aws4.sign(requestOptions); // Sign the request with AWS credentials

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Response status code:', res.statusCode);
        console.log('Response body:', data);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            statusCode: res.statusCode,
            body: data,
          });
        } else {
          reject(new Error(`Failed to index document. Status code: ${res.statusCode}. Response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error indexing document:', error);
      reject(error);
    });

    req.write(requestOptions.body);
    req.end();
  });
};

exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Index the document based on the event data
    const indexResponse = await indexDocument(event);

    console.log('Document indexed successfully:', indexResponse);
    return {
      statusCode: 200,
      body: indexResponse.body,
    };
  } catch (error) {
    console.error('Failed to index document:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to index document',
        details: error.message,
      }),
    };
  }
};

