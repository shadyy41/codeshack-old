import '../styles/globals.css'
import Layout from '../src/utils/layout'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
function MyApp({ Component, pageProps }) {

  useEffect(() => {
    const loader = document.getElementById('globalLoader');
    loader.style.display = 'none';
  }, []);
  return (
    <Layout>
      <Component {...pageProps} />
      <Toaster position="bottom-center" toastOptions={{
        duration: 3000,
        style: {
          border: '2px solid var(--secondary-dark)',
          color: 'var(--primary-light)',
          background: 'var(--primary-dark)',
        },
        success: {
          iconTheme: {
            primary: 'var(--primary-accent)',
            secondary: 'var(--primary-light)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--primary-error)',
            secondary: 'var(--primary-light)',
          },
        },
      }}/>
    </Layout>
  )
}

export default MyApp
