import { useRouter, Router } from "next/router"
import { useState, useRef, useEffect } from "react"
import { useNameContext } from '../../src/context/nameContext.js'
import io from "socket.io-client"
import Peer from "simple-peer"
import styles from "../../styles/page/room.module.css"
import {MdCallEnd, MdOutlineVideocam, MdOutlineVideocamOff, MdMic, MdMicOff, MdOutlineShare} from "react-icons/md"
import toast from "react-hot-toast"
import {CopyToClipboard} from "react-copy-to-clipboard"
import Editor from "../../src/components/editor"

const Post = () => {
  const router = useRouter()
  const [peer, setPeer] = useState()
  const [muted, setMuted] = useState(true)
  const [coff, setCoff] = useState(true)
  const [link, setLink] = useState('')
  const [rID, setRID] = useState('')
  const socketRef = useRef()
  const userVideo = useRef()
  const peerVideo = useRef()
  const peerRef = useRef()
  const [name, setName] = useNameContext()

  const handleFull =()=>{
    toast.error("Room is full",  {duration: 5000})
    router.replace("/")
  }

  const noPerms =()=>{
    toast.error("Cannot join a room without media permissions",  {duration: 5000})
    router.replace("/")
  }

  useEffect(()=>{
    const handleRouteChange = (url, { shallow }) => {
      userVideo?.current?.srcObject?.getTracks().forEach(function(track) {
        track.stop()
      })
      socketRef?.current?.disconnect()
      peerRef?.current?.destroy()
      setName("Anonymous")
    }

    router.events.on('routeChangeStart', handleRouteChange)
    const room = window.location.pathname.substring(6)
    const prot = window.location.protocol
    const host = window.location.host
    setLink(`${prot}//${host}/room/lobby/${room}`)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [])

  useEffect(() => {
    if(!router.isReady) return
    const {roomID} = router.query

    socketRef.current = io.connect("ws://localhost:3001");

    const tid = toast.loading("Waiting for media streams", {duration: Infinity})
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      socketRef.current.emit("join_room", {roomID, userName: name})
      socketRef.current.on("room_full", handleFull)
      toast.dismiss(tid)
      setRID(roomID)
      
      stream.getTracks().forEach(function(track) {
        track.enabled = false
      })
      userVideo.current.srcObject = stream

      socketRef.current.on("peer", ({peerID, peerName})=>{
        const temp = createPeer(peerID, socketRef.current.id, stream)
        peerRef.current = temp
        setPeer({peer: temp, peerName: peerName})
      })
      socketRef.current.on("user_joined", ({signal, callerID, callerName}) => {
        const temp = addPeer(signal, callerID, stream)
        peerRef.current = temp
        setPeer({peer: temp, peerName: callerName})
      })
      socketRef.current.on("receiving_returned_signal", payload => {
        peerRef.current.signal(payload.signal) /* Connection complete */
      })
    }).catch(e=>{//User didn't give AV perms
      toast.dismiss(tid)
      noPerms()
    })

  }, [router.isReady]);

  useEffect(()=>{
    if(peer){
      peer.peer.on('stream', stream => {
        peerVideo.current.srcObject = stream
      })
      peer.peer.on('close', () => {
        setPeer()
        peerRef.current = null
        toast(`${peer.peerName} has left the room`,  {duration: 4000})
        peer.peer.destroy()
      })
      peer.peer.on('error', () => {
        peer.peer.destroy()
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
      socketRef.current.emit("sending_signal", { userToSignal, callerID, signal, callerName: name })
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
        <div className={styles.video_wrapper} name-attr={name}>
          <video className={styles.video} muted ref={userVideo} autoPlay playsInline/>
        </div>
        {peer && <div className={styles.video_wrapper} name-attr={peer.peerName}>
          <video className={styles.video} muted ref={peerVideo} autoPlay playsInline />
        </div>}
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
      <div className={styles.editor}>
        {rID && <Editor roomID={rID} peer={peerRef.current} peerName={peer?.peerName}/>} 
      </div>
    </main>
    </>
  )
}

export default Post