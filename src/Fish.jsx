import { useState, useEffect, useRef } from "react";
import "./App.css";

export default function Fish({ fish, allFishes, paused, onRemove, onModeChange }) {
    const SPEED_FACTOR = 1.7;//速度調整用

    const OUTER_RANGE = 90;//感知範囲
    const INNER_RANGE = 55;//衝突範囲

    const ESCAPE_SIDE_PUSH = 6;//回避時の横移動補正
    const ESCAPE_BOOST = 2.5;//回避時の速度ブースト

    const [x, setX] = useState(fish.x);//xの位置
    const [y, setY] = useState(fish.y);//yの位置
    const [direction, setDirection] = useState(fish.direction);//向き（1:右、-1:左）
    const [angle, setAngle] = useState(0);//回転角度（ラジアン）
    const [speed, setSpeed] = useState(fish.speed);//速度

    const [targetAngle, setTargetAngle] = useState(0);//目標角度
    const [targetSpeed, setTargetSpeed] = useState(fish.speed);//目標速度

    const [xBoost, setXBoost] = useState(0);//横移動補正
    const [yBoost, setYBoost] = useState(0);//縦移動補正

    const [danger, setDanger] = useState(0);//接近段階の危険度
    const [stuckTime, setStuckTime] = useState(0);//接近時間

    const [baseEffect, setBaseEffect] = useState(null);//基本エフェクト種類
    const [activeEffect, setActiveEffect] = useState(null);//発動中エフェクト種類

    const frameRef = useRef(null);//animation frame ID
    const fishRef = useRef(null);//魚のDOM参照

    //魚の中心座標を常に最新に保つ
    const posRef = useRef({ x: fish.x + 40, y: fish.y + 40 });//魚の中心座標参照
    useEffect(() => {
        posRef.current = { x: x + 40, y: y + 40 };
    }, [x, y]);//魚の中心座標更新

    const centerX = x + 40;//魚の中心X座標
    const centerY = y + 40;//魚の中心Y座標

    //エフェクト種類
    useEffect(() => {
        if (fish.type === "deep") {
            setBaseEffect("gloomy");//深海魚のクリックエフェクト
        } else {
            const effects = ["sparkle", "stars", "particles"];//浅海魚のクリックエフェクト候補
            setBaseEffect(effects[Math.floor(Math.random() * effects.length)]);//ランダム選択
        }
    }, [fish.type]);

    //クリック
    function handleClick() {
        if (!baseEffect) return;
        setActiveEffect(baseEffect);//エフェクト発動
        setTimeout(() => setActiveEffect(null), 600);//エフェクト解除とその時間
    }

    //fairy-particle（effect-layer に描画）
    function spawnFairyParticle() {
        const layer = document.getElementById("effect-layer");//エフェクト専用レイヤー取得
        if (!layer) return;//レイヤーがなければ中止

        const { x: cx, y: cy } = posRef.current;//魚の中心座標取得

        const startX = cx + (Math.random() * 30 - 15);//キラキラのx座標を少しランダムにずらす
        const startY = cy + (Math.random() * 30 - 15);//キラキラのy座標を少しランダムにずらす

        const dx = Math.random() * 20 - 10;//キラキラの移動x距離
        const dy = Math.random() * 12 - 6;//キラキラの移動y距離

        const img =
            fish.type === "deep"
                ? "/fish/ひし形との組み合わせ黒.png"
                : "/fish/ひし形との組み合わせ光.png";//キラキラ画像選択

        const particle = document.createElement("div");//キラキラ要素作成
        particle.className = "fairy-particle";//クラス名設定
        particle.style.left = `${startX}px`;//キラキラの位置設定
        particle.style.top = `${startY}px`;//キラキラの位置設定
        particle.style.setProperty("--dx", `${dx}px`);//移動x距離設定
        particle.style.setProperty("--dy", `${dy}px`);//移動y距離設定
        particle.style.backgroundImage = `url(${img})`;//背景画像設定
        particle.style.position = "absolute";//位置指定方法設定
        particle.style.width = "20px";//キラキラの幅
        particle.style.height = "20px";//キラキラの高さ
        particle.style.zIndex = "999999";//最前面に表示

        layer.appendChild(particle);//レイヤーにキラキラ追加

        setTimeout(() => particle.remove(), 600);//1秒後にキラキラ削除
    }

    //interval は 1 回だけ作る（centerX/centerY に依存させない）
    useEffect(() => {
        const id = setInterval(spawnFairyParticle, 140);
        return () => clearInterval(id);
    }, [fish.type]);//魚の種類が変わったら interval を再作成

    //Separation（重なり解消）
    function applySeparation() {
        for (const other of allFishes) {
            if (other.id === fish.id) continue;//自分自身は無視

            const ox = other.x + 40;//他の魚の中心X座標
            const oy = other.y + 40;//他の魚の中心Y座標

            const dx = centerX - ox;//X距離
            const dy = centerY - oy;//Y距離
            const dist = Math.sqrt(dx * dx + dy * dy);//距離

            if (dist < 50) {
                const push = (50 - dist) * 0.15;//重なったら跳ね返す力
                const nx = dx / (dist || 1);//正規化X成分
                const ny = dy / (dist || 1);//正規化Y成分

                setX(prev => prev + nx * push);//X位置修正
                setY(prev => prev + ny * push);//Y位置修正
            }
        }
    }

    //Spatial Hash（高速衝突判定）
    function getCollisionInfo() {
        const cellSize = 100;//セルサイズ

        const cellX = Math.floor(centerX / cellSize);//自分のセルX座標
        const cellY = Math.floor(centerY / cellSize);//自分のセルY座標

        const neighbors = [];//隣接セルキーリスト
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                neighbors.push(`${cellX + dx},${cellY + dy}`);//隣接セルキー追加
            }
        }//隣接セルキーリスト作成

        const grid = new Map();//空のグリッド作成
        for (const other of allFishes) {
            const ox = other.x + 40;//他の魚の中心X座標
            const oy = other.y + 40;//他の魚の中心Y座標

            const cx = Math.floor(ox / cellSize);//セルX座標
            const cy = Math.floor(oy / cellSize);//セルY座標
            const key = `${cx},${cy}`; //セルキー

            if (!grid.has(key)) grid.set(key, []);//セルがなければ初期化
            grid.get(key).push(other);//セルに魚を追加
        }

        let dangerGain = 0;//接近危険度増加量
        let closest = null;//最も近い魚情報

        for (const key of neighbors) {
            const list = grid.get(key);//隣接セルの魚リスト取得
            if (!list) continue;//魚がいなければスキップ

            for (const other of list) {
                if (other.id === fish.id) continue;//自分自身は無視

                const ox = other.x + 40;//他の魚の中心X座標
                const oy = other.y + 40;//他の魚の中心Y座標

                const dx = centerX - ox;//X距離
                const dy = (centerY - oy) * 1.8;//Y距離（縦方向を強調）
                const dist = Math.sqrt(dx * dx + dy * dy);//距離

                if (dist < OUTER_RANGE) {
                    dangerGain += 1;
                    closest = { other, myY: centerY, otherY: oy };
                }//接近判定
                if (dist < INNER_RANGE) {
                    dangerGain += 5;
                    closest = { other, myY: centerY, otherY: oy };
                }//衝突判定
            }
        }

        return { dangerGain, closest };
    }

    //requestAnimationFrame ループ
    useEffect(() => {
        function loop() {
            if (!paused) {
                if (fish.mode === "normal") updateNormal();
                else if (fish.mode === "enter") updateEnter();
                else if (fish.mode === "exit") updateExit();
            }
            frameRef.current = requestAnimationFrame(loop);
        }// loop 関数定義

        frameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameRef.current);
    }, [paused, fish.mode, direction, x, y, speed, angle]);// 依存配列

    //ENTER
    function updateEnter() {
        const enterSpeed = fish.speed * 3 * SPEED_FACTOR;//入り速度
        const nextX = x + enterSpeed * direction;//次のX位置

        if (direction === 1 && nextX >= 0) {
            onModeChange(fish.id, "normal");
        }//右向きで画面内に入ったらNORMALへ
        if (direction === -1 && nextX <= window.innerWidth - 80) {
            onModeChange(fish.id, "normal");
        }//左向きで画面内に入ったらNORMALへ

        setX(nextX);
    }

    //EXIT
    function updateExit() {
        const exitSpeed = fish.speed * 2.5 * SPEED_FACTOR;//出速度
        const nextX = x + exitSpeed * direction;//次のX位置

        if (nextX < -800 || nextX > window.innerWidth + 800) {
            onRemove(fish.id);//画面外に出たら削除
            return;
        }

        setX(nextX);
    }

    //NORMAL（回避＋分離）
    function updateNormal() {
        const maxX = window.innerWidth - 80;//画面最大X座標
        const maxY = window.innerHeight - 80;//画面最大Y座標

        applySeparation();//重なり解消

        let newAngle = angle;//新しい角度
        let newSpeed = speed;//新しい速度

        if (Math.random() < 0.01) {
            setTargetAngle((Math.random() * 10 - 5) * (Math.PI / 180));
        }//ランダムに目標角度を変える
        newAngle += (targetAngle - newAngle) * 0.20;

        if (Math.random() < 0.01) {
            setTargetSpeed(0.8 + Math.random() * 0.6);
        }//ランダムに目標速度を変える
        newSpeed += (targetSpeed - newSpeed) * 0.03;

        const info = getCollisionInfo();//衝突情報取得
        if (info) {//* 接近・衝突している魚がいる場合 */
            const { dangerGain, closest } = info;

            setDanger(prev => Math.max(0, prev * 0.9 + dangerGain));

            if (closest) {//* 最も近い魚に基づいて回避行動 */
                const { other, myY, otherY } = closest;

                let ySign = myY < otherY ? -1 : 1;

                if (direction !== other.direction) {//* 逆方向に向かっている場合 */
                    if (speed < other.speed) {
                        ySign = 1;
                        newSpeed *= 0.7;
                    } else {//* 自分の方が速い場合 */
                        ySign = -1;
                        newSpeed *= 1.3;
                    }
                } else {//* 同じ方向に向かっている場合 */
                    if (speed < other.speed) ySign = 1;
                    else ySign = -1;
                }

                let angleStrength = Math.PI / 6;
                let xStrength = 1.5;
                let yStrength = 0.8;

                if (danger > 5) {//** 危険度に応じて回避力強化 */
                    angleStrength = Math.PI / 4;
                    xStrength = 2.0;
                    yStrength = 1.2;
                }
                if (danger > 15) {//*** より高い危険度 */
                    angleStrength = Math.PI / 3;
                    xStrength = 3.0;
                    yStrength = 1.5;
                }

                const avoidAngle = newAngle + ySign * angleStrength;

                let sidePush = 0;
                if (ySign === -1) {//* 上方向に避ける場合 */
                    sidePush = direction === 1 ? -1.5 : 1.5;
                } else {//** 下方向に避ける場合 */
                    sidePush = direction === 1 ? 1.5 : -1.5;
                }

                const xVec = Math.cos(avoidAngle) * xStrength + sidePush;
                const yVec = Math.sin(avoidAngle) * yStrength;

                if (xBoost === 0 && yBoost === 0) {//* 一度に一回だけ回避ベクトルをセット */
                    setXBoost(xVec);
                    setYBoost(yVec);

                    setTimeout(() => {
                        setXBoost(0);
                        setYBoost(0);
                    }, 300);
                }

                newSpeed *= 0.4;
            }
        }

        if (info && info.closest) {//* * 長時間接近・衝突している場合の緊急回避 */
            const { other } = info.closest;

            const dx = centerX - (other.x + 40);
            const dy = centerY - (other.y + 40);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < INNER_RANGE) {//** 衝突範囲内なら接近時間を増加 */
                setStuckTime(prev => prev + 1);
            } else {//  ** 衝突範囲外なら接近時間リセット */
                setStuckTime(0);
            }

            if (stuckTime > 8) {//* *** 一定時間以上接近・衝突していたら緊急回避行動 */
                const escapeAngle =
                    newAngle + (direction === 1 ? Math.PI / 2 : -Math.PI / 2);

                const sidePush =
                    direction === 1 ? ESCAPE_SIDE_PUSH : -ESCAPE_SIDE_PUSH;

                const xVec = Math.cos(escapeAngle) * 3 + sidePush;
                const yVec = Math.sin(escapeAngle) * 3;

                setXBoost(xVec);
                setYBoost(yVec);

                setSpeed(prev => prev * ESCAPE_BOOST);

                setDanger(0);

                setTimeout(() => {
                    setXBoost(0);
                    setYBoost(0);
                }, 200);

                setStuckTime(0);
            }
        }

        setX(prev => {//X位置更新
            const nextX =
                prev +
                newSpeed * SPEED_FACTOR * Math.cos(newAngle) * direction +
                xBoost;

            if (nextX > maxX) {//画面外に出そうなら反転
                setDirection(-1);
                return maxX;
            }
            if (nextX < 0) {//画面外に出そうなら反転
                setDirection(1);
                return 0;
            }
            return nextX;
        });

        setY(prevY => {//Y位置更新
            const nextY =
                prevY +
                newSpeed * SPEED_FACTOR * Math.sin(newAngle) +
                yBoost;

            if (nextY > maxY) return maxY;//画面外に出そうなら止める
            if (nextY < 0) return 0;//画面外に出そうなら止める
            return nextY;
        });

        setAngle(newAngle);
        setSpeed(newSpeed);
    }

    return (
        <>
            {/* 魚コンテナ */}
            <div
                ref={fishRef}
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: "80px",
                    height: "80px",
                    zIndex: 20,
                }}
                onClick={handleClick}
                onTouchStart={handleClick}
                onContextMenu={(e) => e.preventDefault()}
            >
                <img
                    src={fish.img}
                    alt=""
                    draggable="false"
                    style={{
                        width: "80px",
                        height: "80px",
                        pointerEvents: "none",
                        position: "absolute",
                        zIndex: 10,
                        transform: `rotate(${angle}rad) scaleX(${direction * -1})`,
                        transformOrigin: "center center",
                    }}
                />
            </div>

            {/* sparkle */}
            {activeEffect === "sparkle" && (
                <div
                    className="sparkle-effect"
                    style={{ left: centerX, top: centerY, zIndex: 9999 }}
                />
            )}

            {/* stars */}
            {activeEffect === "stars" && (
                <div
                    className="star-container"
                    style={{ left: centerX, top: centerY, zIndex: 9999 }}
                >
                    <div className="star star1" />
                    <div className="star star2" />
                    <div className="star star3" />
                    <div className="star star4" />
                    <div className="star star5" />
                </div>
            )}

            {/* particles */}
            {activeEffect === "particles" && (
                <div
                    className="particle-container"
                    style={{ left: centerX, top: centerY, zIndex: 9999 }}
                >
                    <div className="particle particle1" />
                    <div className="particle particle2" />
                    <div className="particle particle3" />
                    <div className="particle particle4" />
                    <div className="particle particle5" />
                </div>
            )}

            {/* gloomy */}
            {activeEffect === "gloomy" && (
                <div
                    className="gloomy-effect"
                    style={{ left: centerX, top: centerY, zIndex: 9999 }}
                />
            )}
        </>
    );
}