import { useRouter, Router } from "next/router"
import { useState, useRef, useEffect } from "react"
import { useNameContext } from '../../src/context/nameContext.js'
import io from "socket.io-client"
import Peer from "simple-peer"
import styles from "../../styles/page/room.module.css"
import {MdCallEnd, MdOutlineVideocam, MdOutlineVideocamOff, MdMic, MdMicOff, MdOutlineShare, MdArrowBack} from "react-icons/md"
import toast from "react-hot-toast"
import {CopyToClipboard} from "react-copy-to-clipboard"
import Editor from "../../src/components/editor"
import {CgArrowLongLeft, CgArrowLongRight} from "react-icons/cg"
import Head from "next/head.js"
import { VideoStreamMerger } from "video-stream-merger"

const Room = () => {
  const router = useRouter()
  const [peer, setPeer] = useState()
  const [muted, setMuted] = useState(true)
  const [coff, setCoff] = useState(true)
  const [link, setLink] = useState('')
  const [rID, setRID] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const socketRef = useRef()
  const userVideo = useRef()
  const peerVideo = useRef()
  const peerRef = useRef()
  const merger = useRef()
  const userVideoStream = useRef()
  const userAudioStream = useRef()
  const [name, setName] = useNameContext()

  useEffect(()=>{
    const handleRouteChange = () => {
      userVideoStream.current?.getTracks().forEach(track=>{
        track.stop()
      })
      userAudioStream.current?.getTracks().forEach(track=>{
        track.stop()
      })
      merger.current?.destroy()
      socketRef.current?.disconnect()
      peerRef.current?.destroy()
      setName("Anonymous")
    }
    router.events.on('routeChangeStart', handleRouteChange)

    merger.current = new VideoStreamMerger()
    merger.current.start()
    merger.current.setOutputSize(800, 600)
    userVideo.current.srcObject = merger.current.result

    const room = window.location.pathname.substring(6)
    const prot = window.location.protocol
    const host = window.location.host
    setLink(`${prot}//${host}/room/lobby/${room}`)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [router.events, setName])

  useEffect(() => {
    if(!router.isReady) return
    const {roomID} = router.query
    setRID(roomID)

    socketRef.current = io.connect("https://codeshack-signalling-server.herokuapp.com")

    socketRef.current.emit("join_room", {roomID, userName: name})
    socketRef.current.on("room_full", handleFull)

    socketRef.current.on("peer", ({peerID, peerName})=>{
      const temp = createPeer(peerID, socketRef.current.id)
      peerRef.current = temp
      setPeer({peer: temp, peerName: peerName})
    })
    socketRef.current.on("user_joined", ({signal, callerID, callerName}) => {
      const temp = addPeer(signal, callerID)
      peerRef.current = temp
      setPeer({peer: temp, peerName: callerName})
    })
    socketRef.current.on("receiving_returned_signal", payload => {
      peerRef.current.signal(payload.signal) /* Connection complete */
    })

    const createPeer=(userToSignal, callerID)=>{
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: merger.current.result
      })
  
      peer.on("signal", signal => {
        socketRef.current.emit("sending_signal", { userToSignal, callerID, signal, callerName: name })
      })
  
      return peer
    }
    const addPeer=(incomingSignal, callerID)=>{
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: merger.current.result
      })
  
      peer.on("signal", signal => {
        socketRef.current.emit("returning_signal", { signal, callerID })
      })
  
      peer.signal(incomingSignal) /* Receiver has accepted, return to sender */
  
      return peer
    }

    const handleFull =()=>{
      toast.error("Room is full",  {duration: 5000})
      router.replace("/")
    }

  }, [name, router.isReady, router.query, router])

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


  const handleMic = ()=>{
    const old = muted
    const msg = old ? "Mic Enabled" : "Mic Disabled"
    if(old){
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream=>{
        userAudioStream.current = stream
        merger.current.addStream(stream)
      })
    }
    else{
      merger.current.removeStream(userAudioStream.current)
      userAudioStream.current?.getTracks().forEach(track=>{
        track.stop()
      })
    }
    toast.success(msg)
    setMuted(!old)
  }
  const handleCamera = ()=>{
    const old = coff
    const msg = old ? "Camera Enabled" : "Camera Disabled"
    if(old){
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream=>{
        userVideoStream.current = stream
        merger.current.addStream(stream)
      })
    }
    else{
      merger.current.removeStream(userVideoStream.current)
      userVideoStream.current?.getTracks().forEach(track=>{
        track.stop()
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
  const handleCollapse=()=>{
    const old = collapsed
    setCollapsed(!old)
  }
  return (
    <>
     <Head>
      <title>CodeShack - Room</title>
     </Head>
     <main className={styles.wrapper}>
        <div className={`${styles.panel} ${collapsed ? styles.collapsed : ''}`}>
          <div className={styles.collapse}>
            <button onClick={handleCollapse} className={styles.collapse_button}>
              {collapsed ? <CgArrowLongRight size={32}/> : <CgArrowLongLeft size={32}/>}
            </button>
            {collapsed && <button className={`${styles.button} ${styles.danger} ${styles.wide}`} onClick={handleLeave}>
              <MdCallEnd/>
            </button>}
          </div>
          <div className={styles.videos}>
            <div className={styles.video_wrapper} name-attr={name}>
              <video className={styles.video} muted ref={userVideo} autoPlay playsInline/>
            </div>
            {peer && <div className={styles.video_wrapper} name-attr={peer.peerName}>
              <video className={styles.video} ref={peerVideo} autoPlay playsInline />
          </div>}
          </div>
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
            {!collapsed && <button className={`${styles.button} ${styles.danger} ${styles.wide}`} onClick={handleLeave}>
              <MdCallEnd/>
            </button>}
          </div>
        </div>
        {rID && <Editor roomID={rID} peer={peerRef.current} peerName={peer?.peerName}/>} 
      </main>
    </>
  )
}

export default Room