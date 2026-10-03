import { mission, fieldTools, sceneBriefs } from "../game/narrative.js";
import { Icon, asset } from "./Ui.jsx";

export function ToolPicture({ tool }) {
  return tool.image ? <img src={asset(tool.image)} alt="" /> : <Icon name={tool.icon} size={44} />;
}

export default function FieldGuide({ scene }) {
  return <div className="field-guide">
    <section className="field-brief">
      <span className="field-kicker">林姐的出发叮嘱</span>
      <h3>先认识你的第一份任务</h3>
      <p><strong>{mission.identity}</strong></p>
      <p>{mission.premise}</p><p>{mission.people}</p><p>{mission.task}</p>
      <div className="field-current"><strong>眼下怎么做</strong><p>{sceneBriefs[scene]}</p></div>
    </section>
    <section className="field-kit" aria-label="随身道具说明">
      <h3>这几样东西，陪你一起查</h3>
      {fieldTools.map(tool => <article key={tool.id}>
        <div className="field-tool-picture"><ToolPicture tool={tool} /></div>
        <div><h4>{tool.name}</h4><p>{tool.text}</p></div>
      </article>)}
      <p className="field-reminder">点现场圆标打开物品。电脑鼠标靠两边看全景，手机左右滑动。没有倒计时，选错随时改。</p>
    </section>
  </div>;
}
