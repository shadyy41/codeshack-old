import Image from 'next/image'
import styles from "../styles/page/index.module.css"
import {v4 as uuid} from "uuid"
import {useRouter} from 'next/router'
import { MdArrowForward } from "react-icons/md"
import { useNameContext } from '../src/context/nameContext'
import toast from "react-hot-toast"
import { useRef } from 'react'
import Head from 'next/head'

export default function Home() {
  const [name, setName] = useNameContext()
  const router = useRouter()
  const lenRef = useRef()

  const createRoom=()=>{
    const room = "room/" + uuid()
    router.replace(`/${room}`)
  }
  const handleName=(value)=>{
    if(!value || value.length===0) setName('Anonymous')
    else setName(value)
  }
  const handleLength=(value)=>{
    if(lenRef.current) clearTimeout(lenRef.current)
    lenRef.current = setTimeout(()=>{
      if(value.length>=15){
        toast.dismiss()
        toast.error("Name cannot contain more than 15 characters",  {duration: 1500})
      }
    }, 250)
  }

  return (
    <>
      <Head>
        <title>CodeShack</title>
      </Head>
      <main className={styles.wrapper}>
        <article className={styles.content}>
          <h1>
            Video Calls &amp; Collaborative Coding
          </h1>
          <p>
            Conduct coding interviews or practice with friends
          </p>
          <div className={styles.room_form}>
            <input type="text" name="room_name" id="room_name" placeholder='Enter your name' onChange={(e)=>handleName(e.target.value)} onBeforeInput={(e)=>handleLength(e.target.value)} maxLength="15"/>
            <button onClick={createRoom}>
              Create Room <MdArrowForward/>
            </button>
          </div>
        </article>
        <div className={styles.image}>
          <div className={styles.image_container}>
            <Image layout="fill" src={'https://i.imgur.com/A0gYlSw.png'} alt="App screenshot"/>
          </div>
        </div>
    </main>
    </>
  )
}
