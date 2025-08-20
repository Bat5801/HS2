class SchoolHorrorGame {
    constructor() {
        // 先定义本地存储键
        const unlockedChaptersKey = 'schoolHorrorGame_unlockedChapters';

        // 先加载已解锁章节
        const unlockedChapters = this.loadUnlockedChapters(unlockedChaptersKey);

        // 游戏状态
        this.gameState = {
            // 存储已解锁章节的本地存储键
            unlockedChaptersKey: unlockedChaptersKey,
            playerName: '',
            playerGender: '',
            currentScene: 'start',
            currentChapter: '',
            gameTime: '21:00',
            plotProgress: 0,
            inventory: [],
            hasKey: false,
            hasSeenGhost: false,
            // 已解锁章节
            unlockedChapters: unlockedChapters
        };

        // 移除了自制章节始终解锁的代码，现在自制章节将保持未解锁状态

        // 时间更新定时器
        this.timeUpdateInterval = null;
        // 打字机效果定时器
        this.typingInterval = null;
        this.mainMenuTypingInterval = null;

        // DOM元素
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            chapterSelectScreen: document.getElementById('chapter-select-screen'),
            gameScreen: document.getElementById('game-screen'),
            deathScreen: document.getElementById('death-screen'),
            resultScreen: document.getElementById('result-screen'),
            playerNameInput: document.getElementById('player-name'),
            maleOption: document.getElementById('male-option'),
            femaleOption: document.getElementById('female-option'),
            startButton: document.getElementById('start-game'),
            restartButton: document.getElementById('restart-game'),
            nextChapterBtn: document.getElementById('next-chapter-btn'),
            backToChapterSelectBtn: document.getElementById('back-to-chapter-select'),
            currentTimeDisplay: document.getElementById('current-time'),
            playerNameDisplay: document.getElementById('player-name-display'),
            playerGenderDisplay: document.getElementById('player-gender-display'),
            gameMap: document.getElementById('game-map'),
            gameActions: document.getElementById('game-actions'),
            dialogueText: document.getElementById('dialogue-text'),
            dialogueChoices: document.getElementById('dialogue-choices'),
            deathMessage: document.getElementById('death-message'),
            resultChapter: document.getElementById('result-chapter'),
            resultTime: document.getElementById('result-time'),
            backToMainBtn: document.getElementById('back-to-main')
        };

        // 音效元素
        this.horrorDing = document.getElementById('horror-ding');
        this.horrorUp = document.getElementById('horror-up');

        // 绑定结算画面按钮事件
        this.elements.nextChapterBtn.addEventListener('click', () => this.goToNextChapter());
        this.elements.backToChapterSelectBtn.addEventListener('click', () => this.returnToChapterSelect());
        // 绑定返回主界面按钮事件
        this.elements.backToMainBtn.addEventListener('click', () => this.backToMainScreen());

        // 绑定事件监听
        this.bindEvents();
    }

    // 绑定事件监听
    bindEvents() {
        // 名字输入事件
        this.elements.playerNameInput.addEventListener('input', () => {
            this.gameState.playerName = this.elements.playerNameInput.value.trim();
            this.checkStartConditions();
        });

        // 性别选择事件
        this.elements.maleOption.addEventListener('click', () => {
            this.gameState.playerGender = 'male';
            this.elements.maleOption.classList.add('selected');
            this.elements.femaleOption.classList.remove('selected');
            this.clearSpecialGenderSelection();
            this.checkStartConditions();
        });

        this.elements.femaleOption.addEventListener('click', () => {
            this.gameState.playerGender = 'female';
            this.elements.femaleOption.classList.add('selected');
            this.elements.maleOption.classList.remove('selected');
            this.clearSpecialGenderSelection();
            this.checkStartConditions();
        });

        // 更多性别按钮事件
        const moreGenderBtn = document.getElementById('more-gender');
        const genderPopup = document.getElementById('gender-popup');
        const closeGenderPopup = document.getElementById('close-gender-popup');

        if (moreGenderBtn && genderPopup) {
            moreGenderBtn.addEventListener('click', () => {
                genderPopup.classList.remove('hidden');
            });

            closeGenderPopup.addEventListener('click', () => {
                genderPopup.classList.add('hidden');
            });

            // 点击弹窗外部关闭
            genderPopup.addEventListener('click', (e) => {
                if (e.target === genderPopup) {
                    genderPopup.classList.add('hidden');
                }
            });

            // 特殊性别选择事件
            document.querySelectorAll('.special-gender-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.gameState.playerGender = btn.dataset.gender;
                    this.elements.maleOption.classList.remove('selected');
                    this.elements.femaleOption.classList.remove('selected');
                    this.markSpecialGenderSelection(btn.dataset.gender);
                    genderPopup.classList.add('hidden');
                    this.checkStartConditions();
                });
            });
        }

        // 开始游戏按钮
        this.elements.startButton.addEventListener('click', () => {
            this.elements.startScreen.classList.add('hidden');
            this.elements.chapterSelectScreen.classList.remove('hidden');
            // 更新章节可用性状态
            this.updateChapterAvailability();
        });

        // 重新开始按钮
        this.elements.restartButton.addEventListener('click', () => this.restartGame());

        // 章节选择事件
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.addEventListener('click', () => {
                const chapter = item.dataset.chapter;
                if (chapter === 'custom') {
                    // 自制章节特定提示
                    this.showMainMenuDialog('该功能还在内测中，暂不可用', [
                        { text: '确定', action: () => { } },
                        { text: '了解', action: () => this.showCustomChapterInfo() }
                    ]);
                } else if (item.classList.contains('available')) {
                    this.startGame(chapter);
                } else {
                    this.showMainMenuDialog('你还没有解锁该关卡', [
                        { text: '确定', action: () => { } }
                    ]);
                }
            });
        });
    }

    // 检查开始游戏条件
    checkStartConditions() {
        if (this.gameState.playerName && this.gameState.playerGender) {
            this.elements.startButton.disabled = false;
        } else {
            this.elements.startButton.disabled = true;
        }
    }

    // 清除特殊性别选择状态
    clearSpecialGenderSelection() {
        document.querySelectorAll('.special-gender-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    }

    // 标记特殊性别选择
    markSpecialGenderSelection(gender) {
        document.querySelectorAll('.special-gender-btn').forEach(btn => {
            if (btn.dataset.gender === gender) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    // 开始游戏
    startGame(chapter, startTime = null) {
        // 设置当前章节
        this.gameState.currentChapter = chapter;

        // 更新玩家信息显示
        this.elements.playerNameDisplay.textContent = this.gameState.playerName;
        let genderDisplay = '';
        switch (this.gameState.playerGender) {
            case 'male':
                genderDisplay = '男';
                break;
            case 'female':
                genderDisplay = '女';
                break;
            case '沃尔玛购物袋':
                genderDisplay = '沃尔玛购物袋';
                break;
            case '武装直升机':
                genderDisplay = '武装直升机';
                break;
            default:
                genderDisplay = this.gameState.playerGender;
        }
        this.elements.playerGenderDisplay.textContent = genderDisplay;

        // 如果提供了起始时间，则更新游戏时间
        if (startTime) {
            this.updateGameTime(startTime);
        } else {
            // 否则重置为默认时间
            this.updateGameTime('21:00');
        }

        // 切换屏幕
        this.elements.chapterSelectScreen.classList.add('hidden');
        this.elements.gameScreen.classList.remove('hidden');

        // 启动自动时间更新
        this.startAutoTimeUpdate();

        // 更新物品栏显示
        this.updateInventoryDisplay();

        // 根据章节初始化第一个场景
        if (chapter === 'prologue') {
            // 序章默认添加手机到物品栏
            if (this.gameState && this.gameState.inventory && !this.gameState.inventory.includes('手机')) {
                this.gameState.inventory.push('手机');
                // 新增行李箱物品
                this.gameState.inventory.push('行李箱');
                // 更新物品栏显示
                this.updateInventoryDisplay();
            }
            // 设置序章开始时间为21:30
            this.updateGameTime('21:30');
            // 从宿舍场景开始
            this.loadScene('dormitory');
        } else if (chapter === 'chapter1') {
            // 加载Chapter1的起始场景
            if (window.Chapter1) {
                this.chapter1 = new Chapter1(this);
                this.chapter1.start();
            } else {
                this.showDialogue('无法加载第一章内容，请确保Chapter1.js已正确加载。', [
                    { text: '返回章节选择', action: () => this.returnToChapterSelect() }
                ]);
            }
        } else if (chapter === 'chapter2') {
            // 加载Chapter2的起始场景
            if (window.Chapter2) {
                this.chapter2 = new Chapter2(this);
                this.chapter2.start();
            } else {
                this.showDialogue('无法加载第二章内容，请确保Chapter2.js已正确加载。', [
                    { text: '返回章节选择', action: () => this.returnToChapterSelect() }
                ]);
            }
        } else if (chapter === 'chapter3') {
            // 加载Chapter3的起始场景
            if (window.Chapter3) {
                this.chapter3 = new Chapter3(this);
                this.chapter3.start();
            } else {
                this.showDialogue('无法加载第三章内容，请确保Chapter3.js已正确加载。', [
                    { text: '返回章节选择', action: () => this.returnToChapterSelect() }
                ]);
            }
        } else if (chapter === 'chapter4') {
            // 加载Chapter4的起始场景
            if (window.Chapter4) {
                this.chapter4 = new Chapter4(this);
                this.chapter4.start();
            } else {
                this.showDialogue('无法加载第四章内容，请确保Chapter4.js已正确加载。', [
                    { text: '返回章节选择', action: () => this.returnToChapterSelect() }
                ]);
            }

        } else if (chapter === 'custom') {
            // 加载自制章节
            if (window.CustomChapter) {
                this.customChapter = new CustomChapter(this);
                this.customChapter.start();
            } else {
                this.showDialogue('无法加载自制章节内容，请确保CustomChapter.js已正确加载。', [
                    { text: '返回章节选择', action: () => this.returnToChapterSelect() }
                ]);
            }
        }
    }

    // 解锁章节
    unlockChapter(chapter) {
        if (!this.gameState.unlockedChapters.includes(chapter)) {
            this.gameState.unlockedChapters.push(chapter);
            // 保存到本地存储
            this.saveUnlockedChapters();
            // 更新章节选择界面
            this.updateChapterAvailability();
            console.log('已解锁章节:', chapter);
            console.log('当前已解锁章节列表:', this.gameState.unlockedChapters);
        }
    }

    // 更新章节可用性
    updateChapterAvailability() {
        document.querySelectorAll('.chapter-item').forEach(item => {
            const chapter = item.dataset.chapter;
            if (this.gameState.unlockedChapters.includes(chapter)) {
                item.classList.remove('locked');
                item.classList.add('available');
                const lockIcon = item.querySelector('.lock-icon');
                const chapterDesc = item.querySelector('p'); // 选择<p>标签作为描述元素
                if (lockIcon) {
                    lockIcon.remove(); // 完全移除锁图标
                }
                if (chapterDesc) {
                    if (chapter === 'chapter1') {
                        chapterDesc.textContent = '探索学校的神秘事件，解开隐藏的秘密。找到生锈的钥匙，面对镜中的幽魂，揭露校园背后的真相。';
                    } else if (chapter === 'chapter2') {
                        chapterDesc.textContent = '遇见第一位朋友，发现更多关于学校的秘密。探索宿舍区，解开鬼影之谜。';
                    } else if (chapter === 'chapter3') {
                        chapterDesc.textContent = '揭开学校的最终秘密，直面真相。深入地下实验室，阻止黑暗仪式。';
                    } else if (chapter === 'chapter4') {
                        chapterDesc.textContent = '逃离学校后，诅咒依然追随着你。寻找解除诅咒的方法，面对过去的阴影。';

                    }
                }
            }
        });
    }

    // 加载场景
    loadScene(sceneName) {
        this.clearDialogue();

        switch (sceneName) {
            case 'dormitory':
                this.showDormitoryScene();
                break;
            case 'corridor':
                this.showCorridorScene();
                break;
            case 'bathroom':
                this.showBathroomScene();
                break;
            case 'quadrangle':
                this.showQuadrangleScene();
                break;
            case 'entrance':
                this.showEntranceScene();
                break;
            default:
                this.showDormitoryScene();
        }
    }

    // 显示宿舍场景
    showDormitoryScene() {
        this.gameState.currentScene = 'dormitory';
        this.updateGameMap('dormitory');

        if (this.gameState.plotProgress === 0) {
            this.showDialogue(`今天是你搬到这所新学校的第一天，${this.gameState.playerName}。因为父母工作调动，你们全家刚搬到这个陌生的城市。现在已经是晚上9点半了，宿舍里只有你一个人，其他室友还没到。窗外的路灯透过窗帘，在墙上投下诡异的影子。`, [
                { text: '检查窗户', action: () => this.examineWindow() },
                { text: '查看室友的床', action: () => this.checkBed() },
                { text: '给父母打电话', action: () => this.callParents() }
            ]);
        } else {
            this.showDialogue('宿舍里静悄悄的，只有墙上挂钟的滴答声。你总觉得这里有些不对劲，但又说不上来哪里奇怪。', [
                { text: '出去转转', action: () => this.goToCorridor() },
                { text: '上床睡觉', action: () => this.tryToSleep() }
            ]);
        }
    }

    // 显示走廊场景
    showCorridorScene() {
        this.gameState.currentScene = 'corridor';
        this.updateGameMap('corridor');

        this.updateGameTime('21:45');
        this.showDialogue('宿舍走廊里的感应灯忽明忽暗，你能听到自己的脚步声在空旷的走廊里回响。远处似乎有什么东西在动...', [
            { text: '去卫生间', action: () => this.goToBathroom() },
            { text: '下楼去操场', action: () => this.goToQuadrangle() },
            { text: '回到宿舍', action: () => this.goBackToDorm() }
        ]);
    }

    // 显示操场场景
    showQuadrangleScene() {
        this.gameState.currentScene = 'quadrangle';
        this.updateGameMap('quadrangle');

        this.updateGameTime('22:00');
        this.showDialogue('夜晚的操场显得格外空旷，只有几盏昏黄的路灯照着。你突然发现看台上似乎有个人影在盯着你...', [
            { text: '走过去看看', action: () => this.checkFigure() },
            { text: '去校门口', action: () => this.goToEntrance() },
            { text: '返回宿舍', action: () => this.goBackToDormThroughCorridor() }
        ]);
    }

    // 显示校门口场景
    showEntranceScene() {
        this.gameState.currentScene = 'entrance';
        this.updateGameMap('entrance');

        this.updateGameTime('22:15');
        this.showDialogue('学校大门紧闭着，传达室的灯也已经熄灭了。你突然听到身后传来细碎的脚步声，可当你回头时却什么都没有...', [
            { text: '喊人', action: () => this.callForHelp() },
            { text: '绕到后门', action: () => this.findBackDoor() },
            { text: '返回操场', action: () => this.goBackToQuadrangle() }
        ]);
    }

    // 显示卫生间场景
    showBathroomScene() {
        this.gameState.currentScene = 'bathroom';
        this.updateGameMap('bathroom');

        this.showDialogue('卫生间里的灯坏了一盏，只有应急灯发出微弱的绿光。你洗手时，发现镜子里的你似乎比实际动作慢了半拍...', [
            { text: '仔细看镜子', action: () => this.stareAtMirror() },
            { text: '检查隔间', action: () => this.checkStalls() },
            { text: '离开卫生间', action: () => this.goBackToCorridor() }
        ]);
    }

    // 显示校长办公室场景（暂时保留但不使用）
    showPrincipalOfficeScene() {
        this.gameState.currentScene = 'principalOffice';
        this.updateGameMap('principalOffice');

        this.showDialogue('这里是校长办公室，但现在不是来这里的时候...', [
            { text: '返回走廊', action: () => this.goToCorridor() }
        ]);
    }

    // 更新游戏地图显示
    updateGameMap(location) {
        const locations = {
            classroom: '🏫 你的教室',
            corridor: '🚪 学校走廊',
            library: '📚 图书馆',
            bathroom: '🚻 卫生间',
            quadrangle: '🏫 校园操场',
            principalOffice: '🔑 校长办公室',
            schoolGate: '🚪 学校大门',
            foyer: '🏫 教学楼大厅',
            abandonedWing: '🏚️ 废弃教学楼',
            labyrinth: '🌀 地下迷宫',
            altarRoom: '🩸 祭坛房间',
            entrance: '🚪 学校入口',
            dormitory: '🏠 宿舍区'
        };

        this.elements.gameMap.innerHTML = `<div class="location-name">${locations[location] || '未知地点'}</div>
<div class="pixel-map">${this.generatePixelMap(location)}</div>`;

        // 更新物品栏显示
        this.updateInventoryDisplay();
    }

    // 更新物品栏显示
    updateInventoryDisplay() {
        const inventoryElement = document.getElementById('inventory-items');
        if (!inventoryElement) return;

        inventoryElement.innerHTML = '';

        if (this.gameState.inventory.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'inventory-empty';
            emptyMessage.textContent = '物品栏为空';
            inventoryElement.appendChild(emptyMessage);
            return;
        }

        // 物品简介映射
        const itemDescriptions = {
            '手机': '你的智能手机，电量充足，可以用来照明和查看时间。',
            '行李箱': '你的旅行箱，装着你所有的物品和回忆。',
            '神秘纸条': '一张字迹潦草的纸条，似乎包含着重要的逃生线索。',
            '学生证': '一张学生身份证明，上面的照片看起来有些熟悉...',
        };

        this.gameState.inventory.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.title = itemDescriptions[item] || '未知物品';

            // 为不同物品选择不同的图标
            let icon = '🎒'; // 默认背包图标
            if (item === '手机') icon = '📱';
            else if (item === '生锈的钥匙' || item === '发银光的钥匙' || item === '图书馆钥匙' || item === '神秘钥匙') icon = '🔑';
            else if (item === '笔记本') icon = '📓';
            else if (item === '手电筒') icon = '🔦';
            else if (item === '行李箱') icon = '🧳';
            else if (item === '神秘纸条') icon = '📝';
            else if (item === '学生证') icon = '🪪';

            itemElement.innerHTML = `
                <div class="inventory-item-icon">${icon}</div>
                <div class="inventory-item-name">${item}</div>
            `;

            inventoryElement.appendChild(itemElement);
        });
    }

    // 使用物品
    useItem(item) {
        // 这里可以添加使用物品的逻辑
        // 例如，如果是手机，可以显示查看手机的内容
        if (item === '手机') {
            // 检查当前章节是否有手机相关功能
            if (this.gameState.currentChapter === 'chapter3' && window.Chapter3 && this.chapter3) {
                this.chapter3.checkPhone();
            } else {
                this.showDialogue('你查看了手机，但没有收到新消息。', [
                    { text: '继续', action: () => this.clearDialogue() }
                ]);
            }
        } else {
            this.showDialogue(`你使用了${item}，但没有发生任何事情。`, [
                { text: '继续', action: () => this.clearDialogue() }
            ]);
        }
    }

    // 生成像素风格地图
    generatePixelMap(location) {
        // 为第三章场景添加像素地图
        if (location === 'schoolGate') {
            return `■■■■■■■■■■
■   ■■■   ■
■  ■   ■  ■
■   ■■■   ■
■■■■■■■■■■`;
        } else if (location === 'foyer') {
            return `■■■■■■■■■■
■  ■     ■ ■
■  ■  ■  ■ ■
■  ■     ■ ■
■■■■■■■■■■`;
        } else if (location === 'abandonedWing') {
            return `■■■■■■■■■■
■ ▒▒▒ ▒▒▒ ■
■         ■
■ ▒▒▒ ▒▒▒ ■
■■■■■■■■■■`;
        } else if (location === 'labyrinth') {
            return `■■■■■■■■■■
■ ■ ■ ■ ■ ■
■■■■■■■■■■
■ ■ ■ ■ ■ ■
■■■■■■■■■■`;
        } else if (location === 'altarRoom') {
            return `■■■■■■■■■■
■         ■
■   ■■■   ■
■  ■   ■  ■
■■■■■■■■■■`;
        }

        switch (location) {
            case 'classroom':
                return '■■■■■■■■■■\n■         ■\n■   T     ■\n■         ■\n■   C     ■\n■         ■\n■■■■■■■■■■';
            case 'corridor':
                return '■■■■■■■■■■■■■■\n■               ■\n■   D   D   D   ■\n■               ■\n■■■■■■■■■■■■■■';
            case 'library':
                return '■■■■■■■■■■\n■BBBBBBBBB■\n■B       B■\n■BBBBBBBBB■\n■B       B■\n■BBBBBBBBB■\n■■■■■■■■■■';
            case 'bathroom':
                return '■■■■■■\n■   S   ■\n■       ■\n■   M   ■\n■■■■■■';
            case 'principalOffice':
                return '■■■■■■■■\n■   D    ■\n■        ■\n■   F    ■\n■■■■■■■■';
            case 'staircase':
                return '■■■■■\n■  ▲  ■\n■  ▲  ■\n■  ▲  ■\n■  ▼  ■\n■  ▼  ■\n■  ▼  ■\n■■■■■';
            case 'artRoom':
                return '■■■■■■■■■■\n■ P     P ■\n■         ■\n■   E     ■\n■         ■\n■ P     P ■\n■■■■■■■■■■';
            case 'basement':
                return '■■■■■■■■■■\n■   D     ■\n■         ■\n■   S     ■\n■         ■\n■   C     ■\n■■■■■■■■■■';
            case 'deepCorridor':
                return '■■■■■■■■■■■■■■■■\n■                 ■\n■                 ■\n■                 ■\n■                 ■\n■   D             ■\n■■■■■■■■■■■■■■■■';
            case 'exit':
                return '■■■■■■■■■\n■   O     ■\n■         ■\n■■■■■■■■■';
            case 'undergroundPassage':
                return '■■■■■■■■■■■\n■           ■\n■   ▒▒▒▒▒   ■\n■   ▒   ▒   ■\n■   ▒▒▒▒▒   ■\n■           ■\n■■■■■■■■■■■';
            case 'ironDoorArea':
                return '■■■■■■■■■■\n■   █     ■\n■         ■\n■   ▒     ■\n■         ■\n■   █     ■\n■■■■■■■■■■';
            case 'slimeExit':
                return '■■■■■■■■■\n■   ~     ■\n■  ~~     ■\n■   ~     ■\n■■■■■■■■■';
            case 'stoneDoorChamber':
                return '■■■■■■■■■\n■         ■\n■   ▒▒▒   ■\n■   ▒@▒   ■\n■   ▒▒▒   ■\n■         ■\n■■■■■■■■■';
            case 'redPlayground':
                return '■■■■■■■■■■■■■■\n■               ■\n■   ▲           ■\n■               ■\n■■■■■■■■■■■■■■';
            case 'undergroundAbyss':
                return '■■■■■■■■■■\n■           ■\n■           ■\n■   ▓▓▓     ■\n■           ■\n■           ■\n■■■■■■■■■■';
            case 'hiddenCatacombs':
                return '■■■■■■■■■\n■ ☠ ☠ ☠ ■\n■         ■\n■ ☠ ☠ ☠ ■\n■         ■\n■ ☠ ☠ ☠ ■\n■■■■■■■■■';
            case 'innerSanctum':
                return '■■■■■■■■■\n■   ▒     ■\n■  ▒▒▒    ■\n■   ▒     ■\n■  ▒@▒    ■\n■   ▒     ■\n■■■■■■■■■';
            case 'flowerField':
                return '■■■■■■■■■\n■ ⚘ ⚘ ⚘ ■\n■ ⚘ ⚘ ⚘ ■\n■ ⚘ ⚘ ⚘ ■\n■ ⚘ ⚘ ⚘ ■\n■ ⚘ ⚘ ⚘ ■\n■■■■■■■■■';
            case 'upperFloor':
                return '■■■■■■■■■■■■■■\n■               ■\n■   ▒   ▒   ▒   ■\n■               ■\n■■■■■■■■■■■■■■';
            case 'upperFloorCorridor':
                return '■■■■■■■■■■■■■■\n■ ▓ ▓ ▓ ▓ ▓ ▓ ■\n■               ■\n■ ▓ ▓ ▓ ▓ ▓ ▓ ■\n■■■■■■■■■■■■■■';
            case 'principalsOffice':
                return '■■■■■■■■\n■   D    ■\n■  ▓▓▓   ■\n■   F    ■\n■■■■■■■■';
            case 'creatureLair':
                return '■■■■■■■■■\n■         ■\n■   ▓     ■\n■  ▓▓▓    ■\n■   ▓     ■\n■         ■\n■■■■■■■■■';
            case 'lotusDimension':
                return '■■■■■■■■■\n■   ⚘     ■\n■  ⚘⚘⚘    ■\n■   ⚘     ■\n■  ⚘⚘⚘    ■\n■   ⚘     ■\n■■■■■■■■■';
            case 'entrance':
                return '■■■■■■■■■■\n■          ■\n■  ■■■_■■■ ■\n■          ■\n■■■■■■■■■■';
            case 'quadrangle':
                return '■■■■■■■■■■■■■■\n■                ■\n■  ■■■■■■■■■■■■ ■\n■                ■\n■■■■■■■■■■■■■■';
            case 'dormitory':
                return '■■■■■■■■■■\n■ ■■ ■■ ■■ ■\n■ ■■ ■■ ■■ ■\n■ ■■ ■■ ■■ ■\n■■■■■■■■■■';
            case 'canteen':
                return '■■■■■■■■■■\n■ ■■■■■■■■ ■\n■ ■■■■■■■■ ■\n■ ■■■■■■■■ ■\n■■■■■■■■■■';
            case 'storageRoom':
                return '■■■■■■■■■■\n■ ■■■■■■■■ ■\n■ ■■■■■■■■ ■\n■ ■■■■■■■■ ■\n■■■■■■■■■■';
            default:
                return '■■■■■■■■\n■   ?    ■\n■        ■\n■■■■■■■■';
        }
    }

    // 主菜单弹窗函数
    showMainMenuDialog(text, choices) {
        // 创建背景层
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.zIndex = '999';
        document.body.appendChild(overlay);

        // 创建弹窗容器
        const dialogContainer = document.createElement('div');
        dialogContainer.className = 'main-menu-dialog';
        dialogContainer.style.position = 'fixed';
        dialogContainer.style.top = '50%';
        dialogContainer.style.left = '50%';
        dialogContainer.style.transform = 'translate(-50%, -50%)';
        dialogContainer.style.width = '400px';
        dialogContainer.style.backgroundColor = '#2a2a2a';
        dialogContainer.style.border = '2px solid #3b82f6';
        dialogContainer.style.borderRadius = '8px';
        dialogContainer.style.padding = '1.5rem';
        dialogContainer.style.zIndex = '1000';
        dialogContainer.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.8)';

        // 创建文本区域
        const textElement = document.createElement('div');
        textElement.className = 'main-menu-dialog-text';
        textElement.style.color = '#ddd';
        textElement.style.marginBottom = '1.5rem';
        textElement.style.minHeight = '60px';
        textElement.style.fontFamily = 'mplus_hzk_12, monospace';

        // 创建选项区域
        const choicesElement = document.createElement('div');
        choicesElement.className = 'main-menu-dialog-choices';
        choicesElement.style.display = 'flex';
        choicesElement.style.flexWrap = 'wrap';
        choicesElement.style.gap = '0.5rem';

        // 添加到容器
        dialogContainer.appendChild(textElement);
        dialogContainer.appendChild(choicesElement);

        // 添加到文档
        document.body.appendChild(dialogContainer);

        // 打字机效果
        let index = 0;
        const typeSpeed = 70; // 打字速度，毫秒/字符

        // 清除任何正在进行的打字动画
        if (this.mainMenuTypingInterval) {
            clearInterval(this.mainMenuTypingInterval);
        }

        // 开始打字动画
        this.mainMenuTypingInterval = setInterval(() => {
            if (index < text.length) {
                textElement.textContent += text.charAt(index);
                index++;
            } else {
                clearInterval(this.mainMenuTypingInterval);
                // 打字完成后显示选项
                choices.forEach(choice => {
                    const button = document.createElement('button');
                    button.className = 'choice-btn';
                    button.textContent = choice.text;
                    button.style.padding = '0.5rem 1rem';
                    button.style.backgroundColor = '#333';
                    button.style.border = '1px solid #555';
                    button.style.color = '#fff';
                    button.style.cursor = 'pointer';
                    button.style.fontSize = '0.9rem';
                    button.style.fontFamily = 'mplus_hzk_12, monospace';

                    button.addEventListener('click', () => {
                        choice.action();
                        // 移除弹窗和背景层
                        document.body.removeChild(dialogContainer);
                        document.body.removeChild(overlay);
                    });

                    choicesElement.appendChild(button);
                });
            }
        }, typeSpeed);
    }

    // 打字机效果显示对话
    showDialogue(text, choices) {
        this.elements.dialogueText.textContent = '';
        this.elements.dialogueChoices.innerHTML = '';

        let index = 0;
        const typeSpeed = 70; // 打字速度，毫秒/字符（稍微调慢）

        // 清除任何正在进行的打字动画
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
        }

        // 开始打字动画
        this.typingInterval = setInterval(() => {
            if (index < text.length) {
                this.elements.dialogueText.textContent += text.charAt(index);
                index++;
            } else {
                clearInterval(this.typingInterval);
                // 打字完成后显示选项
                choices.forEach(choice => {
                    const button = document.createElement('button');
                    button.className = 'choice-btn';
                    button.textContent = choice.text;
                    button.addEventListener('click', choice.action);
                    this.elements.dialogueChoices.appendChild(button);
                });
            }
        }, typeSpeed);
    }

    // 清除对话
    clearDialogue() {
        // 清除任何正在进行的打字动画
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
            this.typingInterval = null;
        }
        this.elements.dialogueText.textContent = '';
        this.elements.dialogueChoices.innerHTML = '';
    }

    // 序章剧情分支函数
    examineWindow() {
        this.gameState.plotProgress = 1;
        this.showDialogue('你走到窗边，透过窗帘的缝隙向外望去。校园里一片漆黑，只有几盏路灯还亮着。突然，你看到一个白色的影子从楼下闪过！', [
            { text: '打开窗户看看', action: () => this.openWindow() },
            { text: '拉上窗帘', action: () => this.closeCurtain() }
        ]);
    }

    checkBed() {
        this.gameState.plotProgress = 2;
        this.showDialogue('你走到室友的床边，发现床上整整齐齐地铺着被褥，但明显没有人睡过的痕迹。枕头下面似乎压着什么东西。', [
            { text: '查看枕头下', action: () => this.checkPillow() },
            { text: '离开', action: () => this.backToCenter() }
        ]);
    }

    callParents() {
        this.updateGameTime('21:35');
        this.showDialogue('你拿出手机想要给父母打电话，却发现手机没有信号。屏幕上突然跳出一张陌生的照片——那是一个穿着校服的女孩，表情诡异。', [
            { text: '删除照片', action: () => this.deletePhoto() },
            { text: '仔细看照片', action: () => this.studyPhoto() }
        ]);
    }

    tryToSleep() {
        this.updateGameTime('22:30');
        this.showDialogue('你决定上床睡觉，希望明天一切都会好起来。但你刚躺下，就听到床底下传来细微的说话声...', [
            { text: '查看床底', action: () => this.checkUnderBed() },
            { text: '用被子蒙头', action: () => this.hideUnderCovers() }
        ]);
    }

    goBackToDorm() {
        this.loadScene('dormitory');
    }

    goBackToCorridor() {
        this.loadScene('corridor');
    }

    goToBathroom() {
        this.loadScene('bathroom');
    }

    goToQuadrangle() {
        this.loadScene('quadrangle');
    }

    goToEntrance() {
        this.loadScene('entrance');
    }

    goBackToDormThroughCorridor() {
        this.loadScene('corridor');
    }

    goBackToQuadrangle() {
        this.loadScene('quadrangle');
    }

    // 更多剧情交互函数
    openWindow() {
        this.updateGameTime('21:40');
        this.showDialogue('你打开窗户，一阵冷风吹了进来。风里夹杂着若有若无的哭声，让你不寒而栗。', [
            { text: '探身出去看看', action: () => this.leanOutWindow() },
            { text: '关上窗户', action: () => this.closeWindow() }
        ]);
    }

    closeCurtain() {
        this.showDialogue('你拉上了窗帘，房间里变得更暗了。你总觉得黑暗中有什么东西在注视着你...', [
            { text: '打开灯', action: () => this.turnOnLight() },
            { text: '检查门锁', action: () => this.checkDoorLock() }
        ]);
    }

    checkPillow() {
        this.gameState.hasKey = true;
        this.showDialogue('你从枕头下拿出一张纸条，上面写着："不要相信这里的任何东西，凌晨12点前离开！"纸条背面还画着一张简易的逃生路线图。', [
            { text: '收好纸条', action: () => this.takeNote() },
            { text: '放回纸条', action: () => this.putNoteBack() }
        ]);
    }

    backToCenter() {
        this.loadScene('dormitory');
    }

    deletePhoto() {
        this.showDialogue('你删除了那张诡异的照片，但手机屏幕却开始不停地闪烁。你感到一阵眩晕...', [
            { text: '放下手机', action: () => this.dropPhone() },
            { text: '继续使用手机', action: () => this.keepUsingPhone() }
        ]);
    }

    studyPhoto() {
        this.gameState.hasSeenGhost = true;
        this.updateGameTime('21:50');
        this.showDeath('你仔细看了照片，发现照片上的女孩眼睛里流出的不是眼泪，而是血！突然，照片里的女孩伸出手，从屏幕里爬了出来...');
    }

    checkUnderBed() {
        this.updateGameTime('22:35');
        this.showDialogue('你壮着胆子看向床底，黑暗中似乎有一双发光的眼睛在盯着你。那声音越来越清晰了——是在喊你的名字！', [
            { text: '后退', action: () => this.backAway() },
            { text: '伸手去摸', action: () => this.reachUnderBed() }
        ]);
    }

    hideUnderCovers() {
        this.updateGameTime('23:00');
        this.showDialogue('你用被子蒙住了头，心跳得厉害。过了一会儿，你感觉被子被轻轻地掀开了一个角...', [
            { text: '猛地坐起来', action: () => this.sitUpQuickly() },
            { text: '保持不动', action: () => this.stayStill() }
        ]);
    }

    stareAtMirror() {
        this.gameState.hasSeenGhost = true;
        this.updateGameTime('21:55');
        this.showDialogue('你盯着镜子看了很久，发现镜子里的你开始做出和你不一样的动作。它慢慢露出了一个诡异的微笑...', [
            { text: '打破镜子', action: () => this.smashMirror() },
            { text: '转身跑开', action: () => this.runAwayFromMirror() }
        ]);
    }

    checkStalls() {
        this.showDialogue('你逐一检查每个隔间，都没有人。当你走到最后一个隔间时，发现门把手上有新鲜的血迹。', [
            { text: '打开门', action: () => this.openStallDoor() },
            { text: '离开卫生间', action: () => this.goBackToCorridor() }
        ]);
    }

    checkFigure() {
        this.updateGameTime('22:05');
        this.showDialogue('你慢慢走向看台，那个身影却突然消失了。当你走到刚才人影站的地方，发现地上有一个学生证——上面的照片正是你手机里看到的那个女孩！', [
            { text: '捡起学生证', action: () => this.pickUpID() },
            { text: '立刻离开', action: () => this.fleeFromStand() }
        ]);
    }

    callForHelp() {
        this.updateGameTime('22:20');
        this.showDialogue('你大声呼救，但回应你的只有自己的回声。突然，你感觉有人拍了拍你的肩膀...', [
            { text: '回头看', action: () => this.turnAround() },
            { text: '向前跑', action: () => this.runForward() }
        ]);
    }

    findBackDoor() {
        this.updateGameTime('22:25');
        this.showDialogue('你绕到学校后门，发现门并没有锁。但就在你准备出去的时候，身后传来一个熟悉的声音："你要去哪里？"', [
            { text: '回头', action: () => this.lookBack() },
            { text: '冲出去', action: () => this.rushOut() }
        ]);
    }

    // 结局相关函数
    leanOutWindow() {
        this.showDeath('你探身出去，突然感到有一双手从背后推了你一把。你失去了平衡，从楼上摔了下去...');
    }

    closeWindow() {
        this.showDialogue('你赶紧关上窗户，拉上窗帘。现在你必须想办法离开这个诡异的地方。', [
            { text: '出去找其他人', action: () => this.goToCorridor() },
            { text: '收拾东西准备离开', action: () => this.packAndLeave() }
        ]);
    }

    turnOnLight() {
        this.showDialogue('灯亮了，房间里的一切看起来都很正常。也许刚才只是你的幻觉？', [
            { text: '继续检查房间', action: () => this.examineRoomFurther() },
            { text: '上床睡觉', action: () => this.tryToSleep() }
        ]);
    }

    checkDoorLock() {
        this.showDialogue('门锁得好好的，没有被撬动的痕迹。但你还是觉得不安全。', [
            { text: '用行李箱顶住门', action: () => this.barricadeDoor() },
            { text: '出去看看', action: () => this.goToCorridor() }
        ]);
    }

    takeNote() {
        this.gameState.inventory.push('神秘纸条');
        this.updateInventoryDisplay();
        this.showDialogue('你把纸条收了起来。现在你相信这所学校确实有问题，必须想办法在凌晨12点前离开。', [
            { text: '按照地图离开', action: () => this.followMap() }
        ]);
    }

    putNoteBack() {
        this.showDialogue('你把纸条放回原位，决定不去想这些奇怪的事情。也许只是某个恶作剧？', [
            { text: '上床睡觉', action: () => this.tryToSleep() },
            { text: '出去走走', action: () => this.goToCorridor() }
        ]);
    }

    dropPhone() {
        this.showDialogue('你放下手机，感觉眩晕感渐渐消失了。也许你应该暂时不用手机，先离开这里。', [
            { text: '离开宿舍', action: () => this.goToCorridor() }
        ]);
    }

    keepUsingPhone() {
        this.gameState.hasSeenGhost = true;
        this.showDeath('你继续盯着手机屏幕，发现屏幕里的自己慢慢变成了那个女孩的样子。她对着你笑了笑，然后手机突然爆炸了...');
    }

    backAway() {
        this.showDialogue('你快速后退，远离床底。那个声音还在喊你的名字，但你决定不再理会。', [
            { text: '离开宿舍', action: () => this.goToCorridor() }
        ]);
    }

    reachUnderBed() {
        this.showDeath('你伸手向床底摸去，却摸到了一只冰冷、潮湿的手。那双手紧紧抓住了你，将你拖向黑暗的床底...');
    }

    sitUpQuickly() {
        this.showDialogue('你猛地坐起来，却什么都没有看到。也许只是风？你决定不能再待在这里了。', [
            { text: '立刻离开', action: () => this.escapeDorm() }
        ]);
    }

    stayStill() {
        this.showDeath('你保持不动，感觉那东西慢慢靠近你。一阵刺骨的寒意袭来，你失去了意识...');
    }

    smashMirror() {
        this.updateGameTime('22:00');
        this.showDialogue('你打破了镜子，碎片散落一地。镜子里的影像消失了，但你听到了一声凄厉的尖叫，回荡在整个卫生间里。', [
            { text: '赶紧离开', action: () => this.goBackToCorridor() }
        ]);
    }

    runAwayFromMirror() {
        this.goBackToCorridor();
    }

    openStallDoor() {
        this.showDeath('你打开了门，却看到了令你终生难忘的一幕——那个女孩悬挂在隔间里，眼睛直勾勾地盯着你...');
    }

    pickUpID() {
        this.gameState.inventory.push('学生证');
        this.updateInventoryDisplay();
        this.updateGameTime('22:10');
        this.showDialogue('你拿起学生证，上面写着名字："林小棠"，班级："高三(2)班"。照片里的女孩看起来很面熟，好像在哪里见过...', [
            { text: '去教学楼', action: () => this.goToTeachingBuilding() },
            { text: '回宿舍', action: () => this.goBackToDormThroughCorridor() }
        ]);
    }

    fleeFromStand() {
        this.goBackToQuadrangle();
    }

    turnAround() {
        this.gameState.hasSeenGhost = true;
        this.showDeath('你回头一看，那个女孩就站在你身后，浑身是血，眼睛里闪烁着诡异的光芒。她伸出手，慢慢向你逼近...');
    }

    runForward() {
        this.updateGameTime('22:30');
        this.showDialogue('你拼命向前跑，终于看到了学校的后门。门微微开着，似乎在邀请你出去。', [
            { text: '冲出去', action: () => this.escapeSchool() }
        ]);
    }

    lookBack() {
        this.showDialogue('你回头一看，竟然是白天见过的班主任！但他的表情很奇怪，眼神空洞洞的。', [
            { text: '和他说话', action: () => this.talkToTeacher() },
            { text: '跑出去', action: () => this.rushOut() }
        ]);
    }

    rushOut() {
        this.completeChapter();
    }

    packAndLeave() {
        this.updateGameTime('22:40');
        this.showDialogue('你快速收拾了一些必需品，准备离开。根据那张纸条的提示，你必须在凌晨12点前离开这所学校。', [
            { text: '按照逃生路线离开', action: () => this.escapeSchool() }
        ]);
    }

    examineRoomFurther() {
        this.showDialogue('你仔细检查了整个房间，没有发现任何异常。也许你真的是太紧张了？但你还是觉得应该离开。', [
            { text: '离开宿舍', action: () => this.goToCorridor() }
        ]);
    }

    barricadeDoor() {
        this.showDialogue('你用行李箱顶住了门，感觉稍微安全了一些。但你知道这只是暂时的，必须想办法离开。', [
            { text: '等待天亮', action: () => this.waitForDawn() },
            { text: '冒险离开', action: () => this.goToCorridor() }
        ]);
    }

    followMap() {
        this.updateGameTime('22:45');
        this.showDialogue('你按照纸条上的地图指引，小心翼翼地向学校后门走去。一路上没有遇到什么异常，也许你真的能逃出去？', [
            { text: '继续前进', action: () => this.escapeSchool() }
        ]);
    }

    escapeDorm() {
        this.goToCorridor();
    }

    escapeSchool() {
        this.updateGameTime('23:55');
        this.completeChapter();
    }

    goToTeachingBuilding() {
        this.showDialogue('现在太晚了，教学楼已经锁门了。你应该先离开这里，明天再来调查。', [
            { text: '返回操场', action: () => this.goBackToQuadrangle() }
        ]);
    }

    talkToTeacher() {
        this.gameState.hasSeenGhost = true;
        this.showDeath('班主任慢慢地靠近你，嘴里喃喃自语："你不该来这里..."他的脸开始变形，变成了那个女孩的模样！');
    }

    waitForDawn() {
        this.showDialogue('你决定等到天亮再离开。时间一分一秒地过去，你不断看着手机上的时间。终于，凌晨5点的闹钟响了，天开始蒙蒙亮...', [
            { text: '离开宿舍', action: () => this.escapeAfterDawn() }
        ]);
    }

    escapeAfterDawn() {
        this.updateGameTime('05:00');
        this.completeChapter();
    }

    goToCorridor() {
        // 确保时间只能前进，不设置固定时间
        this.loadScene('corridor');
    }

    approachGirl() {
        this.gameState.hasSeenGhost = true;
        this.updateGameTime('21:45');
        this.showDeath('当你走近时，她慢慢抬起头——那是一张和你一模一样的脸！你惊恐地后退...');
    }

    fastLeaveCorridor() {
        this.updateGameTime('21:40');
        this.showDialogue('你加快脚步向前跑，感觉走廊的长度似乎在不断延伸，永远没有尽头...', [
            { text: '躲进图书馆', action: () => this.goToLibrary() },
            { text: '冲进卫生间', action: () => this.goToBathroom() }
        ]);
    }

    checkFootsteps() {
        this.gameState.hasSeenGhost = true;
        this.updateGameTime('21:45');
        this.showDialogue('你循声而去，在走廊转角处看到一个穿着校服的女生背对着你哭泣。', [
            { text: '上前安慰', action: () => this.approachGirl() },
            { text: '悄悄离开', action: () => this.fastLeaveCorridor() }
        ]);
    }

    continueCorridor() {
        this.updateGameTime('21:40');
        this.showDialogue('你决定不再理会那些奇怪的声音，继续向前走。走廊两侧有几个房间可以进入。', [
            { text: '图书馆', action: () => this.goToLibrary() },
            { text: '卫生间', action: () => this.goToBathroom() },
            { text: '校长办公室', action: () => this.goToPrincipalOffice() }
        ]);
    }

    checkBookshelf() {
        if (!this.gameState.hasKey) {
            this.gameState.hasKey = true;
            this.showDialogue('你在角落的书架上发现了一本奇怪的同学录，里面夹着一把铜钥匙。', [
                { text: '拿走钥匙', action: () => this.takeKey() },
                { text: '放回同学录', action: () => this.leaveKey() }
            ]);
        } else {
            this.showDialogue('书架上的书突然开始无风自动，仿佛有什么东西在翻阅它们...', [
                { text: '快速离开', action: () => this.escapeBookpile() }
            ]);
        }
    }

    approachMirror() {
        this.gameState.hasSeenGhost = true;
        this.updateGameTime('21:50');
        this.showDialogue('你擦干镜子上的水雾，却发现镜子里的你并没有和你同步动作，而是露出了诡异的微笑。', [
            { text: '仔细观察', action: () => this.showDeath('镜子里的你突然伸出手，将你拽进了镜子中...') },
            { text: '立刻离开', action: () => this.goToCorridor() }
        ]);
    }

    turnOnLight() {
        this.updateGameTime('22:00');
        this.showDialogue('灯光亮起，你看到办公桌上放着一份新生名单，你的名字旁边有一个红色的圈...', [
            { text: '查看名单', action: () => this.readDiary() },
            { text: '检查抽屉', action: () => this.checkDrawer() }
        ]);
    }

    searchInDark() {
        this.updateGameTime('22:00');
        this.showDialogue('你在黑暗中摸索，突然触碰到一个冰凉的物体，吓得你缩回了手。', [
            { text: '继续摸索', action: () => { this.gameState.hasSeenGhost = true; this.showDeath('你摸到了一只冰冷的手，紧接着传来一声凄厉的尖叫...'); } },
            { text: '打开灯', action: () => this.turnOnLight() }
        ]);
    }

    readDiary() {
        this.updateGameTime('22:10');
        this.showDialogue('日记里记录着一个学生的遭遇，他在三年前的今天消失在了这所学校...', [
            { text: '继续阅读', action: () => this.continueReading() },
            { text: '合上日记', action: () => this.closeDiary() }
        ]);
    }

    continueReading() {
        this.updateGameTime('22:12');
        this.showDialogue('日记的最后几页写得很潦草："不要相信镜子里的自己...""凌晨12点，一切都会改变...""她来找我了..."', [
            { text: '放回日记', action: () => this.goBackToCorridor() }
        ]);
    }

    closeDiary() {
        this.goBackToCorridor();
    }

    // 播放音效方法
    playSound(soundName) {
        try {
            if (soundName === 'ding' && this.horrorDing) {
                this.horrorDing.currentTime = 0;
                this.horrorDing.play().catch(e => console.log('音效播放失败:', e));
            } else if (soundName === 'horror' && this.horrorUp) {
                this.horrorUp.currentTime = 0;
                this.horrorUp.play().catch(e => console.log('音效播放失败:', e));
            }
        } catch (error) {
            console.log('音效播放错误:', error);
        }
    }

    // 打字机效果显示死亡消息
    showDeath(message) {
        // 播放死亡音效
        this.playSound('horror');

        this.elements.gameScreen.classList.add('hidden');
        this.elements.deathScreen.classList.remove('hidden');
        this.elements.deathMessage.textContent = '';

        let index = 0;
        const typeSpeed = 70; // 打字速度，毫秒/字符（比对话稍慢）

        // 清除任何正在进行的打字动画
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
        }

        // 开始打字动画
        this.typingInterval = setInterval(() => {
            if (index < message.length) {
                this.elements.deathMessage.textContent += message.charAt(index);
                index++;
            } else {
                clearInterval(this.typingInterval);
            }
        }, typeSpeed);
    }

    // 完成章节
    // 显示结算画面
    showResultScreen() {
        this.elements.gameScreen.classList.add('hidden');
        this.elements.resultScreen.classList.remove('hidden');

        // 显示章节名称和通关时间
        let chapterName = '';
        if (this.gameState.currentChapter === 'prologue') {
            chapterName = '序章-「新宿舍的第一晚」';
            // 显示下一章按钮
            this.elements.nextChapterBtn.classList.remove('hidden');
        } else if (this.gameState.currentChapter === 'chapter1') {
            chapterName = '第一章-「初见幽凄」';
            // 显示下一章按钮
            this.elements.nextChapterBtn.classList.remove('hidden');
        } else if (this.gameState.currentChapter === 'chapter2') {
            chapterName = '第二章-「深入诡域」';
            // 显示下一章按钮
            this.elements.nextChapterBtn.classList.remove('hidden');
        } else if (this.gameState.currentChapter === 'chapter3') {
            chapterName = '第三章-「宿命终结」';
            // 显示下一章按钮
            this.elements.nextChapterBtn.classList.remove('hidden');
        } else if (this.gameState.currentChapter === 'chapter4') {
            chapterName = '第四章-「黑暗边缘」';
            // 显示下一章按钮
            this.elements.nextChapterBtn.classList.remove('hidden');
        } else if (this.gameState.currentChapter === 'chapter4') {
            chapterName = '第四章-「最终章：黑暗边缘」';
            // 这是最终章，隐藏下一章按钮
            this.elements.nextChapterBtn.classList.add('hidden');
            // 显示返回章节选择按钮
            this.elements.backToChapterSelectBtn.classList.remove('hidden');
        }

        this.elements.resultChapter.textContent = chapterName;
        this.elements.resultTime.textContent = this.gameState.gameTime;
    }

    // 进入下一章
    goToNextChapter() {
        // 隐藏结算页面
        this.elements.resultScreen.classList.add('hidden');

        if (this.gameState.currentChapter === 'prologue') {
            // 保存序章的结束时间
            const endTime = this.gameState.gameTime;
            // 传递时间到第一章
            this.startGame('chapter1', endTime);
        } else if (this.gameState.currentChapter === 'chapter1') {
            // 传递时间到第二章
            const endTime = this.gameState.gameTime;
            this.startGame('chapter2', endTime);
        } else if (this.gameState.currentChapter === 'chapter2') {
            // 传递时间到第三章
            const endTime = this.gameState.gameTime;
            this.startGame('chapter3', endTime);
        } else if (this.gameState.currentChapter === 'chapter3') {
            // 传递时间到第四章
            const endTime = this.gameState.gameTime;
            this.startGame('chapter4', endTime);
        } else if (this.gameState.currentChapter === 'chapter4') {
            // 第四章是最终章，返回章节选择界面
            this.showChapterSelect();
        }
    }

    // 完成章节
    completeChapter() {
        // 播放LongScream音频
        const longScream = document.getElementById('long-scream');
        if (longScream) {
            longScream.currentTime = 0;
            longScream.play().catch(error => {
                console.error('播放LongScream音频失败:', error);
            });

            // 4秒后停止播放
            setTimeout(() => {
                if (!longScream.paused) {
                    longScream.pause();
                }
            }, 4000);
        }

        if (this.gameState.currentChapter === 'prologue') {
            // 解锁第一章
            this.unlockChapter('chapter1');
        } else if (this.gameState.currentChapter === 'chapter1') {
            // 解锁第二章
            this.unlockChapter('chapter2');
        } else if (this.gameState.currentChapter === 'chapter2') {
            // 解锁第三章
            this.unlockChapter('chapter3');
        } else if (this.gameState.currentChapter === 'chapter3') {
            // 解锁第四章
            this.unlockChapter('chapter4');
        } else if (this.gameState.currentChapter === 'chapter4') {
            // 第四章是最终章，不解锁新章节
            console.log('已完成最终章');
        }

        // 显示结算画面
        this.showResultScreen();
    }

    // 返回章节选择
    returnToChapterSelect() {
        // 清除时间更新定时器
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
        this.elements.gameScreen.classList.add('hidden');
        this.elements.deathScreen.classList.add('hidden');
        this.elements.resultScreen.classList.add('hidden');
        this.elements.chapterSelectScreen.classList.remove('hidden');
    }

    // 已删除重复的restartGame方法定义
    // 保留下面的版本，使用统一的unlockedChaptersKey


    // 加载已解锁章节
    loadUnlockedChapters(unlockedChaptersKey) {
        try {
            const saved = localStorage.getItem(unlockedChaptersKey);
            return saved ? JSON.parse(saved) : ['prologue'];
        } catch (e) {
            console.error('Failed to load unlocked chapters:', e);
            return ['prologue'];
        }
    }

    // 保存已解锁章节
    saveUnlockedChapters() {
        try {
            localStorage.setItem(
                this.gameState.unlockedChaptersKey,
                JSON.stringify(this.gameState.unlockedChapters)
            );
        } catch (e) {
            console.error('Failed to save unlocked chapters:', e);
        }
    }

    // 重启游戏
    restartGame() {
        // 清除时间更新定时器
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }

        // 重置游戏状态，但保留已解锁章节
        const unlockedChapters = this.gameState.unlockedChapters;
        this.gameState = {
            playerName: this.gameState.playerName,
            playerGender: this.gameState.playerGender,
            currentScene: 'start',
            currentChapter: '',
            gameTime: '21:00',
            plotProgress: 0,
            inventory: [],
            hasKey: false,
            hasSeenGhost: false,
            unlockedChapters: unlockedChapters,
            unlockedChaptersKey: 'schoolHorrorGame_unlockedChapters'
        };

        // 重置界面
        this.elements.deathScreen.classList.add('hidden');
        this.elements.startScreen.classList.remove('hidden');
        this.elements.playerNameInput.value = this.gameState.playerName;
        if (this.gameState.playerGender === 'male') {
            this.elements.maleOption.classList.add('selected');
        } else {
            this.elements.femaleOption.classList.add('selected');
        }
        this.checkStartConditions();
    }

    // 更新游戏时间（确保时间只能前进）
    updateGameTime(time) {
        // 解析当前时间和新时间
        const currentTime = this.parseTime(this.gameState.gameTime);
        const newTime = this.parseTime(time);

        // 只有当新时间晚于当前时间时才更新
        if (newTime > currentTime) {
            this.gameState.gameTime = time;
            this.elements.currentTimeDisplay.textContent = time;
        }
    }

    // 解析时间字符串为分钟数（用于比较）
    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // 启动自动时间更新（每30秒更新一次）
    startAutoTimeUpdate() {
        // 清除任何现有的定时器
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
        }

        // 设置新的定时器（30秒更新一次）
        this.timeUpdateInterval = setInterval(() => {
            // 解析当前时间
            const [hours, minutes] = this.gameState.gameTime.split(':').map(Number);

            // 增加1分钟
            let newMinutes = minutes + 1;
            let newHours = hours;

            // 处理小时进位
            if (newMinutes >= 60) {
                newMinutes = 0;
                newHours += 1;
            }

            // 处理24小时制
            if (newHours >= 24) {
                newHours = 0;
            }

            // 格式化新时间
            const newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;

            // 更新游戏时间
            this.updateGameTime(newTime);
        }, 30000); // 30秒
    }

    // 其他可能的辅助方法（保留基础功能）

    // 返回主界面
    backToMainScreen() {
        // 隐藏章节选择界面
        this.elements.chapterSelectScreen.classList.add('hidden');
        // 显示主界面
        this.elements.startScreen.classList.remove('hidden');
        // 重置章节选择相关状态
        this.gameState.selectedChapter = null;
    }

    // 显示自制章节介绍信息
    showCustomChapterInfo() {
        // 创建图片容器
        const infoContainer = document.createElement('div');
        infoContainer.id = 'custom-chapter-info';
        infoContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            cursor: pointer;
        `;

        // 创建提示文字
        const hintText = document.createElement('div');
        hintText.textContent = '点击任意处关闭图片';
        hintText.style.cssText = `
            color: white;
            font-size: 18px;
            margin-bottom: 20px;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        `;

        // 创建图片元素
        const infoImage = document.createElement('img');
        infoImage.src = 'assets/img/介绍.png';
        infoImage.style.cssText = `
            max-width: 90%;
            max-height: 80%;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        `;

        // 添加到容器
        infoContainer.appendChild(hintText);
        infoContainer.appendChild(infoImage);
        document.body.appendChild(infoContainer);

        // 点击任意处关闭
        infoContainer.addEventListener('click', () => {
            if (infoContainer.parentNode) {
                infoContainer.parentNode.removeChild(infoContainer);
            }
        });
    }
}

// 游戏初始化
window.addEventListener('DOMContentLoaded', () => {
    const game = new SchoolHorrorGame();
});