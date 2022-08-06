import { useRouter } from "next/router"
import { useState, useRef, useEffect } from "react"
import io from "socket.io-client"
import Peer from "simple-peer"

const Video = (props) => {
  const ref = useRef();

  useEffect(() => {
      props.peer.on("stream", stream => {
          ref.current.srcObject = stream;
      })
  }, []);

  return (
      <video playsInline autoPlay ref={ref}/>
  );
}

const Post = () => {
  const { query, isReady } = useRouter();
  const [peers, setPeers] = useState([])
  const socketRef = useRef()
  const userVideo = useRef()
  const peersRef = useRef([])

  useEffect(() => {
    if(!isReady) return
    const {roomID} = query
    socketRef.current = io.connect("ws://localhost:3001");

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      userVideo.current.srcObject = stream;
      socketRef.current.emit("join room", roomID);
      socketRef.current.on("all users", users => {
        const peers = [];
        users.forEach(userID => {
          const peer = createPeer(userID, socketRef.current.id, stream);
          peersRef.current.push({
            peerID: userID,
            peer,
          })
          peers.push(peer);
        })
        setPeers(peers);
      })

      socketRef.current.on("user joined", payload => {
        const peer = addPeer(payload.signal, payload.callerID, stream);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
        })

        setPeers(users => [...users, peer]);
      })

      socketRef.current.on("receiving returned signal", payload => {
        const item = peersRef.current.find(p => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      })

      socketRef.current.on("user left", id=>{
        const peerObj = peersRef.current.find(p=>p.peerID === id)
        if(peerObj){
          peerObj.peer.destroy()
        }
        const peers = peersRef.current.filter(p=>p.peerID !== id)
        peersRef.current = peers
        setPeers(peers)
      })
    })
  }, [isReady]);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
    })

    return peer;
}

function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    })

    peer.on("signal", signal => {
      socketRef.current.emit("returning signal", { signal, callerID })
    })

    peer.signal(incomingSignal);

    return peer;
  }

  return (
    <>
      <h1>
        Nigga Marda
      </h1>
      <video muted ref={userVideo} autoPlay playsInline />
      {peers.map((peer, index) => {
          return (
            <Video key={index} peer={peer} />
          );
      })}
    </>
  )
}

export default Post