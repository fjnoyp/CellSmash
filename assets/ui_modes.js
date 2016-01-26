Game.UIMode = {};
Game.UIMode.DEFAULT_COLOR_FG = '#fff';
Game.UIMode.DEFAULT_COLOR_BG = '#000';

Game.UIMode.gameStart = {
    enter: function () {
        Game.Message.send("Welcome to CellDOM");
        Game.refresh();
    },
    exit: function () {
        Game.refresh();
    },
    render: function (display) {
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        display.drawText(1,1,"game start",fg,bg);
        display.drawText(1,3,"press any key to continue",fg,bg);
    },
    newGame: function () {
        Game.DATASTORE = {};
        Game.DATASTORE.MAP = {};
        Game.DATASTORE.ENTITY = {};
        Game.initializeTimingEngine();
        Game.setRandomSeed(5 + Math.floor(Game.TRANSIENT_RNG.getUniform()*100000));
        Game.UIMode.gamePlay.setupNewGame();
        Game.switchUiMode(Game.UIMode.gamePlay);
    },
    handleInput: function (inputType,inputData) {
        if (inputData.charCode !== 0) { // ignore the various modding keys - control, shift, etc.
            this.newGame(); 
            Game.switchUiMode(Game.UIMode.gamePlay); 
        }
    }
};

