import '../styles/globals.css'
import Layout from '../src/utils/layout'
import { useEffect } from 'react'
function MyApp({ Component, pageProps }) {

  useEffect(() => {
    const loader = document.getElementById('globalLoader');
    loader.style.display = 'none';
  }, []);
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}

export default MyApp
