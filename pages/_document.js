import React from 'react'
import Document, {Html, Head, Main, NextScript} from 'next/document'
import loader from "../src/utils/loader"

class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head/>
                <head>
                    <link rel="preload" href="/MonoLisa-Regular.otf" as="font" crossOrigin="anonymous" />
                    <style>
                        {loader}
                    </style>
                </head>
                <body>
                <div id={'globalLoader'}>
                    <div className="loader">
                        <div/>
                        <div/>
                    </div>
                </div>
                <Main/>
                <NextScript/>
                </body>
            </Html>
        )
    }
}

export default MyDocument