Game.UIMode.gamePlay = {
    attr: {
        _mapId: '',
        _cameraX: 100,
        _cameraY: 100,
        _avatarId: ''
    },
    JSON_KEY: 'uiMode_gamePlay',
    enter: function () {
        if (this.attr._avatarId) {
            this.setCameraToAvatar();
        }
        //Game.TimeEngine.unlock();
        Game.refresh();
        //this.getAvatar().raiseEntityEvent('actionDone');
    },
    exit: function () {
        Game.refresh();
        //Game.TimeEngine.lock();
    },
    getMap: function () {
        return Game.DATASTORE.MAP[this.attr._mapId];
    },
    setMap: function (m) {
        this.attr._mapId = m.getId();
    },
    getAvatar: function () {
        return Game.DATASTORE.ENTITY[this.attr._avatarId];
    },
    setAvatar: function (a) {
        this.attr._avatarId = a.getId();
    },
    render: function (display) {
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        this.getMap().renderOn(display,this.attr._cameraX,this.attr._cameraY);
    },
    renderAvatarInfo: function (display) {
        var avatar = this.getAvatar();

        var ro = 1;
        display.drawText(1,ro++, "avatar x: " + this.getAvatar().getX());
        display.drawText(1,ro++, "avatar y: " + this.getAvatar().getY());
        display.drawText(1,ro++, "Swarm:    " + avatar.childrenCells.size);

        var ro = 5;
        display.drawText(1,ro++, "Orders given:");
        avatar.moveStrategyStack.forEach(function (s) {
            if (ro > 9) return;
            var name = Game.CellMoveStrategies[s[0]].summary || s[0];
            if (s[1] < 0) {
                display.drawText(3,ro++, name);
            }
            else {
                var turn = s[1] === 1 ? " turn)" : " turns)";
                display.drawText(3,ro++, name + " (" + s[1] + turn);
            }
        });
        if (ro > 9) {
            display.drawText(3,ro, "[... more ...]");
        }

        var ro = 12;
        display.drawText(1,ro++, "Commands:");
        display.drawText(3,ro++, "w↑, a←, s↓, d→");
        //display.drawText(3,ro++, "h←, j↓, k↑, l→");
        ["q", "e", "r", "t", "z", "c"].forEach(function (c) {
            var args = avatar.changeStrategyMap[c];
            if (!args) return;
            var uses = avatar.strategyUses[args[0]];
            if (uses <= 0) return;
            var name = Game.CellMoveStrategies[args[0]].summary || args[0];

            var desc = "["+c+"] " + name;
            if (uses > 0) {
                desc += " (" + uses + ")";
            }
            display.drawText(3,ro++, desc);
        });
    },
    moveAvatar: function (dx,dy) {
        if (this.getAvatar().tryWalk(this.getMap(),dx,dy)) {
            this.setCameraToAvatar();
            return true;
        }
        return false;
    },
    moveCamera: function (dx,dy) {
        this.setCamera(this.attr._cameraX + dx,this.attr._cameraY + dy);
    },
    setCamera: function (sx,sy) {
        this.attr._cameraX = Math.min(Math.max(0,sx),this.getMap().getWidth());
        this.attr._cameraY = Math.min(Math.max(0,sy),this.getMap().getHeight());
        //Game.renderDisplayMain();
    },
    setCameraToAvatar: function () {
        this.setCamera(this.getAvatar().getX(),this.getAvatar().getY());
    },
    handleInput: function (inputType,inputData) {
        var tookTurn = false;
        if (inputType == 'keypress') {

            // NOTE: a lot of repeated call below - think about where/how that might be done differently...?
            var pressedKey = String.fromCharCode(inputData.charCode);
            if (inputData.keyIdentifier == 'Enter') {
                Game.switchUiMode(Game.UIMode.gameWin);
                return;
            }

            switch (pressedKey) {
                case "k":
                case "w":
                    this.moveAvatar(0,-1);
                    break;
                case "h":
                case "a":
                    this.moveAvatar(-1,0);
                    break;
                case "j":
                case "s":
                    this.moveAvatar(0,1);
                    break;
                case "l":
                case "d":
                    this.moveAvatar(1,0);
                    break;
                case "q":
                case "e":
                case "r":
                case "t":
                case "c":
                case "z":
                    this.getAvatar().raiseEntityEvent("cellChange", {keyPress: pressedKey});
                    break;
            }

            if (tookTurn) {
                this.getAvatar().raiseEntityEvent('actionDone');
                Game.Message.ageMessages();
                return true;
            }
        }
    },
    setupNewGame: function () {
        var map = new Game.Map('blankMap');
        this.setMap(map);

        var avatar = Game.EntityGenerator.create('avatar');
        this.setAvatar(avatar);

        this.getMap().addEntity(avatar, map.getRandomWalkableLocation());
        this.setCameraToAvatar();

        //our cells
        Game.creationFormats.cellFollower.parentCell  = avatar;
        Game.creationFormats.cellFollower.targetEntity = avatar;
        map.createEntityAroundPos( avatar.getPos(), 10, 10, Game.creationFormats.cellFollower );

        map.createEntityRandomPos( 25, Game.creationFormats.groupInfector );
        map.createEntitiesAroundRandomPos( 2, 4, 3, Game.creationFormats.clumpSwarmer );
        map.createEntitiesAroundRandomPos( 2, 4, 3, Game.creationFormats.assassinSwarm );
        map.createEntityRandomPos( 20, Game.creationFormats.flytrap );
        map.createEntityRandomPos( 35, Game.creationFormats.wanderer );


        //parent cell
        Game.creationFormats.cellLeader.fg = '#F345CA';
        var parentCell = map.createEntity(map.getRandomWalkableLocation(), Game.creationFormats.cellLeader );

        //children cells
        Game.creationFormats.cellFollower.parentCell = parentCell;
        Game.creationFormats.cellFollower.targetEntity = parentCell;
        Game.creationFormats.cellFollower.fg = Game.creationFormats.cellLeader.fg;
        map.createEntityAroundPos( parentCell.getPos(), 30, 10, Game.creationFormats.cellFollower );


        //map.createEntityAroundPos( map.getRandomWalkableLocation(), 40, 10, Game.creationFormats.corrupter );
    },
};

Game.UIMode.gameWin = {
    enter: function () {
        console.log('game winning');
    },
    exit: function () {
    },
    render: function (display) {
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        display.drawText(1,1,"You WON!!!!",fg,bg);
    },
    handleInput: function (inputType,inputData) {
        Game.Message.clear();
    }
};

Game.UIMode.gameLose = {
    enter: function () {
        console.log('game losing');
    },
    exit: function () {
    },
    render: function (display) {
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        display.drawText(1,1,"You lost :(",fg,bg);
    },
    handleInput: function (inputType,inputData) {
        Game.Message.clear();
    }
};
