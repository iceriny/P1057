// DOM元素
const themeToggle = document.getElementById("theme-toggle");
const studentCountSelect = document.getElementById("student-count");
const passCountSelect = document.getElementById("pass-count");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const circleContainer = document.getElementById("circle-container");
const dpTableContainer = document.getElementById("dp-table-container");
const resultElement = document.getElementById("result");

// 初始配置
let studentCount = parseInt(studentCountSelect.value);
let passCount = parseInt(passCountSelect.value);
let dp = []; // 动态规划表
let isAnimating = false; // 是否正在动画中
let currentStep = 0; // 当前演示步骤
let animationInterval = null; // 动画定时器
let isPaused = false; // 是否暂停

// 主题切换
themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
});

// 事件绑定
studentCountSelect.addEventListener("change", () => {
    studentCount = parseInt(studentCountSelect.value);
    resetVisualization();
    drawStudentCircle(studentCount);
});

passCountSelect.addEventListener("change", () => {
    passCount = parseInt(passCountSelect.value);
    resetVisualization();
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
        }
    }, 1000);
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

    // 计算并更新状态值
    dp[i][j] = dp[i - 1][left] + dp[i - 1][right];

    // 更新表格中的值
    const cell = document.getElementById(`dp-${i}-${j}`);
    if (cell) {
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
    }
}

// 添加小球动画效果
function animateBallTransfer(i, j, left, right) {
    // 移除现有小球
    const existingBalls = document.querySelectorAll(".ball, .transfer-ball");
    existingBalls.forEach((ball) => ball.remove());

    const currentStudent = document.getElementById(`student-${j}`);
    const leftStudent = document.getElementById(`student-${left}`);
    const rightStudent = document.getElementById(`student-${right}`);

    if (!currentStudent || !leftStudent || !rightStudent) return;

    // 创建当前小球
    const currentBall = createBall(currentStudent, "yellow");
    currentBall.classList.add("ball");

    // 创建从左侧传入的小球
    const leftBall = createBall(leftStudent, "blue");
    leftBall.classList.add("transfer-ball");
    animateBallMovement(leftBall, leftStudent, currentStudent);

    // 创建从右侧传入的小球
    const rightBall = createBall(rightStudent, "green");
    rightBall.classList.add("transfer-ball");
    animateBallMovement(rightBall, rightStudent, currentStudent);
}

// 创建小球
function createBall(student, color) {
    const ball = document.createElement("div");
    ball.className = `absolute rounded-full shadow-lg ${
        color === "yellow"
            ? "bg-yellow-400 dark:bg-yellow-500"
            : color === "blue"
            ? "bg-blue-500"
            : "bg-green-500"
    }`;
    ball.style.width = "20px";
    ball.style.height = "20px";
    ball.style.left = student.style.left;
    ball.style.top = student.style.top;
    ball.style.transform = "translate(-50%, -50%)";
    ball.style.zIndex = "10";
    ball.style.opacity = "0"; // 初始透明
    circleContainer.appendChild(ball);

    // 添加出现动画
    gsap.to(ball, {
        opacity: 1,
        scale: 1.2,
        duration: 0.3,
        ease: "back.out",
        onComplete: () => {
            gsap.to(ball, {
                scale: 1,
                duration: 0.2,
            });
        },
    });

    return ball;
}

