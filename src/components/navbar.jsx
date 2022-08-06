import styles from "../../styles/component/navbar.module.css"
import Link from "next/link"
import Logo from "./logo"
import {BsGithub} from "react-icons/bs"
const Navbar = () => {
  return (
    <nav className={styles.wrapper}>
      <div className={styles.left}>
        <Logo/>
      </div>
      <div className={styles.right}>
        <Link href={'https://github.com/shadyy41'}>
          <a>
            <BsGithub size={28}/>
          </a>
        </Link>
      </div>
    </nav>
  )
}

export default Navbar