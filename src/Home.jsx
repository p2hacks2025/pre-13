import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import FishList from "./FishList";

function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function loadPosts() {
      const querySnapshot = await getDocs(collection(db, "messages"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(data);//データが取れているか確認
      setPosts(data);
    }
    loadPosts();
  }, []);

  return (
    <div className="ocean">
      <FishList posts={posts} />
    </div>
  );
}

export default Home;//魚を動かすための部分