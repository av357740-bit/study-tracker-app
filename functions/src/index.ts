import * as functions from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

admin.initializeApp();

const ONESIGNAL_APP_ID = 'b31efdde-afd1-4c60-9ff6-a23eb4a91fc3';
// API Key को हम Firebase Functions के एनवायरनमेंट वेरिएबल में सुरक्षित रखेंगे
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

export const checkPendingTasks = functions.onSchedule({ schedule: '0 8,13,20 * * *' }, async (event) => {
    const db = admin.firestore();
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // पेंडिंग टास्क चेक करें (उदाहरण के लिए 'tasks' कलेक्शन)
    const tasksSnapshot = await db.collection('tasks')
        .where('status', '==', 'pending')
        .where('dueDate', '==', today)
        .get();

    if (tasksSnapshot.empty) return;

    const taskCount = tasksSnapshot.size;
    const message = `आपके आज ${taskCount} टास्क पेंडिंग हैं! कृपया उन्हें पूरा करें।`;

    // OneSignal को नोटिफिकेशन भेजें
    await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_API_KEY}`
        },
        body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            included_segments: ['All'],
            contents: { 'en': message, 'hi': message }
        })
    });
});
