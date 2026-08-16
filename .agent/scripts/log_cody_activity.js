import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyATlN5wwRxufoMPQEaI4XVWapWw4q1AaF8",
  authDomain: "hitecapp-safety.firebaseapp.com",
  projectId: "hitecapp-safety",
  storageBucket: "hitecapp-safety.firebasestorage.app",
  messagingSenderId: "139227119972",
  appId: "1:139227119972:web:97e5a0d921821946797a71"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function logActivity(title) {
  try {
    await addDoc(collection(db, 'feedback'), {
      title: title,
      summary: 'Pipeline executed by autonomous agent Cody',
      userId: 'Cody-Agent',
      userEmail: 'cody@hitec.id',
      timestamp: serverTimestamp()
    });
    console.log("Activity logged to Firestore successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error logging activity:", err);
    process.exit(1);
  }
}

const title = process.argv.slice(2).join(' ') || 'Cody Pipeline Task Complete';
logActivity(title);
