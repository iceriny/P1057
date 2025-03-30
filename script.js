// DOM元素
const themeToggle = document.getElementById("theme-toggle");
const studentCountSelect = document.getElementById("student-count");
const passCountSelect = document.getElementById("pass-count");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const circleContainer = document.getElementById("circle-container");
let dpTableContainer = document.getElementById("dp-table-container"); // 使用let而不是const
const resultElement = document.getElementById("result");

// 初始配置
let studentCount = parseInt(studentCountSelect.value);
let passCount = parseInt(passCountSelect.value);
let dp = []; // 动态规划表
let isAnimating = false; // 是否正在动画中
let currentStep = 0; // 当前演示步骤
let animationInterval = null; // 动画定时器
let isPaused = false; // 是否暂停

// 在DOM加载后确保引用有效
document.addEventListener("DOMContentLoaded", function () {
    // 重新获取重要引用
    if (!dpTableContainer) {
        dpTableContainer = document.getElementById("dp-table-container");
        console.log("DOMContentLoaded: 重新获取dpTableContainer引用");
    }
});

// 主题切换
themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
});

// 事件绑定
studentCountSelect.addEventListener("change", () => {
    studentCount = parseInt(studentCountSelect.value);
    resetVisualization();
    drawStudentCircle(studentCount);
    initDPTable(); // 确保表格重新创建
});

passCountSelect.addEventListener("change", () => {
    passCount = parseInt(passCountSelect.value);
    resetVisualization();
    initDPTable(); // 确保表格重新创建
});

startBtn.addEventListener("click", startFullDemo);
pauseBtn.addEventListener("click", togglePause);
prevBtn.addEventListener("click", prevStep);
nextBtn.addEventListener("click", nextStep);

// 开始完整演示
function startFullDemo() {
    resetVisualization();
    currentStep = 0;
    isPaused = false;

    // 确保学生圆圈已绘制
    drawStudentCircle(studentCount);

    // 初始化DP数组
    dp = Array(passCount + 1)
        .fill()
        .map(() => Array(studentCount + 1).fill(0));
    dp[0][1] = 1;

    // 初始化表格
    initDPTable();

    // 预先计算所有DP值，确保表格数据完整
    computeAllDPValues();

    // 将计算的DP值填充到表格中
    fillDPTable();

    // 添加初始小球
    addBall(1);

    // 启用控制按钮
    pauseBtn.disabled = false;
    prevBtn.disabled = false;
    nextBtn.disabled = false;

    // 短暂延迟后开始，确保UI已更新
    setTimeout(() => {
        // 开始自动播放
        startAutoPlay();
    }, 300);
}

// 预先计算所有DP值
function computeAllDPValues() {
    // 确保dp数组已正确初始化
    if (dp.length === 0) {
        dp = Array(passCount + 1)
            .fill()
            .map(() => Array(studentCount + 1).fill(0));
        dp[0][1] = 1;
        console.log("重新初始化dp数组");
    }

    // 计算所有DP值
    for (let i = 1; i <= passCount; i++) {
        for (let j = 1; j <= studentCount; j++) {
            // 计算左右邻居
            let left = j - 1;
            if (left === 0) left = studentCount;

            let right = j + 1;
            if (right === studentCount + 1) right = 1;

            // 计算DP值
            dp[i][j] = dp[i - 1][left] + dp[i - 1][right];
        }
    }

    console.log("DP计算完成:", dp);
}

// 开始自动播放
function startAutoPlay() {
    if (animationInterval) {
        clearInterval(animationInterval);
    }

    animationInterval = setInterval(() => {
        if (!isPaused && currentStep < passCount * studentCount) {
            nextStep();
        } else if (currentStep >= passCount * studentCount) {
            clearInterval(animationInterval);
            resultElement.textContent = dp[passCount][1];

            // 如果有多条路径，显示多条路径
            if (dp[passCount][1] > 1) {
                setTimeout(() => {
                    showMultiplePaths();
                }, 1000);
            }
        }
    }, 2000); // 增加间隔到2000毫秒，使动画更容易观察
}

// 切换暂停状态
function togglePause() {
    isPaused = !isPaused;
    pauseBtn.innerHTML = isPaused
        ? '<i class="fas fa-play mr-2"></i>继续'
        : '<i class="fas fa-pause mr-2"></i>暂停';
}

// 上一步
function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        updateVisualization();
    }
}

// 下一步
function nextStep() {
    if (currentStep < passCount * studentCount) {
        currentStep++;
        updateVisualization();
    }
}

