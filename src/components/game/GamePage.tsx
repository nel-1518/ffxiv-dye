import { useState } from "react";
import { Modal, Typography } from "antd";
const { Text } = Typography;
import type { Color } from "../../types/color";
import { Answers } from "./Answers";
import { CheckOutlined } from '@ant-design/icons'
import { Option } from "./Option";
import colorData from "../../data/colors.json";

// 总次数
const TURN = 20;

// 能力定义
type AbilityId = "敏慧" | "安宁" | "宿命";
const ABILITIES: AbilityId[] = ["敏慧", "安宁", "宿命"];
const ABILITY_DESC: Record<AbilityId, string> = {
  敏慧: "更换当前题目，并排除一个错误选项。",
  安宁: "随机显示正确答案中的一个字。",
  宿命: "直接使当前正确选项显现。",
};
// 能力栏位数量（最多同时持有 3 个能力，可重复）
const ABILITY_SLOTS = 3;

/**
 * 打乱数组（纯函数）
 */
function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/** 取 [0, n) 的随机整数 */
function randomInt(n: number): number {
  return Math.floor(Math.random() * n);
}

/** 以概率 p 判定是否命中 */
function chance(p: number): boolean {
  console.log(`chance(${p}) = ${Math.random() < p}`);
  return Math.random() < p;
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

  // ---- 能力系统 ----
  // 能力栏位（最多 3 个，可重复持有，null 表示空位）
  const [slots, setSlots] = useState<(AbilityId | null)[]>(
    Array(ABILITY_SLOTS).fill(null),
  );
  // 待确认使用的能力
  const [confirmAbility, setConfirmAbility] = useState<AbilityId | null>(null);
  // 敏慧：本回合被排除的错误选项下标
  const [excluded, setExcluded] = useState<number[]>([]);
  // 宿命：当前回合正确选项显现
  const [fateReveal, setFateReveal] = useState(false);
  // 安宁：本回合提示字
  const [fateChar, setFateChar] = useState("");
  // 连续答对次数
  const [streak, setStreak] = useState(0);
  // 遗忘：本局已触发次数（最多 2 次）
  const [forgetCount, setForgetCount] = useState(0);
  // 遗忘：本回合文字消失的选项下标
  const [forgottenIndex, setForgottenIndex] = useState<number | null>(null);
  // 遗忘：本回合是否触发（用于显示徽标）
  const [forgetActive, setForgetActive] = useState(false);
  // 遗忘：说明弹窗开关
  const [forgetModalOpen, setForgetModalOpen] = useState(false);

  /**
   * 游戏开始
   */
  function gameStart() {
    setScore(0);
    setStart(true);
    setPlayed(false);
    setTurn(0);
    changeTheEcho(false);

    // 重置能力与遗忘状态
    setSlots(Array(ABILITY_SLOTS).fill(null));
    setConfirmAbility(null);
    setExcluded([]);
    setFateReveal(false);
    setFateChar("");
    setStreak(0);
    setForgetCount(0);
    setForgottenIndex(null);
    setForgetActive(false);
    setForgetModalOpen(false);

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
    setTurn((t) => t + 1);

    // 获取当前答案
    const sel = allAnswers.next();
    setAnswer(sel);

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

    // ---- 回合结算 ----
    // 重置本回合临时状态
    setExcluded([]);
    setForgottenIndex(null);
    setForgetActive(false);
    setFateChar("");
    setFateReveal(false);

    // 遗忘：本回合有概率使随机一个选项的文字消失（每局最多 2 次）
    if (forgetCount < 2 && chance(0.08)) {
      const fi = randomInt(fourSel.length);
      setForgottenIndex(fi);
      setForgetActive(true);
      setForgetCount(forgetCount + 1);
    }
  }

  /**
   * 点击选项
   */
  function onSelect(option: Option) {
    const effectiveCorrect = option.correctAnswer;
    const nextStreak = effectiveCorrect ? streak + 1 : 0;
    const nextScore = score + (effectiveCorrect ? 1 : 0);

    setResults((prev) => [...prev, effectiveCorrect]);
    setScore(nextScore);
    setStreak(nextStreak);

    // 选对或选错都有 15% 概率获得能力；连击 ≥2 时概率提升为
    // 40% + (连击数-2)*30%（封顶 100%）；获得能力后重置连击，重新累计
    if (slots.includes(null)) {
      const gainChance =
        nextStreak >= 2
          ? Math.min(0.4 + (nextStreak - 2) * 0.3, 1)
          : 0.15;
      if (chance(gainChance)) {
        const gained = ABILITIES[randomInt(ABILITIES.length)];
        setSlots((prev) => {
          const i = prev.indexOf(null);
          if (i === -1) return prev;
          const next = [...prev];
          next[i] = gained;
          return next;
        });
        // 获得能力后重置连击
        setStreak(1);
      }
    }

    if (turn < TURN) {
      changeColor();
    } else {
      gameover();
      getComment(nextScore);
    }
  }

  /**
   * 请求使用能力（弹窗确认）
   */
  function openConfirm(id: AbilityId) {
    setConfirmAbility(id);
  }

  /**
   * 取消使用能力
   */
  function cancelConfirm() {
    setConfirmAbility(null);
  }

  /**
   * 确认使用能力
   */
  function confirmUse() {
    if (confirmAbility) {
      // 使用后槽位回到空状态
      setSlots((prev) => {
        const i = prev.indexOf(confirmAbility);
        if (i === -1) return prev;
        const next = [...prev];
        next[i] = null;
        return next;
      });
      applyAbility(confirmAbility);
    }
    setConfirmAbility(null);
  }

  /**
   * 敏慧：更换当前题目（全新随机颜色，不与本局已出现的颜色重复）
   */
  function regenerateQuestion(): Option[] {
    // 本局已用过的颜色（排除避免重复）
    const usedColors = new Set(allAnswers.colors.map((c) => c.color));
    const pool = colors.filter((c) => !usedColors.has(c.color));
    const source = pool.length > 0 ? pool : colors;

    let newColor = source[randomInt(source.length)];
    let tries = 0;
    while (newColor.color === answer.color && tries < 30) {
      newColor = source[randomInt(source.length)];
      tries++;
    }

    // 同步答案、结果页格子，并清空当前回合的提示/显现状态
    setAnswer(newColor);
    allAnswers.replaceLast(newColor);
    setFateChar("");
    setFateReveal(false);

    // 生成四个新选项
    const sameType = colors.filter(
      (v) => v.type === newColor.type && v.color !== newColor.color,
    );
    shuffleArray(sameType);
    const fourSel = new Array<Option>();
    for (let i = 0; i < 3; i++) {
      const item = sameType.pop();
      if (item) {
        fourSel.push(new Option(item, false));
      }
    }
    fourSel.push(new Option(newColor, true));
    shuffleArray(fourSel);
    setOptions(fourSel);
    return fourSel;
  }

  /**
   * 应用能力效果
   */
  function applyAbility(id: AbilityId) {
    if (id === "敏慧") {
      // 更换当前题目，并排除一个错误选项
      const newOptions = regenerateQuestion();
      const wrongIndexes = newOptions
        .map((v, i) => (v.correctAnswer ? -1 : i))
        .filter((i) => i >= 0);
      shuffleArray(wrongIndexes);
      setExcluded(wrongIndexes.slice(0, 1));

      // 若当前回合存在遗忘效果，则取消遗忘效果（恢复文字、隐藏徽标）
      if (forgottenIndex !== null || forgetActive) {
        setForgottenIndex(null);
        setForgetActive(false);
      }
    } else if (id === "安宁") {
      // 随机显示正确答案中的一个字
      setFateChar(answer.name[randomInt(answer.name.length)]);
    } else if (id === "宿命") {
      // 直接使当前正确选项显现
      setFateReveal(true);
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
            {/* 能力栏：3 个占位槽 / 超越之力 / 遗忘徽标 */}
            <div className="game-ability-bar">
              {slots.map((id, i) =>
                id ? (
                  <button
                    key={i}
                    className="game-ability-btn game-ability-available"
                    onClick={() => openConfirm(id)}
                    title={ABILITY_DESC[id]}
                  >
                    {id}
                  </button>
                ) : (
                  <button
                    key={i}
                    className="game-ability-btn"
                    disabled
                    title="这里应该有些什么"
                    aria-label="空位"
                  />
                ),
              )}
              {showEcho && (
                <button
                  className={`game-echo-btn${theEcho ? " game-echo-active" : ""}`}
                  onClick={() => changeTheEcho(!theEcho)}
                >
                  超越之力
                </button>
              )}
              {forgetActive && (
                <button
                  className="game-forget-badge"
                  onClick={() => setForgetModalOpen(true)}
                  title="遗忘"
                >
                  遗忘
                </button>
              )}
            </div>

            <p className="game-play-info">
              第 <span className="game-play-info-value">{turn}</span>
              <span className="">/</span>
              <span className="game-play-info-value">{TURN}</span> 罐
              <span className="game-sep"> · </span>
              已认出：<span className="game-play-info-value">{score}</span>
            </p>

            <div className="game-color-area">
              <div
                className="game-color-swatch"
                style={{ background: answer.color }}
              />
              <p className="game-color-hex">{answer.color}</p>
              {fateChar && <p className="game-fate-hint">若隐若现的字：{fateChar}</p>}
            </div>

            <div className="game-options">
              {options.map((v, i) => {
                const isExcluded = excluded.includes(i);
                const isForgotten = forgottenIndex === i;
                return (
                  <button
                    key={i}
                    className={`game-option-btn${
                      (theEcho || fateReveal) && v.correctAnswer
                        ? " game-option-correct"
                        : ""
                    }${isExcluded ? " game-option-excluded" : ""}`}
                    onClick={() => onSelect(v)}
                    disabled={isExcluded}
                  >
                    {isForgotten ? "?" : v.color.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 能力使用确认弹窗 */}
          <Modal
            open={confirmAbility !== null}
            onOk={confirmUse}
            onCancel={cancelConfirm}
            okText="使用"
            cancelText="取消"
            centered
            closeIcon={null}
            width={360}
          >
            <p className="game-confirm-name">{confirmAbility ?? ""}</p>
            <p className="game-confirm-desc">
              {confirmAbility ? ABILITY_DESC[confirmAbility] : ""}
            </p>
          </Modal>

          {/* 遗忘说明弹窗 */}
          <Modal
            open={forgetModalOpen}
            onOk={() => setForgetModalOpen(false)}
            onCancel={() => setForgetModalOpen(false)}
            okText="知道了"
            cancelButtonProps={{ style: { display: "none" } }}
            centered
            mask={{blur: true}}
            closeIcon={null}
            width={360}
          >
            <p className="game-confirm-desc">
              明明已经在嘴边，但你始终想不起来染剂的名字
              <br />
              <Text strong>你忘了</Text>
            </p>
          </Modal>
        </div>
      </div>
    </>
  );
}

export default GamePage;
