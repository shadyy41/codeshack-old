import Navbar from "../components/navbar"
import styles from "../../styles/layout.module.css"
import { useNavContext } from "../context/navContext"
export default function Layout({ children }) {
  const [nav, setNav] = useNavContext()
  return (
    <>
      <main className={styles.wrapper}>
        {nav && <Navbar />}
        <div className={`${nav ? styles.children : styles.orphan}`}>{children}</div>
      </main>
    </>
  )
}