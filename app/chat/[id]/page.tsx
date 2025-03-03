//This is a conceptual solution since no original code was provided.  This code needs to be integrated into the original application.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from 'react';


const firebaseConfig = {
  // ... your Firebase config ...
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


function MyComponent() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    // Only run this on the client-side
    if (typeof window !== 'undefined') {
      const unsubscribe = auth.onAuthStateChanged(user => {
        setUser(user);
        setIsLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  if(isLoading){
      return <p>Loading...</p>
  }

  if(user){
      return <p>User is logged in!</p>
  }
  else {
      return <p>User is not logged in.</p>
  }
}

export default MyComponent;