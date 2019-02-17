# Dialogflow Fulfillment Webhook Template for Node.js and Cloud Functions for Firebase

This webhook template sets up everything needed to build fulfillment for your Dialogflow agent.

## Setup Instructions: Firebase CLI

1. `clone project`
2. `cd` to the `functions` directory
3. `npm install`
4. Install the Firebase CLI by running `npm install -g firebase-tools`
5. Login with your Google account, run `firebase login`
6. Add your project to the sample with `firebase use in-n-out-chatbot`
7. Run `firebase deploy --only functions:dialogflowFirebaseFulfillment`
8. Back in Dialogflow Console > **Fulfillment** > **Enable** Webhook.

**Make sure to test all functionalities are working as expected BEFORE push**

## Samples 
| Name                                 | Language                         |
| ------------------------------------ |:---------------------------------|
| [Fulfillment Webhook JSON](https://github.com/dialogflow/fulfillment-webhook-json)| JSON |
| [Dialogflow Console Template](https://github.com/dialogflow/fulfillment-webhook-nodejs)| Node.js
| [Bike Shop-Google Calendar API](https://github.com/dialogflow/fulfillment-bike-shop-nodejs)| Node.js|
| [WWO Weather API](https://github.com/dialogflow/fulfillment-weather-nodejs)| Node.js |
| [Alexa Importer](https://github.com/dialogflow/fulfillment-importer-nodejs) | Node.js |
| [Temperature Trivia](https://github.com/dialogflow/fulfillment-temperature-converter-nodejs) | Node.js |
| [Human-Agent](https://github.com/dialogflow/agent-human-handoff-nodejs) | Node.js |
| [Google Translation API](https://github.com/dialogflow/fulfillment-translate-python) | Python |
| [WWO Weather API](https://github.com/dialogflow/fulfillment-weather-python) | Python |


## References & Issues
* Fullfillment webhook for Node.js [Github](https://github.com/dialogflow/fulfillment-webhook-nodejs).
* Dialogflow fullfillment library [Github](https://github.com/dialogflow/dialogflow-fulfillment-nodejs).
* Questions? Try [StackOverflow](https://stackoverflow.com/questions/tagged/dialogflow).
* Find a bug? Report it on [GitHub](https://github.com/dialogflow/fulfillment-webhook-json/issues).
* Dialogflow [Documentation](https://dialogflow.com/docs/getting-started/basics).
* For more information on [Initializing Firebase SDK for Cloud Functions](https://firebase.google.com/docs/functions/get-started#set_up_and_initialize_functions_sdk).

## License
See [LICENSE](LICENSE).

## Terms
Your use of this sample is subject to, and by using or downloading the sample files you agree to comply with, the [Google APIs Terms of Service](https://developers.google.com/terms/).
