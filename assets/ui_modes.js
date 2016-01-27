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
        display.drawText(1,1,"Welcome to CellDOM",fg,bg);
        display.drawText(1,3,"n for new game",fg,bg);
        display.drawText(1,5,"t for tutorial",fg,bg);
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
        if (inputData.charCode == 110) { // ignore the various modding keys - control, shift, etc.
            this.newGame(); 
            Game.switchUiMode(Game.UIMode.gamePlay); 
        }
        else if(inputData.charCode == 116){
            window.location = "tutorial.html"; 
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
        ro++;
        display.drawText(1,ro++, "Survived: " + avatar.survived);
        display.drawText(1,ro++, "Score:    " + avatar.survived);

        ro += 2;
        display.drawText(1,ro++, "Commands:");
        display.drawText(3,ro++, "w↑, a←, s↓, d→");
        //display.drawText(3,ro++, "h←, j↓, k↑, l→");
        ["q", "e", "r", "t", "z", "c", "f"].forEach(function (c) {
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

        var ro = 20;
        display.drawText(1,ro++, "Orders given:");
        avatar.moveStrategyStack.forEach(function (s) {
            var name = Game.CellMoveStrategies[s[0]].summary || s[0];
            if (s[1] < 0) {
                display.drawText(3,ro++, name);
            }
            else {
                var turn = s[1] === 1 ? " turn)" : " turns)";
                display.drawText(3,ro++, name + " (" + s[1] + turn);
            }
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
                case "f":
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

        map.createEntityAroundPos( avatar.getPos(), 20, 3, Game.creationFormats.cellFollower );

        map.createEntityRandomPos( 15, Game.creationFormats.directionalSwarmer );
        map.createEntityRandomPos( 10, Game.creationFormats.wanderer );

        //other cells

        map.createEntityRandomPos( 25, Game.creationFormats.groupInfector );
        map.createEntitiesAroundRandomPos( 6, 4, 3, Game.creationFormats.clumpSwarmer );
        map.createEntitiesAroundRandomPos( 2, 15, 4, Game.creationFormats.corrupter );
        
        map.createEntityRandomPos( 20, Game.creationFormats.flytrap );
        map.createEntityRandomPos( 35, Game.creationFormats.wanderer );
        //map.createEntitiesAroundRandomPos( 2, 4, 3, Game.creationFormats.assassinSwarm );

        //other cell groups

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
        var avatar = Game.UIMode.gamePlay.getAvatar();
        var state = this.state = {
            turns: avatar.survived,
            score: avatar.score,
            lock: true
        }
        setTimeout(function () {
            delete state.lock;
        }, 1000);
    },
    exit: function () {
    },
    render: function (display) {
        display.drawText(1,1,"You lost :(");
        display.drawText(1,3,
                "You survived " + this.state.turns + " turns, " +
                "and accumulated " + this.state.score + " points " +
                "while your cells lived.");
        display.drawText(1,5,"Press any key to continue");
    },
    handleInput: function (inputType,inputData) {
        if (this.state.lock) return;
        Game.switchUiMode(Game.UIMode.gameStart);
    },
    state: {},
};
