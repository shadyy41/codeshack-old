import { EditorView, basicSetup } from "codemirror"
import { EditorState, Compartment } from "@codemirror/state"
import { keymap } from "@codemirror/view"
import {indentWithTab} from "@codemirror/commands"
import { cpp } from '@codemirror/lang-cpp'
import { java } from "@codemirror/lang-java"
import { javascript } from "@codemirror/lang-javascript"

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
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
]

export default function Editor({roomID, peer, peerName}) {
  const editor = useRef()
  const inputRef = useRef()
  const outputRef = useRef()
  const viewRef = useRef()
  const inputViewRef = useRef()
  const outputViewRef = useRef()

  const langCompRef = useRef()
  const [name, setName] = useNameContext()
  const [selectedLang, setSelectedLang] = useState(languages[0])
  const [nav, setNav] = useNavContext()
  const [submitted, setSubmitted] = useState(false)
  const [connected, setConnected] = useState(false)

  const handleFullScreen = ()=>{
    const old = nav
    if(old) setNav(false)
    else setNav(true)
  }
  const create = async(source_code, value, input)=>{
    const res = await axios.post('https://api.paiza.io/runners/create', {
      api_key: "guest",
      input,
      language: value,
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
    if(connected) peer.send(JSON.stringify({code : "change_lang", lang: lang})) //inform the peer
    let t = cpp
    if(lang.value==='javascript') t = javascript
    else if(lang.value==='java') t = java
    viewRef.current.dispatch({
      effects: langCompRef.current.reconfigure(t())
    })
  }
  const handleRun  =async({value})=>{
    if(submitted) return
    setSubmitted(true)
    const source_code = viewRef.current.state.doc.toString()
    const input = inputViewRef.current.state.doc.toString()
    if(connected){
      peer.send(JSON.stringify({code: "running_code"}))
    }
    try {
      const res = await create(source_code, value, input)
      console.log(res)
      const {stdout, build_result, build_stderr, build_stdout, result, stderr, time} = res
      let message
      if(build_result==='failure'){ //compilation error
        message = build_stderr + "\n" + build_stdout
      }
      else{
        if(result==="success"){
          message = stdout
        }
        else if(result==="timeout"){
          message = "Code took longer than 1.00 secs to run"
        }
        else{
          message = stderr + "\n" + stdout
        }
      }
      outputViewRef.current.dispatch({
        changes: {from: 0, insert: "___________________________\n"}
      })
      outputViewRef.current.dispatch({
        changes: {from: 0, insert: `${message}\n`}
      })
      if(connected) peer.send(JSON.stringify({code : "result", body: res})) //inform the peer
      setSubmitted(false)
    } catch(e){
      console.log(e)
      toast.error("An error occured")
      if(connected) peer.send(JSON.stringify({code : "api_error"})) //inform the peer
      setSubmitted(false)
    }    
  }

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
        setSubmitted(false)
      }
      else if(msg.code==='change_lang'){
        toast(`${peerName} changed language to ${msg.lang.label}`)
        setSelectedLang(msg.lang)
        let t = cpp
        if(msg.lang.value==='javascript') t = javascript
        else if(msg.lang.value==='java') t = java
        viewRef.current.dispatch({
          effects: langCompRef.current.reconfigure(t())
        })
      }
    })
  }, [peer])

  const createState = (rID, suffix, no_lang, read_only)=>{
    const room = "" + rID + suffix
    const ydoc = new Y.Doc()
    const provider = new WebrtcProvider(room, ydoc, {password: "Hello"})
    const ytext = ydoc.getText('codemirror')
    const undoManager = new Y.UndoManager(ytext)

    provider.awareness.setLocalStateField('user', {
      name: name,
      color: "#3f8ed0",
      colorLight: "#3f8ed0",
    })
    
    const extensions = [basicSetup, keymap.of(indentWithTab), myTheme, EditorView.lineWrapping, yCollab(ytext, provider.awareness, { undoManager })]

    if(read_only){
      extensions.push(EditorState.readOnly.of(true))
    }
    else if(!no_lang){
      langCompRef.current = new Compartment
      extensions.push(langCompRef.current.of(cpp()))
    }
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions
    })
    return state
  }

  useEffect(() => {
    inputViewRef.current = new EditorView({ state: createState(roomID, "input", true, false), parent: inputRef.current})
    outputViewRef.current = new EditorView({ state: createState(roomID, "output", true, true), parent: outputRef.current})
    viewRef.current = new EditorView({ state: createState(roomID, "", false, false), parent: editor.current})


    return () => {
      viewRef.current.destroy()
      inputViewRef.current.destroy()
      outputViewRef.current.destroy()
    }
  }, [])

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
            <button className={`${styles.submit_button}`} onClick={()=>handleRun(selectedLang)}>
              {submitted ? "Running..." : <><MdPlayCircle/> Run Code</>}
            </button>
          </div>
        </div>
        <section className={styles.editors}>
          <div className={styles.editor} ref={editor}>
          </div>
          <div className={styles.io}>
            <div className={styles.input} ref={inputRef}></div>
            <div className={styles.input} ref={outputRef}></div>
          </div>
        </section>
      </div>
    </>
  )
}