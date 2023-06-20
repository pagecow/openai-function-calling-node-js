// Import necessary packages and modules
require('dotenv').config(); // Load environment variables from a .env file
const { Configuration, OpenAIApi } = require("openai"); // Import classes from the OpenAI API module
const axios = require("axios"); // Import the axios library for making HTTP requests
const moment = require("moment-timezone"); // Import the moment-timezone library for time formatting

//Create a new OpenAI API configuration object with an API key loaded from the environment variables
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, 
});

const openai = new OpenAIApi(configuration); // Create an instance of the OpenAI API with the configuration object

/* Define an asynchronous function that takes a location string as a parameter, 
   retrieves the current time at that location using the World Time API, 
   then formats and logs the time to the console */
async function lookupTime(location, name) {
    try {
        const response = await axios.get(`http://worldtimeapi.org/api/timezone/${location}`); 
        // Make a GET request to the World Time API with the 'location' value as the timezone.
        const { datetime } = response.data; // Destructure 'datetime' from the response to extract it.
        const dateTime = moment.tz(datetime, location).format("h:mmA");
        // Create a new date object using the specified timezone and format it in 12-hour time with AM/PM label.
        console.log(`The current time in ${name} is ${dateTime}.`);
        // Log the formatted time to the console.
    } catch (error) {
        console.error(error); //Log any errors that occur to the console.
    }
}

/* Define an async function called 'main' 
   which uses the OpenAI API to generate a chatbot-like response to a given input message
   and includes the ability to call the 'lookupTime' function */
async function main() {
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-0613", // Choose the GPT model to use for generating responses
        messages: [
            {role: "system", content: "You are a helpful assistant."}, // Specify the role and content of the messages 
            {role: "user", content: "What time is it in London, England?"} // sent to the GPT model for generating the response.
        ],
        functions: [
            { // Define the 'lookupTime' function
                name: "lookupTime",
                description: "get the current time in a given location",
                parameters: { // Define the input parameters for the function
                    type: "object", // The parameter is an object
                    properties: { 
                        location: { // The 'location' property of the object is a required string
                            type: "string", // The 'location' property is a string value
                            description: "The location, e.g. Beijing, China. But it should be written in a timezone name like Asia/Shanghai"
                        },
                        name: {
                            type: "string",
                            description: "The location mentioned in the prompt. Example: Beijing, China."
                        }
                    },
                    required: ["location", "name"] // The 'location' property is required
                }
            }
        ],
        function_call: "auto" // Specify that the API should automatically detect and execute function calls within the response 
    })
    console.log("completion.data: ", completion.data)

    const completionResponse = completion.data.choices[0].message; // Extract the generated completion from the OpenAI API response
    
    console.log("completionResponse: ", completionResponse); // Output the generated response to the console

    if(!completionResponse.content) { // Check if the generated response includes a function call
        const functionCallName = completionResponse.function_call.name; 
        console.log("functionCallName: ", functionCallName);

        if(functionCallName === "lookupTime") { // If the function being called is 'lookupTime'
            const completionArguments = JSON.parse(completionResponse.function_call.arguments); // Extract the argument for the function call
            console.log("completionArguments: ", completionArguments);

            lookupTime(completionArguments.location, completionArguments.name) // Call the 'lookupTime' function with the specified location argument. 
        }
    }

    return completionResponse.content
}

main();
// Call the 'main' function to run the program and generate the chatbot response.