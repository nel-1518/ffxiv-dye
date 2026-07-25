import { useState } from 'react'
import type { Color } from '../../types/color'
import { Answers } from './Answers'
import { Checkbox, Modal } from 'antd'
import { Option } from './Option'
import colorData from '../../data/colors.json'

// 总次数
const TURN = 20

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
  const [colors] = useState(colorData as Array<Color>)

  // 超越之力
  const [theEcho, changeTheEcho] = useState(false)
  // 得分
  const [score, setScore] = useState(0)
  // 当前剩余次数
  const [turn, setTurn] = useState(0)
  // 完成一次标记
  const [played, setPlayed] = useState(false)
  // 开始游戏标记
  const [start, setStart] = useState(false)

  // 当前答案
  const [answer, setAnswer] = useState<Color>(colors[0])
  // 当前选项
  const [options, setOptions] = useState<Option[]>([])
  // 分数评价
  const [comment, setComment] = useState('')
  // 保存全部答案（组件内）
  const [allAnswers] = useState(() => new Answers())

  // 弹窗控制
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalColor, setModalColor] = useState(colors[0])

  /**
   * 游戏开始
   */
  function gameStart() {
    setScore(0)
    setStart(true)
    setPlayed(false)

    // 生成一批颜色，数量为 TURN
    const copyColors = [...colors]
    shuffleArray(copyColors)
    allAnswers.put(copyColors.slice(0, TURN))
    changeColor()
  }

  /**
   * 点击选项后更换当前颜色
   */
  function changeColor() {
    setTurn(turn + 1)

    // 获取当前答案
    const sel = allAnswers.next()
    setAnswer(sel)
    console.log(sel.name)

    // 找到类似的颜色并打乱
    const sameType = colors.filter((v) => v.type === sel.type && v.color !== sel.color)
    shuffleArray(sameType)

    // 得到四个选项
    const fourSel = new Array<Option>()
    for (let i = 0; i < 3; i++) {
      const item = sameType.pop()
      if (item) {
        fourSel.push(new Option(item, false, theEcho))
      }
    }
    fourSel.push(new Option(sel, true, theEcho))

    // 再打乱选项
    shuffleArray(fourSel)
    setOptions(fourSel)
  }

  /**
   * 点击选项
   */
  function onSelect(option: Option) {
    let gameoverScore = score
    if (option.color.name === answer.name) {
      gameoverScore++
      setScore(score + 1)
    }

    if (turn < TURN) {
      changeColor()
    } else {
      gameover()
      getComment(gameoverScore)
    }
  }

  /**
   * 游戏结束
   */
  function gameover() {
    setTurn(0)
    setPlayed(true)
    setStart(false)
  }

  /**
   * 根据得分显示评价
   */
  function getComment(gameoverScore: number) {
    let com = '发生什么了？这也许是"大河狸"级？'

    switch (gameoverScore) {
      case 0:
        com = '是、是零？大概是"阳小灵"级。'
        break
      case 1:
      case 2:
      case 3:
      case 4:
        com = '分数有些低，是"小松鼠"级。不如再试一次？'
        break
      case 5:
      case 6:
        com = '稍加努力就能够达到的分数，是"灰尘兔"级。'
        break
      case 7:
      case 8:
        com = '稍加努力就能够达到的分数，是"青鸟"级，再仔细判断一下？'
        break
      case 9:
      case 10:
        com = '不错的分数，你对染剂已经有一些了解，是"小脚雪人"级。'
        break
      case 11:
      case 12:
        com = '很不错的分数，你对染剂已经比较了解，是"长须小黑豹"级。'
        break
      case 13:
      case 14:
      case 15:
        com = '你对染剂很熟悉，是"叶小妖妖"级，投影台一定是每天见面的好朋友！'
        break
      case 16:
      case 17:
        com = '出、出现了，是"旅雀儿"级，你对染剂非常熟悉，染剂商人的生意一定离不开你！'
        break
      case 18:
      case 19:
        com = '好、好厉害！居然是"椒盐海豹"级，你的背包里肯定塞满了各种颜色的染剂和幻象棱晶！'
        break
      case 20:
        com = '满分！达到了"纳夏猫"级！你在无数绝妙搭配上用过的染剂，已经可以堆满整个海都广场了吧！'
        break
    }
    setComment(com)
  }

  /**
   * 弹窗显示颜色信息
   */
  function showModal(color: Color) {
    setModalColor(color)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="game-page">
        <div className="game-card">
          <div className={start ? 'game-section-hidden' : 'game-section'}>
            <h1 className="game-title">染剂整理</h1>
            <h3 className="game-subtitle">看颜色选择染剂</h3>

            {played && (
              <div className="game-result">
                <p className="game-result-score">总分：{score}</p>
                <p className="game-result-comment">{comment}</p>
                <div className="game-result-cells">
                  {allAnswers.colors.map((v, i) => (
                    <span
                      key={i}
                      onClick={() => showModal(v)}
                      className="game-cell"
                      style={{ background: v.color }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <button className="game-play-btn" onClick={() => gameStart()}>
                {played ? '重新挑战' : '使命开始'}
              </button>
            </div>

            {played && (
              <Checkbox
                className="game-echo"
                onChange={(e) => changeTheEcho(e.target.checked)}
              >
                超越之力
              </Checkbox>
            )}

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

          <div className={start ? 'game-section' : 'game-section-hidden'}>
            <h2 className="game-play-title">染剂整理</h2>
            <p className="game-play-info">
              剩余次数：<span className="game-play-info-value">{TURN - turn}</span>
              <span className="game-sep">/</span>
              得分：<span className="game-play-info-value">{score}</span>
            </p>

            <div className="game-color-area">
              <div className="game-color-swatch" style={{ background: answer.color }} />
              <p className="game-color-hex" style={{ color: answer.color }}>{answer.color}</p>
            </div>

            <div className="game-options">
              {options.map((v, i) => (
                <button
                  key={i}
                  className={`game-option-btn${v.mark && v.correctAnswer ? ' game-option-correct' : ''}`}
                  onClick={() => onSelect(v)}
                >
                  {v.color.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={modalColor.name}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={() => <></>}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="game-color-area">
            <div className="game-color-swatch" style={{ background: modalColor.color }}></div>
          </div>
          <p>
            <a
              href={`https://ff14.huijiwiki.com/wiki/物品:${modalColor.name}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline' }}
            >
              {modalColor.name}
            </a>
          </p>
          <p>{modalColor.color}</p>
        </div>
      </Modal>
    </>
  )
}

export default GamePage
