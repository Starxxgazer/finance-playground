import { useState } from "react";
import { films } from "../game/content.js";
import { Button, Icon, asset } from "./Ui.jsx";
export default function Film({ index, onContinue }) {
  const film = films[index];
  const [failed, setFailed] = useState(false);
  return (
    <section className={`film film-${index}`} aria-label="场景过渡">
      <img
        className="film-background"
        src={asset(`scenes/${film.image}.webp`)}
        srcSet={`${asset(`scenes/${film.image}-960.webp`)} 960w, ${asset(`scenes/${film.image}.webp`)} 1672w`}
        sizes="100vw"
        alt={
          index === 0 ? "晨光里，小禾为排队顾客装面包，陈叔在烤箱旁忙碌" : ""
        }
        fetchPriority="high"
      />
      {film.src && !failed && (
        <video
          controls
          playsInline
          onError={() => setFailed(true)}
          src={asset(film.src)}
        >
          {film.captions && (
            <track
              kind="captions"
              src={asset(film.captions)}
              srcLang="zh"
              label="中文"
              default
            />
          )}
        </video>
      )}
      <div className="film-content">
        <span className="film-kicker">
          {index === 0
            ? "第一章 / 一次有依据的调查"
            : ["", "10月29日 下午", "10月29日 晚", "10月30日 上午"][index]}
        </span>
        <h1>{film.title}</h1>
        <p>{film.text}</p>
        {index === 0 && (
          <p className="film-role">
            你负责调查，林姐负责带教与复核。
            <br />
            你和小禾是朋友，这件事已告诉林姐。
          </p>
        )}
        <Button onClick={onContinue}>
          {index === 0 ? "开始调查" : "进入场景"}
          <Icon name="arrow" size={22} />
        </Button>
        {film.src && (
          <button className="text-button" onClick={onContinue}>
            跳过视频，继续调查
          </button>
        )}
      </div>
      <span className="film-footnote">
        自由探索 / 没有倒计时 / 进度自动保存
      </span>
    </section>
  );
}