// 动画小球移动
function animateBallMovement(ball, fromStudent, toStudent) {
    const fromRect = fromStudent.getBoundingClientRect();
    const toRect = toStudent.getBoundingClientRect();
    const containerRect = circleContainer.getBoundingClientRect();

    const startX = (fromRect.left + fromRect.right) / 2 - containerRect.left;
    const startY = (fromRect.top + fromRect.bottom) / 2 - containerRect.top;
    const endX = (toRect.left + toRect.right) / 2 - containerRect.left;
    const endY = (toRect.top + toRect.bottom) / 2 - containerRect.top;

    // 计算控制点（弧形路径）
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 - 30;

    // 创建SVG路径
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
        "d",
        `M ${startX},${startY} Q ${midX},${midY} ${endX},${endY}`
    );
    path.setAttribute("fill", "none");
    path.setAttribute(
        "stroke",
        ball.classList.contains("transfer-ball") &&
            ball.classList.contains("bg-blue-500")
            ? "#3b82f6"
            : "#10b981"
    );
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-dasharray", "3,3");
    path.setAttribute("opacity", "0.6");
    path.setAttribute(
        "id",
        "ball-path-" + Math.random().toString(36).substr(2, 9)
    );

    // 添加到SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ball-path-svg");
    svg.style.position = "absolute";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "5";
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

    // 开始动画
    gsap.fromTo(
        { progress: 0 },
        {
            progress: 1,
            duration: 0.8,
            ease: "power2.inOut",
            onUpdate: function () {
                const point = path.getPointAtLength(
                    this.targets()[0].progress * pathLength
                );
                ball.style.left = point.x + "px";
                ball.style.top = point.y + "px";
            },
            onComplete: () => {
                // 到达目标后，淡出动画
                gsap.to(ball, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => ball.remove(),
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
                    delay: 0.5,
                    onComplete: () => svg.remove(),
                });
            },
        }
    );
}

// 重置可视化
function resetVisualization() {
    // 重置DP表格
    dp = [];
    initDPTable();
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
    if (ball) ball.remove();

    // 移除所有高亮和箭头
    clearAllHighlights();
}

// 清除所有高亮和箭头
function clearAllHighlights() {
    document
        .querySelectorAll(
            ".highlighted, .state-transition-arrow, .pointer-indicator"
        )
        .forEach((el) => {
            el.remove();
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

// 添加小球到指定学生位置
function addBall(studentId) {
    // 移除现有小球
    const existingBalls = document.querySelectorAll(
        ".ball:not(.transfer-ball)"
    );
    existingBalls.forEach((ball) => ball.remove());

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
    gsap.to(ball, {
        opacity: 1,
        scale: 1.2,
        duration: 0.3,
        ease: "back.out",
        onComplete: () => {
            gsap.to(ball, {
                scale: 1,
                duration: 0.2,
            });
        },
    });

    return ball;
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

    if (leftStudent) {
        leftStudent.classList.add(
            "ring-2",
            "ring-blue-500",
            "dark:ring-blue-400"
        );
        setTimeout(() => {
            leftStudent.classList.remove(
                "ring-2",
                "ring-blue-500",
                "dark:ring-blue-400"
            );
        }, 2000);
    }

    if (rightStudent) {
        rightStudent.classList.add(
            "ring-2",
            "ring-green-500",
            "dark:ring-green-400"
        );
        setTimeout(() => {
            rightStudent.classList.remove(
                "ring-2",
                "ring-green-500",
                "dark:ring-green-400"
            );
        }, 2000);
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
        indicator.innerHTML = "左";
    } else {
        indicator.classList.add("bg-green-500", "text-white");
        indicator.innerHTML = "右";
    }

    indicator.style.width = "20px";
    indicator.style.height = "20px";
    indicator.style.borderRadius = "50%";

    // 计算位置 - 在学生节点附近
    const rect = student.getBoundingClientRect();
    const containerRect = circleContainer.getBoundingClientRect();

    const offsetX = type === "left" ? -25 : 25;
    const offsetY = type === "left" ? -25 : -25;

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
}

// 初始化DP表格结构
function initDPTable() {
    dpTableContainer.innerHTML = "";

    // 创建没有数据的表格结构
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

        // 空的单元格，等待填充数据
        for (let j = 1; j <= studentCount; j++) {
            const td = document.createElement("td");
            td.className = "border border-gray-200 dark:border-gray-700 p-2";
            td.id = `dp-${i}-${j}`;
            td.textContent = "?";

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

    // 绘制路径
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
        "d",
        `M ${fromX},${fromY} Q ${midX},${midY} ${toX},${toY}`
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color === "blue" ? "#3b82f6" : "#10b981");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("marker-end", "url(#arrowhead)");
    svg.appendChild(path);

    // 添加箭头标记
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "marker"
    );
    marker.setAttribute("id", "arrowhead");
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
