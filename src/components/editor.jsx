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


export default function Editor({roomID}) {
  const editor = useRef()

  useEffect(() => {
    const ydoc = new Y.Doc()
    const provider = new WebrtcProvider(`${roomID}`, ydoc, {password: "Hello"})
    const ytext = ydoc.getText('codemirror')

    const undoManager = new Y.UndoManager(ytext)

    provider.awareness.setLocalStateField('user', {
      name: 'anon',
      color: '#1be7ff',
      colorLight: '1be7ff33'
    })
    const lw = EditorView.lineWrapping
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [basicSetup, keymap.of(indentWithTab), myTheme, cpp(), lw, yCollab(ytext, provider.awareness, { undoManager })]
    })
    const view = new EditorView({ state, parent: editor.current})

    return () => {
      view.destroy()
    }
  }, [])
  return (
    <div className={styles.wrapper} ref={editor}>
    </div>
  )
}