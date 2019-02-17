# Robo-waiter

Robo-waiter is the capstone project of UCI Master of Computer Science Class of 2018 Group 7. It is a chatbot for ordering food at a restaurant. Please open "Demo Video.mp4" to see how it works. The system was built using Dialogflow, Node.js, Python, Django, and MySQL. Please refer to "Final Report.pdf" for the executive summary, the system requirements document, and the system design document. Facebook Messenger serves as the user interface. Due to Facebook's strict app release policy, the system remains private. Interested people can open JSON files in "Dialogflow.zip" to see how we set up natural language processing (NLP) features in Dialogflow and open JavaScript files in the functions folder to see how we implemented the back-end functions in the webhook. 

## Setup Instructions: Firebase CLI

1. `clone project`
2. `cd` to the `functions` directory
3. `npm install`
4. Install the Firebase CLI by running `npm install -g firebase-tools`
5. Login with your Google account, run `firebase login`
6. Add your project to the sample with `firebase use in-n-out-chatbot`
7. Run `firebase deploy --only functions:dialogflowFirebaseFulfillment`
8. Back in Dialogflow Console > **Fulfillment** > **Enable** Webhook.
