import { useRouter, Router } from "next/router"
import { useState, useRef, useEffect } from "react"
import { useNameContext } from '../../src/context/nameContext.js'
import io from "socket.io-client"
import Peer from "simple-peer"
import styles from "../../styles/page/room.module.css"
import {MdCallEnd, MdOutlineVideocam, MdOutlineVideocamOff, MdMic, MdMicOff, MdOutlineShare, MdPlayCircle} from "react-icons/md"
import toast from "react-hot-toast"
import {CopyToClipboard} from "react-copy-to-clipboard"
import Editor from "../../src/components/editor"
import Select from 'react-select'

const languages = [
  { value: 'cpp', label: 'C++' },
  { value: 'js', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
]


const Post = () => {
  const router = useRouter()
  const [peer, setPeer] = useState()
  const [muted, setMuted] = useState(false)
  const [coff, setCoff] = useState(false)
  const [link, setLink] = useState('')
  const [rID, setRID] = useState('')
  const [selectedLang, setSelectedLang] = useState(languages[0])
  const socketRef = useRef()
  const userVideo = useRef()
  const peerVideo = useRef()
  const peerRef = useRef()
  const [name, setName] = useNameContext()

  const handleFull =()=>{
    toast.error("Room is full",  {duration: 5000})
    router.replace("/")
  }

  useEffect(()=>{
    const handleRouteChange = (url, { shallow }) => {
      userVideo?.current?.srcObject?.getTracks().forEach(function(track) {
        track.stop()
      })
      socketRef?.current?.disconnect()
      peerRef?.current?.destroy()
    }

    router.events.on('routeChangeStart', handleRouteChange)
    const url = window.location.href
    setLink(url)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [])

  useEffect(() => {
    if(!router.isReady) return
    const {roomID} = router.query
    setRID(roomID)

    socketRef.current = io.connect("ws://localhost:3001");

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      socketRef.current.emit("join_room", roomID)
      socketRef.current.on("room_full", handleFull)

      if(userVideo.current) userVideo.current.srcObject = stream

      socketRef.current.on("peer", peerID=>{
        const temp = createPeer(peerID, socketRef.current.id, stream)
        peerRef.current = temp
        setPeer(temp)
      })
      socketRef.current.on("user_joined", payload => {
        const temp = addPeer(payload.signal, payload.callerID, stream)
        peerRef.current = temp
        setPeer(temp)
      })
      socketRef.current.on("receiving_returned_signal", payload => {
        peerRef.current.signal(payload.signal) /* Connection complete */
      })
    })

  }, [router.isReady]);

  useEffect(()=>{
    if(peer){
      peer.on('stream', stream => {
        peerVideo.current.srcObject = stream
      })
      peer.on('close', () => {
        setPeer()
        toast("Peer has left the room",  {duration: 4000})
        peer.destroy()
      })
      peer.on('error', () => {
        peer.destroy()
      })
    }
  }, [peer])

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    })

    peer.on("signal", signal => {
      socketRef.current.emit("sending_signal", { userToSignal, callerID, signal })
    })

    return peer
  }
  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    })

    peer.on("signal", signal => {
      socketRef.current.emit("returning_signal", { signal, callerID })
    })

    peer.signal(incomingSignal) /* Receiver has accepted, return to sender */

    return peer
  }

  const handleMic = ()=>{
    const old = muted
    const msg = old ? "Mic Enabled" : "Mic Disabled"
    if(old){
      userVideo.current.srcObject.getTracks().forEach(function(track) {
        if(track.kind==='audio') track.enabled = true
      })
    }
    else{
      userVideo.current.srcObject.getTracks().forEach(function(track) {
        if(track.kind==='audio') track.enabled = false
      })
    }
    toast.success(msg)
    setMuted(!old)
  }
  const handleCamera = ()=>{
    const old = coff
    const msg = old ? "Camera Enabled" : "Camera Disabled"
    if(old){
      userVideo.current.srcObject.getTracks().forEach(function(track) {
        if(track.kind==='video') track.enabled = true
      })
    }
    else{
      userVideo.current.srcObject.getTracks().forEach(function(track) {
        if(track.kind==='video') track.enabled = false
      })
    }
    toast.success(msg)
    setCoff(!old)
  }
  const handleLeave = ()=>{
    router.replace('/')
    toast("You left the room",  {duration: 5000})
  }
  const handleShare = ()=>{
    toast.success("Copied To Clipboard")
  }

  /* Remove peer muted option */
  return (
    <>
    <main className={styles.wrapper}>
      <div className={styles.panel}>
        {name}
        <div className={styles.submit}>
          <Select
            defaultValue={selectedLang}
            onChange={setSelectedLang}
            options={languages}
            className="react-select-container"
            classNamePrefix="react-select"
          />
          <button className={`${styles.submit_button}`}>
            <MdPlayCircle/> Run Code
          </button>
        </div>
        <video className={styles.video} muted ref={userVideo} autoPlay playsInline />
        {peer && <video className={styles.video} muted ref={peerVideo} autoPlay playsInline/>}
        <div className={styles.controls}>
          <button className={`${styles.button} ${coff ? styles.danger : styles.normal}`} onClick={handleCamera}>
            {coff ? <MdOutlineVideocamOff/> : <MdOutlineVideocam/>}
          </button>
          <button className={`${styles.button} ${muted ? styles.danger : styles.normal}`} onClick={handleMic}>
            {muted ? <MdMicOff/> : <MdMic/>}
          </button>
          <CopyToClipboard text={link} onCopy={handleShare}>
            <button className={`${styles.button} ${styles.normal}`}>
              <MdOutlineShare/>
            </button>
          </CopyToClipboard>
          <button className={`${styles.button} ${styles.danger} ${styles.wide}`} onClick={handleLeave}>
            <MdCallEnd/>
          </button>
        </div>
      </div>
      {rID && <Editor roomID={rID}/>}
    </main>
    </>
  )
}

export default Post