// 更新可视化
function updateVisualization() {
    const i = Math.floor(currentStep / studentCount) + 1;
    const j = (currentStep % studentCount) + 1;

    if (i > passCount) return;

    // 计算左右邻居
    let left = j - 1;
    if (left === 0) left = studentCount;

    let right = j + 1;
    if (right === studentCount + 1) right = 1;

    // 高亮当前状态及其依赖
    highlightCurrentCalculation(i, j, left, right);

    // 更新小球位置和动画
    animateBallTransfer(i, j, left, right);

    // 高亮左右邻居
    highlightPointers(j);

    // 显示状态转移箭头
    showStateTransitionArrows(i, j, left, right);

    // 确保dp表格已经计算完成
    if (dp[i] === undefined || dp[i][j] === undefined) {
        console.error(`dp[${i}][${j}]未定义，重新计算DP值`);
        computeAllDPValues();
    }

    // 更新表格中的值
    const cell = document.getElementById(`dp-${i}-${j}`);
    if (cell) {
        // 确保清除之前的公式
        while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }

        // 设置主要文本内容
        cell.textContent = dp[i][j];
        cell.classList.add(
            "highlighted-cell",
            "bg-yellow-100",
            "dark:bg-yellow-900"
        );

        // 显示状态转移公式
        const formula = document.createElement("div");
        formula.className = "text-xs text-gray-500 dark:text-gray-400 mt-1";
        formula.innerHTML = `= ${dp[i - 1][left]} + ${dp[i - 1][right]}`;
        cell.appendChild(formula);

        // 添加调试日志
        console.log(`更新单元格(${i},${j}): ${dp[i][j]}`);
    } else {
        console.error(`未找到单元格: dp-${i}-${j}`);
        // 尝试重新初始化表格
        console.log("尝试重新初始化表格");
        initDPTable();
        // 再次尝试获取单元格
        const newCell = document.getElementById(`dp-${i}-${j}`);
        if (newCell) {
            newCell.textContent = dp[i][j];
            newCell.classList.add(
                "highlighted-cell",
                "bg-yellow-100",
                "dark:bg-yellow-900"
            );
            console.log(`重新初始化后更新单元格成功: dp-${i}-${j}`);
        }
    }

    // 当完成所有计算后，显示最终结果和多条路径
    if (currentStep >= passCount * studentCount) {
        resultElement.textContent = dp[passCount][1];

        // 如果有多条路径，在计算完成后展示
        if (dp[passCount][1] > 1) {
            showMultiplePaths();
        }
    }
}

// 添加小球动画效果
function animateBallTransfer(i, j, left, right) {
    // 移除现有小球
    const existingBalls = document.querySelectorAll(".ball, .transfer-ball");
    existingBalls.forEach((ball) => safeRemove(ball));

    const currentStudent = document.getElementById(`student-${j}`);
    const leftStudent = document.getElementById(`student-${left}`);
    const rightStudent = document.getElementById(`student-${right}`);

    if (!currentStudent || !leftStudent || !rightStudent) return;

    // 创建当前小球
    const currentBall = createBall(currentStudent, "yellow");
    currentBall.classList.add("ball");
    currentBall.style.zIndex = "15"; // 确保当前球在最上层

    // 创建从左侧传入的小球
    const leftBall = createBall(leftStudent, "blue");
    leftBall.classList.add("transfer-ball", "left-ball");
    leftBall.style.zIndex = "11";

    // 标记左侧球的文本
    const leftLabel = document.createElement("div");
    leftLabel.className =
        "absolute bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-md";
    leftLabel.style.left = leftStudent.style.left;
    leftLabel.style.top = `calc(${leftStudent.style.top} - 30px)`;
    leftLabel.style.transform = "translate(-50%, -50%)";
    leftLabel.style.zIndex = "20";
    leftLabel.textContent = "左传球";
    circleContainer.appendChild(leftLabel);

    // 标记右侧球的文本
    const rightLabel = document.createElement("div");
    rightLabel.className =
        "absolute bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-md";
    rightLabel.style.left = rightStudent.style.left;
    rightLabel.style.top = `calc(${rightStudent.style.top} - 30px)`;
    rightLabel.style.transform = "translate(-50%, -50%)";
    rightLabel.style.zIndex = "20";
    rightLabel.textContent = "右传球";
    circleContainer.appendChild(rightLabel);

    // 创建从右侧传入的小球
    const rightBall = createBall(rightStudent, "green");
    rightBall.classList.add("transfer-ball", "right-ball");
    rightBall.style.zIndex = "12";

    // 动画左侧球移动
    animateBallMovement(
        leftBall,
        leftStudent,
        currentStudent,
        "left",
        leftLabel
    );

    // 动画右侧球移动
    animateBallMovement(
        rightBall,
        rightStudent,
        currentStudent,
        "right",
        rightLabel
    );
}

// 创建小球
function createBall(student, color) {
    const ball = document.createElement("div");
    const size = color === "yellow" ? "24px" : "20px";

    ball.className = `absolute rounded-full shadow-lg`;
    ball.style.backgroundColor = color;
    ball.style.border = `2px solid ${color}`;
    ball.style.width = size;
    ball.style.height = size;
    ball.style.left = student.style.left;
    ball.style.top = student.style.top;
    ball.style.transform = "translate(-50%, -50%)";
    ball.style.opacity = "0"; // 初始透明
    circleContainer.appendChild(ball);

    // 添加出现动画，确保元素在DOM中
    try {
        gsap.to(ball, {
            opacity: 1,
            scale: 1.2,
            duration: 0.3,
            ease: "back.out",
            onComplete: () => {
                try {
                    gsap.to(ball, {
                        scale: 1,
                        duration: 0.2,
                    });
                } catch (e) {
                    console.error("小球缩放动画错误:", e);
                }
            },
        });
    } catch (e) {
        console.error("小球创建动画错误:", e);
        // 确保即使动画失败小球也是可见的
        ball.style.opacity = "1";
    }

    return ball;
}

