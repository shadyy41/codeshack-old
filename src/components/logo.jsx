import styles from "../../styles/component/logo.module.css"
import Link from "next/link"
export default function Logo(){
  return (
    <span className={styles.logo}>
      <Link href={"/"}>
        <a>
          <span>{"<"}</span>{"codeshack"}<span>{"/>"}</span>
        </a>
      </Link>
    </span>
  )
}