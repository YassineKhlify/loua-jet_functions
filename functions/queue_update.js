// functions/queue-update.js

const admin = require('firebase-admin');
const functions = require('@netlify/functions');

const firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(firebaseCredentials),
});

exports.handler = async (event, context) => {
  const { stationId, destinationId, driverId } = event.queryStringParameters;
  
  const db = admin.firestore();
  const driverRef = db.collection('queues').doc(stationId).collection(destinationId).doc(driverId);
  const doc = await driverRef.get();

  if (!doc.exists) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Driver not found in the queue.' }),
    };
  }

  const driverData = doc.data();
  
  // Example of checking a turn field
  if (driverData.turn) {
    const message = {
      notification: {
        title: 'Queue Update',
        body: `Your turn has been updated to: ${driverData.turn}`,
      },
      token: driverData.fcmToken,
    };

    try {
      await admin.messaging().send(message);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Notification sent.' }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error sending notification.' }),
      };
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ message: 'No valid turn data available.' }),
  };
};