// 动画小球移动
function animateBallMovement(ball, fromStudent, toStudent, direction, label) {
    const fromRect = fromStudent.getBoundingClientRect();
    const toRect = toStudent.getBoundingClientRect();
    const containerRect = circleContainer.getBoundingClientRect();

    const startX = (fromRect.left + fromRect.right) / 2 - containerRect.left;
    const startY = (fromRect.top + fromRect.bottom) / 2 - containerRect.top;
    const endX = (toRect.left + toRect.right) / 2 - containerRect.left;
    const endY = (toRect.top + toRect.bottom) / 2 - containerRect.top;

    // 计算控制点（更明显的弧形路径）
    // 方向不同，弧度方向不同
    const midX = (startX + endX) / 2;
    const arcHeight = direction === "left" ? -50 : -70;
    const midY = (startY + endY) / 2 + arcHeight;

    // 为箭头创建唯一ID
    const pathId = `ball-path-${direction}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    const arrowId = `arrow-${direction}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

    // 创建SVG路径
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
        "d",
        `M ${startX},${startY} Q ${midX},${midY} ${endX},${endY}`
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", direction === "left" ? "#3b82f6" : "#10b981");
    path.setAttribute("stroke-width", "3");

    // 箭头指示 - 使用唯一ID
    path.setAttribute("marker-end", `url(#${arrowId})`);

    // 显示轨迹
    if (direction === "left") {
        path.setAttribute("stroke-dasharray", "4,4");
    } else {
        path.setAttribute("stroke-dasharray", "6,3");
    }

    path.setAttribute("opacity", "0.8");
    path.setAttribute("id", pathId);

    // 添加到SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", `ball-path-svg ${direction}-path`);
    svg.style.position = "absolute";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "5";

    // 添加箭头标记 - 使用唯一ID
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "marker"
    );
    marker.setAttribute("id", arrowId);
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "7");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");

    const polygon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polygon"
    );
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
    polygon.setAttribute("fill", direction === "left" ? "#3b82f6" : "#10b981");

    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    svg.appendChild(path);
    circleContainer.appendChild(svg);

    // 创建小球副本，让原始小球可以稍后淡出
    const ballClone = ball.cloneNode(true);
    ballClone.style.opacity = "0";
    circleContainer.appendChild(ballClone);

    // 使用基本的GSAP动画
    const pathLength = path.getTotalLength();

    // 初始化位置
    const startPoint = path.getPointAtLength(0);
    ball.style.left = startPoint.x + "px";
    ball.style.top = startPoint.y + "px";

    // 创建一个动画进度对象，供GSAP操作
    const progressObj = { progress: 0 };

    // 开始动画 - 修复GSAP fromTo调用
    gsap.fromTo(
        progressObj, // 正确的目标对象
        { progress: 0 },
        {
            progress: 1,
            duration: 1.2, // 增加动画时间以更清晰显示
            ease: "power2.inOut",
            onUpdate: function () {
                const progress = progressObj.progress;
                const point = path.getPointAtLength(progress * pathLength);
                ball.style.left = point.x + "px";
                ball.style.top = point.y + "px";

                // 同步更新标签位置
                if (label) {
                    label.style.left = ball.style.left;
                    const labelY = parseFloat(point.y) - 20;
                    label.style.top = `${labelY}px`;
                }
            },
            onComplete: () => {
                try {
                    // 到达目标后，淡出动画
                    gsap.to(ball, {
                        opacity: 0,
                        duration: 0.3,
                        onComplete: () => {
                            safeRemove(ball);
                        },
                    });

                    // 让目标位置的小球显示
                    gsap.to(ballClone, {
                        opacity: 1,
                        duration: 0.3,
                    });

                    // 轨迹淡出
                    gsap.to(svg, {
                        opacity: 0,
                        duration: 0.5,
                        delay: 3, // 保持轨迹显示更长时间
                        onComplete: () => {
                            safeRemove(svg);
                        },
                    });

                    // 标签淡出
                    if (label) {
                        gsap.to(label, {
                            opacity: 0,
                            duration: 0.5,
                            delay: 3,
                            onComplete: () => {
                                safeRemove(label);
                            },
                        });
                    }
                } catch (e) {
                    console.error("动画完成回调错误:", e);
                }
            },
        }
    );
}

// 重置可视化
function resetVisualization() {
    // 重置DP表格
    dp = [];

    // 重置dpTableContainer
    if (dpTableContainer) {
        // 保存容器引用
        const container = dpTableContainer.parentNode;
        // 清空容器
        dpTableContainer.innerHTML = "";
        // 确保引用没丢失
        if (!document.getElementById("dp-table-container")) {
            console.warn("dp-table-container引用丢失，重新获取");
            dpTableContainer =
                document.getElementById("dp-table-container") || container;
        }
    }

    resultElement.textContent = "-";

    // 重置控制状态
    currentStep = 0;
    isPaused = false;
    isAnimating = false;

    // 重置按钮状态
    pauseBtn.disabled = true;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    pauseBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>暂停';

    // 清除动画定时器
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }

    // 重置小球
    const ball = document.querySelector(".ball");
    if (ball) safeRemove(ball);

    // 移除所有高亮和箭头
    clearAllHighlights();
}

// 新增：安全移除DOM元素的辅助函数
function safeRemove(element) {
    if (element && element.parentNode) {
        try {
            element.parentNode.removeChild(element);
        } catch (e) {
            console.error("安全移除元素失败:", e);
        }
    }
}

// 清除所有高亮和箭头
function clearAllHighlights() {
    document
        .querySelectorAll(
            ".highlighted, .state-transition-arrow, .pointer-indicator, .ball-path-svg, .transfer-ball"
        )
        .forEach((el) => {
            safeRemove(el);
        });

    // 移除标签元素
    document.querySelectorAll(".bg-blue-500, .bg-green-500").forEach((el) => {
        if (
            el.textContent === "左传球" ||
            el.textContent === "右传球" ||
            el.textContent === "左邻居" ||
            el.textContent === "右邻居"
        ) {
            safeRemove(el);
        }
    });

    // 清除学生节点上的高亮环
    document.querySelectorAll(".circle-student").forEach((el) => {
        el.classList.remove(
            "ring-2",
            "ring-4",
            "ring-blue-500",
            "dark:ring-blue-400",
            "ring-green-500",
            "dark:ring-green-400",
            "ring-yellow-500",
            "dark:ring-yellow-400"
        );
    });

    document.querySelectorAll(".highlighted-cell").forEach((el) => {
        el.classList.remove(
            "highlighted-cell",
            "bg-yellow-100",
            "dark:bg-yellow-900",
            "bg-blue-100",
            "dark:bg-blue-900",
            "bg-green-100",
            "dark:bg-green-900"
        );

        // 移除状态转移公式
        const formula = el.querySelector(".text-xs");
        if (formula) {
            safeRemove(formula);
        }
    });
}

