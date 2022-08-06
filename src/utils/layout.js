import Navbar from "../components/navbar"
import styles from "../../styles/layout.module.css"
export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className={styles.wrapper}>{children}</main>
    </>
  )
}