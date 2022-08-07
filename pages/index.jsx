import Image from 'next/image'
import styles from "../styles/page/index.module.css"
import {v4 as uuid} from "uuid"
import {useRouter} from 'next/router'
import { MdArrowForward } from "react-icons/md"

export default function Home() {
  const router = useRouter()
  const createRoom=()=>{
    const room = "room/" + uuid()
    router.push(`/${room}`)
  }

  return (
    <main className={styles.wrapper}>
      <article className={styles.content}>
        <h1>
          Video Calls &amp; Collaborative Coding
        </h1>
        <p>
          Conduct coding interviews or practice with friends
        </p>
        <div className={styles.room_form}>
          <input type="text" name="room_name" id="room_name" placeholder='Enter a name for your room'/>
          <button onClick={createRoom}>
            Create Room <MdArrowForward size={18}/>
          </button>
        </div>
      </article>
      <div className={styles.image}>
        <div className={styles.image_container}>
          <Image layout="fill" src={'https://kutty.netlify.app/hero.jpg'}/>
        </div>
      </div>
    </main>
  )
}