// 绘制学生圆圈
function drawStudentCircle(n) {
    circleContainer.innerHTML = "";

    const centerX = "50%";
    const centerY = "50%";
    const radius = "40%";

    // 添加中心文字
    const centerLabel = document.createElement("div");
    centerLabel.className =
        "absolute flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium";
    centerLabel.style.left = centerX;
    centerLabel.style.top = centerY;
    centerLabel.style.transform = "translate(-50%, -50%)";
    centerLabel.textContent = "传球游戏";
    circleContainer.appendChild(centerLabel);

    // 创建学生节点
    for (let i = 1; i <= n; i++) {
        const angle = (i - 1) * ((2 * Math.PI) / n) - Math.PI / 2; // 从上方开始
        const x = 50 + 40 * Math.cos(angle);
        const y = 50 + 40 * Math.sin(angle);

        const student = document.createElement("div");
        student.className =
            "circle-student absolute flex items-center justify-center rounded-full cursor-pointer";
        student.id = `student-${i}`;
        student.style.width = "50px";
        student.style.height = "50px";
        student.style.left = `${x}%`;
        student.style.top = `${y}%`;
        student.style.transform = "translate(-50%, -50%)";

        // 小蛮(1号)特殊样式
        if (i === 1) {
            student.classList.add("bg-primary-500", "text-white");
            student.dataset.name = "小蛮";
        } else {
            student.classList.add(
                "bg-gray-200",
                "dark:bg-gray-700",
                "text-gray-700",
                "dark:text-gray-300"
            );
            student.dataset.name = `${i}号`;
        }

        student.innerHTML = `<span>${i}</span>`;

        // 提示信息
        const tooltip = document.createElement("div");
        tooltip.className =
            "absolute opacity-0 bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none transition-opacity";
        tooltip.style.top = "-25px";
        tooltip.style.left = "50%";
        tooltip.style.transform = "translateX(-50%)";
        tooltip.textContent = i === 1 ? "小蛮" : `${i}号同学`;

        student.appendChild(tooltip);

        student.addEventListener("mouseenter", () => {
            tooltip.classList.remove("opacity-0");
            tooltip.classList.add("opacity-100");
        });

        student.addEventListener("mouseleave", () => {
            tooltip.classList.remove("opacity-100");
            tooltip.classList.add("opacity-0");
        });

        circleContainer.appendChild(student);
    }

    // 连接学生节点，显示圆圈结构
    drawConnectionLines(n);

    // 初始化添加小球到小蛮位置
    addBall(1);
}

// 绘制连接线，清晰展示圆形结构
function drawConnectionLines(n) {
    // 移除现有SVG
    const existingSvg = circleContainer.querySelector(".connection-lines-svg");
    if (existingSvg) {
        existingSvg.remove();
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.classList.add(
        "connection-lines-svg",
        "absolute",
        "top-0",
        "left-0",
        "z-0",
        "pointer-events-none"
    );

    // 等待DOM渲染完成再获取位置
    setTimeout(() => {
        for (let i = 1; i <= n; i++) {
            const student1 = document.getElementById(`student-${i}`);
            const student2 = document.getElementById(
                `student-${i === n ? 1 : i + 1}`
            );

            if (student1 && student2) {
                const rect1 = student1.getBoundingClientRect();
                const rect2 = student2.getBoundingClientRect();
                const containerRect = circleContainer.getBoundingClientRect();

                const x1 = (rect1.left + rect1.right) / 2 - containerRect.left;
                const y1 = (rect1.top + rect1.bottom) / 2 - containerRect.top;
                const x2 = (rect2.left + rect2.right) / 2 - containerRect.left;
                const y2 = (rect2.top + rect2.bottom) / 2 - containerRect.top;

                const line = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );
                line.setAttribute("x1", x1);
                line.setAttribute("y1", y1);
                line.setAttribute("x2", x2);
                line.setAttribute("y2", y2);
                line.setAttribute("stroke", "rgba(156, 163, 175, 0.3)"); // 淡灰色
                line.setAttribute("stroke-width", "2");
                line.setAttribute("stroke-dasharray", "4");

                svg.appendChild(line);
            }
        }
    }, 100); // 短暂延迟确保DOM已经渲染好

    circleContainer.appendChild(svg);
}

// 添加小球
function addBall(studentId) {
    // 移除现有小球
    const existingBall = document.querySelector(".ball");
    if (existingBall) safeRemove(existingBall);

    const student = document.getElementById(`student-${studentId}`);
    if (!student) return;

    const ball = document.createElement("div");
    ball.className =
        "ball absolute rounded-full bg-yellow-400 dark:bg-yellow-500 shadow-lg";
    ball.style.width = "20px";
    ball.style.height = "20px";
    ball.style.left = student.style.left;
    ball.style.top = student.style.top;
    ball.style.transform = "translate(-50%, -50%)";
    ball.style.zIndex = "10";
    ball.style.opacity = "0"; // 初始透明

    circleContainer.appendChild(ball);

    // 添加出现动画
    try {
        gsap.to(ball, {
            opacity: 1,
            scale: 1.2,
            duration: 0.5,
            ease: "back.out",
            onComplete: () => {
                try {
                    gsap.to(ball, {
                        scale: 1,
                        duration: 0.2,
                    });
                } catch (e) {
                    console.error("小球缩放动画错误:", e);
                }
            },
        });
    } catch (e) {
        console.error("小球添加动画错误:", e);
        // 确保即使动画失败小球也是可见的
        ball.style.opacity = "1";
    }
}

