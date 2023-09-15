const axios = require('axios');

// Replace the endpoint URL with the actual endpoint you want to test
const endpointUrl = 'http://localhost:8000/';

// Define the number of requests you want to send
const numRequests = 100;

// Send the requests using Axios library
const requests = [];
for (let i = 1; i <= numRequests; i++) {
  requests.push(axios.get(endpointUrl));
}

// Send all requests simultaneously using Promise.all()
Promise.all(requests)
  .then(responses => {
    responses.forEach((response, i) => {
      console.log(`Request ${i+1} successful: ${response.status}`);
    });
  })
  .catch(error => {
    console.error(`Request failed: ${error.message}`);
  });
