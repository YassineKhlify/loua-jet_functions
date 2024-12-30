// functions/queue-update.js

const admin = require('firebase-admin');

const firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(firebaseCredentials),
});

exports.notifyDriverOnTurnChange = functions.firestore
  .document('queues/{stationId}/{destinationId}/{driverId}')
  .onUpdate(async (change, context) => {
    // Get the data from before and after the change
    const before = change.before.data();
    const after = change.after.data();

    // Check if the `turn` field was updated
    if (after.turn !== before.turn) {
      const driverId = context.params.driverId;
      const fcmToken = after.fcmToken; // Make sure you save this token in Firestore
      
      const message = {
        notification: {
          title: 'Queue Update',
          body: `Your turn in the queue has been updated to: ${after.turn}`,
        },
        token: fcmToken, // The driver's FCM token
      };

      try {
        // Send the notification via FCM
        await admin.messaging().send(message);
        console.log(`Notification sent to driver ${driverId}`);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }

    return null;
  });