// 高亮左右邻居（双指针）
function highlightPointers(studentId) {
    // 移除现有指针指示器
    document
        .querySelectorAll(".pointer-indicator")
        .forEach((el) => el.remove());

    const n = studentCount;
    // 计算左右邻居
    let left = studentId - 1;
    if (left === 0) left = n;

    let right = studentId + 1;
    if (right === n + 1) right = 1;

    // 创建左邻居指示器
    createPointerIndicator(left, "left");

    // 创建右邻居指示器
    createPointerIndicator(right, "right");

    // 高亮左右邻居节点
    const leftStudent = document.getElementById(`student-${left}`);
    const rightStudent = document.getElementById(`student-${right}`);
    const currentStudent = document.getElementById(`student-${studentId}`);

    if (leftStudent) {
        leftStudent.classList.add(
            "ring-4",
            "ring-blue-500",
            "dark:ring-blue-400"
        );
    }

    if (rightStudent) {
        rightStudent.classList.add(
            "ring-4",
            "ring-green-500",
            "dark:ring-green-400"
        );
    }

    if (currentStudent) {
        currentStudent.classList.add(
            "ring-4",
            "ring-yellow-500",
            "dark:ring-yellow-400"
        );
    }
}

// 创建指针指示器
function createPointerIndicator(studentId, type) {
    const student = document.getElementById(`student-${studentId}`);
    if (!student) return;

    const indicator = document.createElement("div");
    indicator.className =
        "pointer-indicator absolute flex items-center justify-center text-xs font-bold z-20";

    // 不同类型使用不同颜色
    if (type === "left") {
        indicator.classList.add("bg-blue-500", "text-white");
        indicator.innerHTML = "左邻居";
    } else {
        indicator.classList.add("bg-green-500", "text-white");
        indicator.innerHTML = "右邻居";
    }

    indicator.style.width = "auto";
    indicator.style.height = "auto";
    indicator.style.padding = "2px 8px";
    indicator.style.borderRadius = "12px";
    indicator.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";

    // 计算位置 - 在学生节点附近
    const rect = student.getBoundingClientRect();
    const containerRect = circleContainer.getBoundingClientRect();

    // 根据学生在圆上的位置调整标签位置
    // 获取学生的角度位置
    const angle = getStudentAngle(studentId);

    // 确定根据角度确定最佳偏移方向
    let offsetX, offsetY;

    // 上方
    if (angle > 225 && angle < 315) {
        offsetX = 0;
        offsetY = -40;
    }
    // 右侧
    else if (angle >= 315 || angle < 45) {
        offsetX = 40;
        offsetY = 0;
    }
    // 下方
    else if (angle >= 45 && angle < 135) {
        offsetX = 0;
        offsetY = 40;
    }
    // 左侧
    else {
        offsetX = -40;
        offsetY = 0;
    }

    // 为左右指示器稍微分离
    if (type === "left") {
        offsetX -= 10;
        offsetY -= 10;
    } else {
        offsetX += 10;
        offsetY += 10;
    }

    const x =
        (((rect.left + rect.right) / 2 - containerRect.left + offsetX) /
            containerRect.width) *
        100;
    const y =
        (((rect.top + rect.bottom) / 2 - containerRect.top + offsetY) /
            containerRect.height) *
        100;

    indicator.style.left = `${x}%`;
    indicator.style.top = `${y}%`;

    circleContainer.appendChild(indicator);

    // 添加淡入动画
    gsap.fromTo(
        indicator,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.3 }
    );
}

// 获取学生在圆上的角度位置
function getStudentAngle(studentId) {
    const n = studentCount;
    const angle = ((studentId - 1) * (360 / n) - 90) % 360;
    return angle < 0 ? angle + 360 : angle;
}

