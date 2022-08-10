import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { keymap } from "@codemirror/view"
import {indentWithTab} from "@codemirror/commands"
import { cpp } from '@codemirror/lang-cpp'
import { useRef, useEffect, useState } from 'react'
import * as Y from 'yjs'
import { yCollab } from 'y-codemirror.next'
import { WebrtcProvider } from 'y-webrtc'
import styles from "../../styles/component/editor.module.css"
import { myTheme } from "../utils/myTheme.js"
import { useNameContext } from '../../src/context/nameContext.js'
import Select from 'react-select'
import {MdPlayCircle, MdOutlineFullscreen} from "react-icons/md"
import {useNavContext} from "../context/navContext"
import toast from "react-hot-toast"
import axios from "axios"

const languages = [
  { value: 'cpp', label: 'C++' },
  { value: 'js', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
]

export default function Editor({roomID, peer, peerName}) {
  const editor = useRef()
  const [name, setName] = useNameContext()
  const [selectedLang, setSelectedLang] = useState(languages[0])
  const [nav, setNav] = useNavContext()
  const [submitted, setSubmitted] = useState(false)
  const [connected, setConnected] = useState(false)
  const viewRef = useRef()

  const handleFullScreen = ()=>{
    const old = nav
    if(old) setNav(false)
    else setNav(true)
  }
  const getCode=(lines)=>{
    let res = ""
    for(let line of lines){
      res += line
      res += "\n"
    }
    return res
  }
  const create = async(source_code)=>{
    const res = await axios.post('https://api.paiza.io/runners/create', {
      api_key: "guest",
      input: "",
      language: "cpp",
      source_code,
      longpoll: true
    })
    return get_details(res.data)
  }
  const get_details = async(p)=> {
    const payload = new URLSearchParams({
      id: p.id,
      api_key: 'guest'
    });
    const querystring = payload.toString();
    const res = await axios.get(`https://api.paiza.io/runners/get_details?${querystring}`)
    return res.data
  }
  const handleLanguage = (lang)=>{
    setSelectedLang(lang)
    console.log(lang)
    if(connected) peer.send(JSON.stringify({code : "change_lang", lang: lang})) //inform the peer
  }
  const handleRun  =async()=>{
    if(submitted) return
    setSubmitted(true)
    const lines = viewRef.current.state.doc.text
    const source_code = getCode(lines)
    if(connected){
      peer.send(JSON.stringify({code: "running_code"}))
    }
    try {
      const res = await create(source_code)
      if(connected) peer.send(JSON.stringify({code : "result", body: res})) //inform the peer
      setSubmitted(false)
    } catch(e){
      console.log(e)
      toast.error("An error occured")
      if(connected) peer.send(JSON.stringify({code : "api_error"})) //inform the peer
      setSubmitted(false)
    }    
  }

  useEffect(() => {
    const ydoc = new Y.Doc()
    const provider = new WebrtcProvider(`${roomID}`, ydoc, {password: "Hello"})
    const ytext = ydoc.getText('codemirror')
    const undoManager = new Y.UndoManager(ytext)

    provider.awareness.setLocalStateField('user', {
      name: name,
      color: "#3f8ed0",
      colorLight: "#3f8ed0",
    })
    const lw = EditorView.lineWrapping
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [basicSetup, keymap.of(indentWithTab), myTheme, cpp(), lw, yCollab(ytext, provider.awareness, { undoManager })]
    })
    viewRef.current = new EditorView({ state, parent: editor.current})

    return () => {
      viewRef.current.destroy()
    }
  }, [])

  useEffect(()=>{
    if(!peer){
      setConnected(false)
      return
    }
    peer.on('connect', ()=>{
      setConnected(true)
    })
    peer.on('data', (data)=>{// data is a buffer
      const msg = JSON.parse(data.toString())
      if(msg.code==='running_code'){
        setSubmitted(true)
      }
      else if(msg.code==='api_error'){
        toast.error("An error occured")
        setSubmitted(false)
      }
      else if(msg.code==='result'){
        console.log(msg.body)
        setSubmitted(false)
      }
      else if(msg.code==='change_lang'){
        toast(`${peerName} changed language to ${msg.lang.label}`)
        setSelectedLang(msg.lang)
      }
    })
  }, [peer])
  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.submit}>
            <Select
              value={selectedLang}
              onChange={handleLanguage}
              options={languages}
              className="react-select-container"
              classNamePrefix="react-select"
            />
            <div className={styles.submit_right}>
              <button className={styles.fullscreen} onClick={handleFullScreen}>
                <MdOutlineFullscreen/>
              </button>
              <button className={`${styles.submit_button}`} onClick={handleRun}>
                {submitted ? "Running..." : <><MdPlayCircle/> Run Code</>}
              </button>
            </div>
          </div>
          <div className={styles.editor} ref={editor}>
          </div>
      </div>
    </>
  )
}