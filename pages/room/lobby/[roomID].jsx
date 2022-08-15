import { useRouter, Router } from "next/router"
import { useState, useRef, useEffect } from "react"
import { useNameContext } from '../../../src/context/nameContext.js'
import { toast } from "react-hot-toast"
import { MdArrowForward } from "react-icons/md"

import styles from "../../../styles/page/lobby.module.css"

const Lobby = ()=>{
  const router = useRouter()
  const userVideo = useRef()
  const lenRef = useRef()
  const roomRef = useRef()
  const [name, setName] = useNameContext()

  const handleName=(value)=>{
    if(!value || value.length===0) setName('Anonymous')
    else setName(value)
  }
  const joinRoom=()=>{
    if(!roomRef.current) return toast.error("An error occurred")
    router.replace(`/room/${roomRef.current}`)
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

  useEffect(()=>{ 
    if(!router.isReady) return
    const {roomID} = router.query
    roomRef.current = roomID
    const id = toast.loading("Waiting for user media", {duration: Infinity})
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream=>{
      userVideo.current.srcObject = stream
      toast.dismiss(id)
    }).catch(e=>{
      toast.dismiss(id)
    })
  }, [router.isReady, router.query])

  useEffect(()=>{
    const handleRouteChange = (url, { shallow }) => {
      userVideo.current?.srcObject?.getTracks().forEach(function(track) {
        track.stop()
      })
    }
    router.events.on('routeChangeStart', handleRouteChange)

    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [router.events])

  return (
    <main className={styles.wrapper}>
      <video className={styles.video} muted ref={userVideo} autoPlay playsInline/>
      <aside className={styles.room_form}>
        <section className={styles.info}>
          <h2>Ready To Join?</h2>
          <p>You will join with the camera and mic turned off</p>
        </section>
        <section className={styles.form}>
          <input type="text" name="room_name" id="room_name" placeholder='Enter your name' onChange={(e)=>handleName(e.target.value)} onBeforeInput={(e)=>handleLength(e.target.value)} maxLength="15"/>
          <button onClick={joinRoom}>
            Join Room <MdArrowForward/>
          </button>
        </section>
      </aside>
    </main>
  )
}

export default Lobby

