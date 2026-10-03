import { Icon, asset } from "./Ui.jsx";
import "../home-screen.css";

// The title screen owns no investigation state. Starting only opens the film.
export default function HomeScreen({ opening, onStart, onSettings }) {
  return (
    <section className={`game-home ${opening ? "is-starting" : ""}`} aria-label="游戏首页">
      <img className="home-art" src={asset("scenes/home.webp")}
        srcSet={`${asset("scenes/home-960.webp")} 960w, ${asset("scenes/home.webp")} 1672w`}
        sizes="100vw" fetchPriority="high"
        alt="窗外的面包店排着长队，窗内摊着账本和单据，邀请函的日期仍然空白。" />
      <div className="home-shade" aria-hidden="true" />
      <div className="home-content">
        <header className="home-title">
          <h1>账面之下</h1>
          <p className="home-chapter">第一章 · 排队的面包店</p>
        </header>
        <p className="home-premise">你是刚入职的银行员工，跟着林姐做第一次企业调查。<br />留灯烘焙想借20万元开新店。排队的生意，钱够用吗？</p>
        <nav className="home-menu" aria-label="首页菜单">
          <button type="button" className="home-start" disabled={opening} onClick={onStart}>
            <Icon name="play" size={19} /><span>开始游戏</span>
          </button>
          <button type="button" className="home-settings" aria-label="游戏设置" disabled={opening} onClick={onSettings}>
            <Icon name="settings" size={18} /><span>设置</span>
          </button>
        </nav>
      </div>
      <p className="home-footnote">进度自动保存在本机</p>
    </section>
  );
}