// 初始化DP表格结构
function initDPTable() {
    console.log(
        "初始化DP表格，studentCount:",
        studentCount,
        "passCount:",
        passCount
    );

    if (!dpTableContainer) {
        console.error("找不到dpTableContainer元素!");
        dpTableContainer = document.getElementById("dp-table-container");
        if (!dpTableContainer) {
            console.error("无法恢复dpTableContainer引用，创建新元素");
            dpTableContainer = document.createElement("div");
            dpTableContainer.id = "dp-table-container";
            document.body.appendChild(dpTableContainer);
        }
    }

    dpTableContainer.innerHTML = "";

    // 创建表格结构
    const table = document.createElement("table");
    table.className = "min-w-full border border-collapse text-center";
    table.id = "dp-table";

    // 创建表头
    const thead = document.createElement("thead");
    thead.className = "bg-gray-100 dark:bg-gray-700";

    const headerRow = document.createElement("tr");

    // 空单元格（左上角）
    const emptyCell = document.createElement("th");
    emptyCell.className = "border border-gray-200 dark:border-gray-700 p-2";
    emptyCell.textContent = "dp[i][j]";
    headerRow.appendChild(emptyCell);

    // 学生编号列头
    for (let j = 1; j <= studentCount; j++) {
        const th = document.createElement("th");
        th.className = "border border-gray-200 dark:border-gray-700 p-2";
        th.textContent = j === 1 ? "小蛮" : `${j}号`;
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 创建表格内容
    const tbody = document.createElement("tbody");
    tbody.id = "dp-table-body";

    // 创建初始行 (i=0)
    const initialRow = document.createElement("tr");
    initialRow.className = "bg-white dark:bg-gray-800";

    // 行头（传球次数）
    const rowHeader = document.createElement("th");
    rowHeader.className =
        "border border-gray-200 dark:border-gray-700 p-2 font-medium";
    rowHeader.textContent = "0次";
    initialRow.appendChild(rowHeader);

    // 初始状态: dp[0][1] = 1, 其他为0
    for (let j = 1; j <= studentCount; j++) {
        const td = document.createElement("td");
        td.className = "border border-gray-200 dark:border-gray-700 p-2";
        td.id = `dp-0-${j}`;

        if (j === 1) {
            td.textContent = "1";
            td.classList.add(
                "bg-primary-100",
                "dark:bg-primary-900",
                "font-bold"
            );
        } else {
            td.textContent = "0";
        }

        initialRow.appendChild(td);
    }

    tbody.appendChild(initialRow);

    // 创建空的表格行 (i=1 到 m)
    for (let i = 1; i <= passCount; i++) {
        const row = document.createElement("tr");
        row.className =
            i % 2 === 0
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-900";
        row.id = `dp-row-${i}`;

        // 行头（传球次数）
        const th = document.createElement("th");
        th.className =
            "border border-gray-200 dark:border-gray-700 p-2 font-medium";
        th.textContent = `${i}次`;
        row.appendChild(th);

        // 空的单元格，初始显示0
        for (let j = 1; j <= studentCount; j++) {
            const td = document.createElement("td");
            td.className = "border border-gray-200 dark:border-gray-700 p-2";
            td.id = `dp-${i}-${j}`;
            td.textContent = "0"; // 显示0作为初始值

            // 最后一行第一列特殊标记（最终结果）
            if (i === passCount && j === 1) {
                td.classList.add(
                    "bg-gray-100",
                    "dark:bg-gray-800",
                    "font-bold"
                );
            }

            row.appendChild(td);
        }

        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    dpTableContainer.appendChild(table);

    // 添加调试日志，验证表格创建成功
    console.log(`DP表格创建完成，共${passCount + 1}行，${studentCount + 1}列`);
    console.log(
        `检查单元格 dp-1-1: ${
            document.getElementById("dp-1-1") ? "存在" : "不存在"
        }`
    );
}

// 高亮当前计算的状态及其依赖
function highlightCurrentCalculation(i, j, left, right) {
    // 清除之前的高亮
    clearAllHighlights();

    // 高亮当前单元格
    const currentCell = document.getElementById(`dp-${i}-${j}`);
    if (currentCell) {
        currentCell.classList.add(
            "highlighted-cell",
            "bg-yellow-100",
            "dark:bg-yellow-900"
        );
    }

    // 高亮依赖的左邻居单元格
    const leftCell = document.getElementById(`dp-${i - 1}-${left}`);
    if (leftCell) {
        leftCell.classList.add(
            "highlighted-cell",
            "bg-blue-100",
            "dark:bg-blue-900"
        );
    }

    // 高亮依赖的右邻居单元格
    const rightCell = document.getElementById(`dp-${i - 1}-${right}`);
    if (rightCell) {
        rightCell.classList.add(
            "highlighted-cell",
            "bg-green-100",
            "dark:bg-green-900"
        );
    }
}

// 显示状态转移箭头，直观展示依赖关系
function showStateTransitionArrows(i, j, left, right) {
    const table = document.getElementById("dp-table");
    if (!table) return;

    const currentCell = document.getElementById(`dp-${i}-${j}`);
    const leftCell = document.getElementById(`dp-${i - 1}-${left}`);
    const rightCell = document.getElementById(`dp-${i - 1}-${right}`);

    if (currentCell && leftCell) {
        drawArrow(leftCell, currentCell, "blue", "从左邻居传球");
    }

    if (currentCell && rightCell) {
        drawArrow(rightCell, currentCell, "green", "从右邻居传球");
    }
}

// 绘制箭头
function drawArrow(fromCell, toCell, color, label) {
    const fromRect = fromCell.getBoundingClientRect();
    const toRect = toCell.getBoundingClientRect();
    const tableRect = document
        .getElementById("dp-table")
        .getBoundingClientRect();

    // 创建SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add(
        "state-transition-arrow",
        "absolute",
        "top-0",
        "left-0",
        "pointer-events-none"
    );
    svg.style.width = `${tableRect.width}px`;
    svg.style.height = `${tableRect.height}px`;
    svg.style.zIndex = "5";

    // 计算箭头坐标
    const fromX = (fromRect.left + fromRect.right) / 2 - tableRect.left;
    const fromY = (fromRect.top + fromRect.bottom) / 2 - tableRect.top;
    const toX = (toRect.left + toRect.right) / 2 - tableRect.left;
    const toY = (toRect.top + toRect.bottom) / 2 - tableRect.top;

    // 计算控制点（弯曲的箭头）
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2 - 20;

    // 生成唯一的箭头ID
    const arrowId = `arrow-${color}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

    // 添加箭头标记
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "marker"
    );
    marker.setAttribute("id", arrowId);
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");

    const polygon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polygon"
    );
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
    polygon.setAttribute("fill", color === "blue" ? "#3b82f6" : "#10b981");

    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // 绘制路径
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
        "d",
        `M ${fromX},${fromY} Q ${midX},${midY} ${toX},${toY}`
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color === "blue" ? "#3b82f6" : "#10b981");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("marker-end", `url(#${arrowId})`);
    svg.appendChild(path);

    // 添加标签
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", midX);
    text.setAttribute("y", midY - 5);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "10");
    text.setAttribute("fill", color === "blue" ? "#3b82f6" : "#10b981");
    text.textContent = label;
    svg.appendChild(text);

    // 添加到表格容器
    dpTableContainer.appendChild(svg);
}

// 显示多条可能的传球路径
function showMultiplePaths() {
    // 移除现有小球
    const existingBalls = document.querySelectorAll(".ball, .transfer-ball");
    existingBalls.forEach((ball) => safeRemove(ball));

    // 移除现有路径
    const existingPaths = document.querySelectorAll(".ball-path-svg");
    existingPaths.forEach((path) => safeRemove(path));

    // 创建多条不同颜色的路径
    const pathColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

    // 清除其他元素，让路径更清晰
    clearAllHighlights();

    console.log(`将要显示路径数量: ${dp[passCount][1]}`);

    // 如果只有一条路径，也要展示
    if (dp[passCount][1] === 1) {
        setTimeout(() => {
            showOnePath("#3b82f6");
        }, 500);
        return;
    }

    // 生成并显示多个路径（最多5条）
    const maxPaths = Math.min(dp[passCount][1], 5);

    for (let p = 0; p < maxPaths; p++) {
        setTimeout(() => {
            showRandomPath(pathColors[p % pathColors.length], p);
        }, p * 2000); // 每条路径间隔2秒显示
    }
}

// 显示唯一的一条路径（当只有一条路径时使用）
function showOnePath(pathColor) {
    // 创建新的SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", `ball-path-svg path-single`);
    svg.style.position = "absolute";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "10";

    // 添加到容器
    circleContainer.appendChild(svg);

    // 固定路径：从小蛮开始，每次只能往一个方向走
    let currentStudent = 1; // 小蛮
    const path = [1]; // 起始为小蛮

    // 根据传球次数，交替向左右两边传球，确保最后回到1
    let goLeft = true; // 第一步向左传

    for (let i = 1; i <= passCount; i++) {
        // 获取左右邻居
        let left = currentStudent - 1;
        if (left === 0) left = studentCount;

        let right = currentStudent + 1;
        if (right === studentCount + 1) right = 1;

        // 选择方向
        let nextStudent;
        if (i === passCount) {
            // 最后一步必须回到小蛮
            nextStudent = 1;
        } else if (goLeft) {
            nextStudent = left;
        } else {
            nextStudent = right;
        }

        // 记录并切换学生
        path.push(nextStudent);
        currentStudent = nextStudent;

        // 交替方向
        goLeft = !goLeft;
    }

    // 反转路径顺序，从最后开始绘制回到小蛮
    for (let i = path.length - 1; i > 0; i--) {
        const from = path[i];
        const to = path[i - 1];

        // 获取DOM元素
        const fromStudent = document.getElementById(`student-${from}`);
        const toStudent = document.getElementById(`student-${to}`);

        if (fromStudent && toStudent) {
            // 绘制路径
            drawPathBetweenStudents(svg, fromStudent, toStudent, pathColor, i);
        }
    }
}

// 在两个学生之间绘制路径
function drawPathBetweenStudents(svg, fromStudent, toStudent, color, index) {
    const fromRect = fromStudent.getBoundingClientRect();
    const toRect = toStudent.getBoundingClientRect();
    const containerRect = circleContainer.getBoundingClientRect();

    const startX = (fromRect.left + fromRect.right) / 2 - containerRect.left;
    const startY = (fromRect.top + fromRect.bottom) / 2 - containerRect.top;
    const endX = (toRect.left + toRect.right) / 2 - containerRect.left;
    const endY = (toRect.top + toRect.bottom) / 2 - containerRect.top;

    // 计算控制点
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 - 40;

    // 创建路径
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
        "d",
        `M ${startX},${startY} Q ${midX},${midY} ${endX},${endY}`
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-dasharray", "5,3");
    path.setAttribute("opacity", "0");

    // 添加到SVG
    svg.appendChild(path);

    // 动画显示路径
    gsap.to(path, {
        opacity: 0.8,
        duration: 0.5,
        delay: (passCount - index) * 0.3, // 按顺序显示
    });

    // 创建小球
    const ball = document.createElement("div");
    ball.className = `absolute rounded-full shadow-lg`;
    ball.style.backgroundColor = color;
    ball.style.border = `2px solid ${color}`;
    ball.style.width = "18px";
    ball.style.height = "18px";
    ball.style.left = startX + "px";
    ball.style.top = startY + "px";
    ball.style.transform = "translate(-50%, -50%)";
    ball.style.opacity = "0";
    ball.style.zIndex = "25";
    circleContainer.appendChild(ball);

    // 沿路径动画
    const pathLength = path.getTotalLength();

    // 创建进度对象
    const progressObj = { progress: 0 };

    gsap.fromTo(
        progressObj,
        { progress: 0 },
        {
            progress: 1,
            duration: 1,
            delay: (passCount - index) * 0.3,
            ease: "power2.inOut",
            onStart: function () {
                gsap.to(ball, { opacity: 1, duration: 0.2 });
            },
            onUpdate: function () {
                const progress = progressObj.progress;
                const point = path.getPointAtLength(progress * pathLength);
                ball.style.left = point.x + "px";
                ball.style.top = point.y + "px";
            },
            onComplete: () => {
                try {
                    gsap.to(ball, {
                        opacity: 0,
                        duration: 0.2,
                        delay: 0.3,
                        onComplete: () => {
                            safeRemove(ball);
                        },
                    });
                } catch (e) {
                    console.error("球体动画完成回调错误:", e);
                }
            },
        }
    );
}

// 显示一条随机的合法传球路径
function showRandomPath(pathColor, pathIndex) {
    // 创建新的SVG用于路径
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", `ball-path-svg path-${pathIndex}`);
    svg.style.position = "absolute";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = `${10 + pathIndex}`;

    // 添加到容器
    circleContainer.appendChild(svg);

    // 生成一条随机路径
    let currentStudent = 1; // 从小蛮开始
    const path = [];
    path.push(currentStudent);

    // 根据DP表生成合法路径
    for (let i = 1; i <= passCount; i++) {
        // 获取当前学生的左右邻居
        let left = currentStudent - 1;
        if (left === 0) left = studentCount;

        let right = currentStudent + 1;
        if (right === studentCount + 1) right = 1;

        // 根据DP值随机选择左或右
        const leftProb = dp[passCount - i][left];
        const rightProb = dp[passCount - i][right];
        const total = leftProb + rightProb;

        // 随机选择方向，但考虑概率权重
        let nextStudent;
        if (Math.random() * total < leftProb) {
            nextStudent = left;
        } else {
            nextStudent = right;
        }

        // 记录选择
        path.push(nextStudent);
        currentStudent = nextStudent;
    }

    // 逆序绘制路径
    for (let i = path.length - 1; i > 0; i--) {
        const from = path[i];
        const to = path[i - 1];

        // 获取DOM元素
        const fromStudent = document.getElementById(`student-${from}`);
        const toStudent = document.getElementById(`student-${to}`);

        if (fromStudent && toStudent) {
            // 绘制路径
            drawPathBetweenStudents(svg, fromStudent, toStudent, pathColor, i);
        }
    }
}

// 新增：将计算好的DP值填充到表格中
function fillDPTable() {
    // 填充表格初始行 (i=0)
    for (let j = 1; j <= studentCount; j++) {
        const cell = document.getElementById(`dp-0-${j}`);
        if (cell) {
            cell.textContent = dp[0][j];
        }
    }

    // 填充其他行
    for (let i = 1; i <= passCount; i++) {
        for (let j = 1; j <= studentCount; j++) {
            const cell = document.getElementById(`dp-${i}-${j}`);
            if (cell) {
                cell.textContent = dp[i][j];
            } else {
                console.error(`未找到单元格填充: dp-${i}-${j}`);
            }
        }
    }

    console.log("DP表格填充完成");
}

// 确保页面加载后执行init函数
(function () {
    console.log("立即执行函数，确保初始化");

    // 如果DOM已加载，直接执行init；否则等待DOM加载
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

// 确保init函数始终被调用
setTimeout(function () {
    console.log("通过延时确保init被调用");
    const students = document.querySelectorAll(".circle-student");
    // 如果还没有学生元素，说明init可能没有被正确调用
    if (students.length === 0) {
        init();
    }
}, 500);

function init() {
    // 初始化绘制
    drawStudentCircle(studentCount);
    initDPTable();

    // 确保下拉框有正确的选项
    // 更多的学生数量选项
    studentCountSelect.innerHTML = "";
    for (let i = 3; i <= 10; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        studentCountSelect.appendChild(option);
    }
    studentCountSelect.value = studentCount;

    // 更多的传球次数选项
    passCountSelect.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        passCountSelect.appendChild(option);
    }
    passCountSelect.value = passCount;

    // 添加调试按钮
    addDebugButton();
}

// 添加调试按钮
function addDebugButton() {
    // 检查是否已存在调试按钮
    if (document.getElementById("debug-btn")) return;

    const debugBtn = document.createElement("button");
    debugBtn.id = "debug-btn";
    debugBtn.className =
        "bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded ml-2";
    debugBtn.innerHTML = '<i class="fas fa-bug mr-2"></i>调试表格';

    // 添加到控制按钮旁边
    const controlContainer = document.querySelector(".controls");
    if (controlContainer) {
        controlContainer.appendChild(debugBtn);

        // 添加点击事件
        debugBtn.addEventListener("click", debugTableState);
    }
}

// 调试表格状态
function debugTableState() {
    console.group("表格状态调试");

    // 检查DOM元素
    console.log("dpTableContainer:", dpTableContainer ? "存在" : "不存在");
    console.log(
        "dp-table元素:",
        document.getElementById("dp-table") ? "存在" : "不存在"
    );

    // 检查dp数组
    console.log("dp数组:", dp);

    // 检查表格单元格是否存在
    let cellCount = 0;
    let missingCells = [];

    for (let i = 0; i <= passCount; i++) {
        for (let j = 1; j <= studentCount; j++) {
            const cellId = `dp-${i}-${j}`;
            const cell = document.getElementById(cellId);
            if (cell) {
                cellCount++;
            } else {
                missingCells.push(cellId);
            }
        }
    }

    console.log(
        `找到${cellCount}个表格单元格，应有${(passCount + 1) * studentCount}个`
    );
    if (missingCells.length > 0) {
        console.warn("缺失的单元格:", missingCells);
    }

    // 检查表格内容与dp数组是否一致
    let mismatchCount = 0;
    for (let i = 0; i <= passCount; i++) {
        for (let j = 1; j <= studentCount; j++) {
            const cell = document.getElementById(`dp-${i}-${j}`);
            if (cell && dp[i] && dp[i][j] !== undefined) {
                const cellValue = cell.textContent.split("=")[0].trim(); // 去除公式部分
                if (cellValue !== dp[i][j].toString()) {
                    console.warn(
                        `单元格dp-${i}-${j}值不匹配: 表格值=${cellValue}, dp值=${dp[i][j]}`
                    );
                    mismatchCount++;
                }
            }
        }
    }

    console.log(`发现${mismatchCount}个值不匹配的单元格`);

    // 如果发现问题，尝试修复
    if (missingCells.length > 0 || mismatchCount > 0) {
        console.log("尝试修复表格问题...");
        initDPTable();
        computeAllDPValues();
        fillDPTable();
        console.log("表格已重建并填充");
    }

    console.groupEnd();
}
