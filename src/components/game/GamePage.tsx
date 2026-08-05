import { useState } from "react";
import type { Color } from "../../types/color";
import { Answers } from "./Answers";
import { CheckOutlined } from '@ant-design/icons'
import { Option } from "./Option";
import colorData from "../../data/colors.json";

// 总次数
const TURN = 20;

/**
 * 打乱数组（纯函数）
 */
function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function GamePage() {
  // 所有染剂数据
  const [colors] = useState(colorData as Array<Color>);

  // 超越之力
  const [theEcho, changeTheEcho] = useState(false);
  // 首次通关后显示超越之力按钮
  const [showEcho, setShowEcho] = useState(false);
  // 得分
  const [score, setScore] = useState(0);
  // 当前剩余次数
  const [turn, setTurn] = useState(0);
  // 完成一次标记
  const [played, setPlayed] = useState(false);
  // 开始游戏标记
  const [start, setStart] = useState(false);

  // 当前答案
  const [answer, setAnswer] = useState<Color>(colors[0]);
  // 当前选项
  const [options, setOptions] = useState<Option[]>([]);
  // 分数评价
  const [comment, setComment] = useState("");
  // 保存全部答案（组件内）
  const [allAnswers] = useState(() => new Answers());
  // 记录每轮答题是否正确
  const [results, setResults] = useState<boolean[]>([]);

  /**
   * 游戏开始
   */
  function gameStart() {
    setScore(0);
    setStart(true);
    setPlayed(false);

    // 生成一批颜色，数量为 TURN
    const copyColors = [...colors];
    shuffleArray(copyColors);
    setResults([]);
    allAnswers.put(copyColors.slice(0, TURN));
    changeColor();
  }

  /**
   * 点击选项后更换当前颜色
   */
  function changeColor() {
    setTurn(turn + 1);

    // 获取当前答案
    const sel = allAnswers.next();
    setAnswer(sel);
    console.log(sel.name);

    // 找到类似的颜色并打乱
    const sameType = colors.filter(
      (v) => v.type === sel.type && v.color !== sel.color,
    );
    shuffleArray(sameType);

    // 得到四个选项
    const fourSel = new Array<Option>();
    for (let i = 0; i < 3; i++) {
      const item = sameType.pop();
      if (item) {
        fourSel.push(new Option(item, false));
      }
    }
    fourSel.push(new Option(sel, true));

    // 再打乱选项
    shuffleArray(fourSel);
    setOptions(fourSel);
  }

  /**
   * 点击选项
   */
  function onSelect(option: Option) {
    const correct = option.color.name === answer.name;
    setResults(prev => [...prev, correct]);

    let gameoverScore = score;
    if (correct) {
      gameoverScore++;
      setScore(score + 1);
    }

    if (turn < TURN) {
      changeColor();
    } else {
      gameover();
      getComment(gameoverScore);
    }
  }

  /**
   * 游戏结束
   */
  function gameover() {
    setTurn(0);
    setPlayed(true);
    setStart(false);
    setShowEcho(true);
  }

  /**
   * 根据得分显示评价
   */
  function getComment(gameoverScore: number) {
    let com = "发生什么了？!";

    switch (gameoverScore) {
      case 0:
        com = '是、是零？大概是"阳小灵"级。';
        break;
      case 1:
      case 2:
      case 3:
      case 4:
        com = '分数有些低，是"小松鼠"级。不如再试一次？';
        break;
      case 5:
      case 6:
        com = '稍加努力就能够达到的分数，是"灰尘兔"级。';
        break;
      case 7:
      case 8:
        com = '稍加努力就能够达到的分数，是"渡渡鸟雏"级，再仔细判断一下？';
        break;
      case 9:
      case 10:
        com = '不错的分数，你对染剂颜色已经有一些了解，是"小脚雪人"级。';
        break;
      case 11:
      case 12:
        com = '很好的分数，你对染剂颜色已经很了解，是"长须小黑豹"级。';
        break;
      case 13:
      case 14:
      case 15:
        com = '你对染剂颜色很熟悉，是"叶小妖妖"级，投影台一定是每天见面的好朋友！';
        break;
      case 16:
      case 17:
        com =
          '是、是"旅雀儿"级，你对染剂非常熟悉，染剂商人的生意一定离不开你！';
        break;
      case 18:
      case 19:
        com =
          '好、好厉害！居然是"椒盐海豹"级，你的背包里肯定塞满了染剂和幻象棱晶！';
        break;
      case 20:
        com =
          '满分！达到了"纳夏猫"级！你在无数绝妙搭配上用过的染剂，已经可以堆满整个海都广场了吧！';
        break;
    }
    setComment(com);
  }

  return (
    <>
      <div className="game-page">
        <div className="game-card">
          {showEcho && start && (
            <button
              className={`game-echo-btn${theEcho ? " game-echo-active" : ""}`}
              onClick={() => changeTheEcho(!theEcho)}
            >
              超越之力
            </button>
          )}
          <div className={start ? "game-section-hidden" : "game-section"}>
            <h1 className="game-title">猜染剂</h1>
            <h4 className="game-subtitle">
              某日，你打开陆行鸟鞍囊
              <br />
              所有染剂都被神秘力量贴上了“通用染剂”的标签
              <br />
              你需要重新分辨它们的颜色…
              <br />
            </h4>

            {played && (
              <div className="game-result">
                <p className="game-result-score">你认出了 {score}<span className="game-result-total">/{TURN}</span> 种染剂</p>
                <p className="game-result-comment">{comment}</p>
                <div className="game-result-cells">
                  {allAnswers.colors.map((v, i) => (
                    <span
                      key={i}
                      className="game-cell"
                      style={{ background: v.color }}
                      data-name={v.name}
                      data-hex={v.color}
                    >
                      {results[i] && <CheckOutlined className="game-cell-check" />}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <button className="game-play-btn" onClick={() => gameStart()}>
                {played ? "重新挑战" : "使命开始"}
              </button>
            </div>

            <p className="game-credit">
              染剂色值来自
              <a
                href="https://ff14.huijiwiki.com/wiki/%E6%9F%93%E5%89%82"
                target="_blank"
                rel="noopener noreferrer"
              >
                最终幻想 XIV 中文维基 - 染剂
              </a>
            </p>
          </div>

          <div className={start ? "game-section" : "game-section-hidden"}>
            <p className="game-play-info">
              剩余次数：
              <span className="game-play-info-value">{TURN - turn}</span>
              <span className="game-sep">/</span>
              得分：<span className="game-play-info-value">{score}</span>
            </p>

            <div className="game-color-area">
              <div
                className="game-color-swatch"
                style={{ background: answer.color }}
              />
              <p className="game-color-hex">{answer.color}</p>
            </div>

            <div className="game-options">
              {options.map((v, i) => (
                <button
                  key={i}
                  className={`game-option-btn${theEcho && v.correctAnswer ? " game-option-correct" : ""}`}
                  onClick={() => onSelect(v)}
                >
                  {v.color.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default GamePage;
