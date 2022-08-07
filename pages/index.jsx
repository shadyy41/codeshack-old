import Image from 'next/image'
import Link from 'next/link'
import styles from "../styles/page/index.module.css"
import { useState, useEffect } from 'react'
import {BsArrowRightShort} from "react-icons/bs"
import {v4 as uuid} from "uuid"
import {useRouter} from 'next/router'

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
          <a onClick={createRoom}>
            <span>
              Create Room <BsArrowRightShort size={24}/>
            </span>
          </a>
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
