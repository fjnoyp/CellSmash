Game.CellMoveEnum = {
    CIRCLE_AROUND : 'circle around targetEntity position'
}

Game.CellMoveStrategies = {
    _circleAround: function(ourPos ,targetPos){
        var x = ourPos.x;
        var y = ourPos.y;
        var del = {x:0, y:0};
        var dist2 = Math.pow(targetPos.y-y, 2) + Math.pow(targetPos.x-x, 2);

        x += 4*(Math.random() - Math.random());
        y += 4*(Math.random() - Math.random());
        var ang = Math.atan2(targetPos.y-y, targetPos.x-x);

        var chg = Math.PI/2 + Math.PI/dist2 - Math.random() * Math.PI/6;
        if (Math.sqrt(dist2) & 2) chg *= -1;
        ang += chg;

        var sin = Math.sin(ang), cos = Math.cos(ang);
        if (Math.abs(sin) > 0.5) del.y = Math.abs(sin) / sin;
        if (Math.abs(cos) > 0.5) del.x = Math.abs(cos) / cos;
        return del;
    },

    _moveToDist: function(ourPos, targetPos, minDist, maxDist){
        var moveDeltas = {x:0, y:0};

        var difX = targetPos.x - ourPos.x;
        var difY = targetPos.y - ourPos.y;

        var sqrDist = Math.pow(difX,2) + Math.pow(difY,2);

        //move toward
        if( sqrDist > maxDist || sqrDist < minDist){
            if(Math.abs(difX) > Math.abs(difY)){ moveDeltas.x = Game.util.clamp(difX, -1, 1); }
            else{ moveDeltas.y = Game.util.clamp(difY, -1, 1); }

            //move away
            if(sqrDist < minDist){
                if(moveDeltas.x !== 0){
                    moveDeltas.x = moveDeltas.x * -1;
                }
                if(moveDeltas.y !== 0){
                    moveDeltas.y = moveDeltas.y * -1;
                }
            }
        }
        return moveDeltas;
    },

    _moveToward: function (ourPos, targetPos) {
        var difX = targetPos.x - ourPos.x, absX = Math.abs(difX);
        var difY = targetPos.y - ourPos.y, absY = Math.abs(difY);
        var scale = Math.max(absX, absY);

        return {
            x: Math.random() < absX/scale ? difX/absX : 0,
            y: Math.random() < absY/scale ? difY/absY : 0
        };
    },

    //NOTE: method refers to map, use call to ensure proper scoping
    _moveToInfect: function (pos) {
        var x = pos.x, y = pos.y;

        var neighbours = [];
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                var en = this.getMap().getEntity(x+dx, y+dy);
                if (en && en.isInfectable && !en.isSameCellType(this)) {
                    neighbours.push({x:dx,y:dy});
                }
            }
        }
        if (neighbours.length > 0) {
            return neighbours.random();
        }
        return {x:0,y:0};
    },

    "Corrupter" : {
        getMoveDeltas: function(){
            //return Game.CellMoveStrategies._moveToInfect.call(this,this.getPos());
            return Game.CellMoveStrategies.ClumpTogether.getMoveDeltas(this);
        }
    },

    "LocalMower" : {
        getMoveDeltas: function () {
            if(!this.desiredDist) this.desiredDist = 240;
            else if(this.desiredDist === 0) this.desiredDist = 240;

            this.desiredDist -= 3;

            if (this.desiredDist % 2 == 0) {
                return Game.CellMoveStrategies._moveToDist( this.getPos(), {x:30,y:30}, this.desiredDist, this.desiredDist);
            }
            else {
                return Game.CellMoveStrategies._circleAround( this.getPos(), {x:30, y:30} );
            }
        }
    },

    "ClumpSwarmer": {
        getMoveDeltas: function () {
            var us = this.getPos();
            var friends = [], enemies = [];

            for (var dx = -6; dx <= 6; dx++) {
                for (var dy = -6; dy <= 6; dy++) {
                    var en = this.getMap().getEntity(us.x+dx, us.y+dy);
                    if (en && en.isInfectable) {
                        if (en.isSameCellType(this)) {
                            friends.push(en);
                        }
                        else {
                            enemies.push(en);
                        }
                    }
                }
            }

            if (friends.length > 0) {
                this.targetEntity = friends.random().targetEntity || this.targetEntity;
            }

            if (!this.targetEntity || !this.targetEntity.isInfectable
                    || this.targetEntity.isSameCellType(this)) {
                this.targetEntity = enemies.random();
            }

            if (!this.targetEntity) {
                return Game.CellMoveStrategies.RandomSweep.getMoveDeltas.call(this);
            }

            var it = this.targetEntity.getPos();

            if (Math.random() > .1){
                return Game.CellMoveStrategies._circleAround(us, it);
            }
            else {
                return Game.CellMoveStrategies._moveToward(us, it);
            }
        }
    },

    "GroupInfector" : {
        getMoveDeltas: function() {
            var us = this.getPos();

            var closeEnemies = [];
            var totalEnemies = 0;
            var totalFriends = 0;
            for (var dx = -2; dx <= 2; dx++) {
                for (var dy = -2; dy <= 2; dy++) {
                    var en = this.getMap().getEntity(us.x+dx, us.y+dy);
                    if (en && en.isInfectable) {
                        if (en.isSameCellType(this)) {
                            totalFriends++;
                        }
                        else {
                            totalEnemies++;
                            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                                closeEnemies.push({x:dx,y:dy})
                            }
                        }
                    }
                }
            }

            if (closeEnemies.length > 0 && totalFriends < 3) {
                return closeEnemies.random();
            }
            return {x:0, y:0};
        }
    },

    "AssassinSwarm": {
        getMoveDeltas: function () {
            var us = this.getPos();
            var friends = [], enemies = [];

            for (var dx = -6; dx <= 6; dx++) {
                for (var dy = -6; dy <= 6; dy++) {
                    var en = this.getMap().getEntity(us.x+dx, us.y+dy);
                    if (en && en.isInfectable) {
                        if (en.isSameCellType(this)) {
                            friends.push(en);
                        }
                        else {
                            enemies.push(en);
                        }
                    }
                }
            }

            if (friends.length > 0) {
                this.targetEntity = friends.random().targetEntity || this.targetEntity;
            }

            if (!this.targetEntity || !this.targetEntity.isInfectable
                    || this.targetEntity.isSameCellType(this)) {
                this.targetEntity = enemies.random();
            }

            if (!this.targetEntity) {
                return Game.CellMoveStrategies.RandomSweep.getMoveDeltas.call(this);
            }

            var it = this.targetEntity.getPos();
            var dx = it.x-us.x, dy = it.y-us.y;
            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                return {x:dx, y:dy};
            }
            else {
                var dist = dx*dx+dy*dy;
                if (8 < dist && dist < 40 && friends.length > 10) {
                    return Game.CellMoveStrategies._circleAround(us, it);
                }
                else {
                    return Game.CellMoveStrategies._moveToward(us, it);
                }
            }
        }
    },

    "CircleAround" : {
        getMoveDeltas: function(){
            var moveDeltas = Game.CellMoveStrategies._moveToward(
                    this.getX(),
                    this.getY(),
                    this.getTargetEntity().getPos(),
                    40, 60);
            if(moveDeltas.x === 0 && moveDeltas.y === 0){
                return Game.CellMoveStrategies._circleAround(
                        this.getPos(),
                        this.getTargetEntity().getPos() );
            }
            return moveDeltas;
        },
    },

    "RandomSweep": {
        getMoveDeltas: function () {
            if (!this.targetPos) {
                this.targetPos = this.getMap().getRandomWalkableLocation();

                if (this.childrenCells) {
                    this.raiseEntityEvent('cellChange', {
                        keyPress: 'q'
                    });
                }
            }

            var deltas;
            if (Math.random() < 0.8) {
                deltas = Game.CellMoveStrategies._moveToward(
                        this.getPos(),
                        this.targetPos);
            }
            else {
                deltas = Game.CellMoveStrategies._circleAround(
                        this.getX(),
                        this.getY(),
                        this.targetPos);
            }

            if ((deltas.x === 0 && deltas.y === 0) || Math.random() < 0.01) {
                this.targetPos = null;
            }

            return deltas;
        }
    },

    "OpportunisticMurder" : {
        getMoveDeltas: function () {
            var moveDeltas = Game.CellMoveStrategies._moveToInfect.call(this,this.getPos());
            return moveDeltas || this.getMoveDeltas();
        },

        "MurderSafely" : function () {
            var murder = Game.CellMoveStrategies._moveToInfect.call(this, this.getPos());
            if (murder) return murder;

            var tries = 100;
            var deltas, danger;
            do {
                deltas = Game.CellMoveStrategies._circleAround(
                        this.getPos(),
                        this.getTargetEntity().getPos() );
                danger = Game.CellMoveStrategies._moveToInfect.call(this, {
                    x: this.getX() + deltas.x,
                    y: this.getY() + deltas.y,
                });
            } while (danger && --tries);
            return deltas;
        }
    },

    "CircleSafely" : {
        getMoveDeltas: function () {
            var tries = 100;
            var deltas, danger;
            do {
                deltas = Game.CellMoveStrategies._circleAround(
                        this.getPos(),
                        this.getTargetEntity().getPos() );
                danger = Game.CellMoveStrategies._moveToInfect.call(this, {
                    x: this.getX() + deltas.x,
                    y: this.getY() + deltas.y,
                });
            } while (danger && --tries);
            return deltas;
        }
    },

    "CircleAround" : {
        getMoveDeltas: function () {
            return Game.CellMoveStrategies._circleAround(
                    this.getPos(),
                    this.getTargetEntity().getPos());
        }
    },

    "ClusterAround" : {
        getMoveDeltas: function () {
            var targetPos = this.getTargetEntity().getPos();
            var difX = targetPos.x - this.getX();
            var difY = targetPos.y - this.getY();

            if(difX == 0){difX = Math.round( 2*Math.random() - 1 );}
            if(difY == 0){difY = Math.round( 2*Math.random() - 1 );}

            var moveDeltas = {x: Game.util.clamp(difX, -1, 1),
                y: Game.util.clamp(difY, -1, 1)};

            var entity = this.getMap().getEntity( this.getX() + moveDeltas.x, this.getY() + moveDeltas.y);
            if( entity && entity.isSameCellType && entity.isSameCellType(this) ){

                if(moveDeltas.y === 0){
                    moveDeltas.x = Game.util.randomNegInt();
                }
                else if(moveDeltas.x === 0){
                    moveDeltas.y = Game.util.randomNegInt();
                }
                else{
                    if(Math.random() > .5){
                        moveDeltas.x = 0;
                    }
                    else{
                        moveDeltas.y = 0;
                    }
                }
            }

            return moveDeltas;
        }
    },

    "WanderAround" : {
        getMoveDeltas: function () {
            return this.getMoveDeltas();
        }
    },

    "ClumpTogether" : {
        getMoveDeltas : function () {
            this.count = this.count || (4*Math.random()|0);
            this.count++;
            var angle = this.count * Math.PI/2;
            return {
                x: Math.round(Math.sin(angle)),
                y: Math.round(Math.cos(angle))
            };
        }
    },

    "ClusterMove" : {
        getMoveDeltas : function () {
            var neighborCount = 0;
            var ourX = this.getX();
            var ourY = this.getY();
            for (var x = -1; x <= 1; x++){
                for (var y = -1; y <= 1; y++){
                    var entity = this.getMap().getEntity(ourX+x, ourY+y);
                    if (entity && entity.isSameCellType && entity.isSameCellType(this)){
                        neighborCount++;
                    }
                }
            }
            if (neighborCount > 1){
                return Game.CellMoveStrategies.ClumpTogether.getMoveDeltas.call(this);
            }
            else {
                return Game.CellMoveStrategies.CircleAround.getMoveDeltas.call(this);
            }
        }
    },

    "NoMove": {
        getMoveDeltas : function () {
            return {x:0, y:0};
        }
    },

    "InfectInDir": {
        getMoveDeltas : function(){
            if(!this.infectionDir){
                this.infectionDir
            }
        }
    }



};


Game.EntityMixin = {};

// Mixins have a META property is is info about/for the mixin itself and then all other properties. The META property is NOT copied into objects for which this mixin is used - all other properies ARE copied in.

Game.EntityMixin.WalkerCorporeal = {
    META: {
        mixinName: 'WalkerCorporeal',
        mixinGroup: 'Walker'
    },
    tryWalk: function (map,dx,dy) {
        var targetX = Math.min(Math.max(0,this.getX() + dx),map.getWidth()-1);
        var targetY = Math.min(Math.max(0,this.getY() + dy),map.getHeight()-1);
        if (map.getEntity(targetX,targetY)) { // can't walk into spaces occupied by other entities

            this.raiseEntityEvent('bumpEntity',{actor:this,recipient:map.getEntity(targetX,targetY)});
            // NOTE: should bumping an entity always take a turn? might have to get some return data from the event (once event return data is implemented)
            return true;
        }
        var targetTile = map.getTile(targetX,targetY);
        if (targetTile.isWalkable()) {
            // console.log('tryWalk - walkable: '+this.getName());
            this.setPos(targetX,targetY);
            var myMap = this.getMap();
            if (myMap) {
                myMap.updateEntityLocation(this);
            }
            return true;
        } else {
            this.raiseEntityEvent('walkForbidden',{target:targetTile});
        }
        return false;
    }
};

//#############################################################################
// ENTITY ACTORS / AI

Game.EntityMixin.CellMove = {
    META: {
        mixinName: 'CellMove',
        mixinGroup: 'Cell',
        listeners: {
            'takeTurn': function(evtData){
                //Move strategies, note MoveStrategy called from calling cell's scope
                moveDeltas = this.moveStrategy.getMoveDeltas.call(this);

                //DO WALK
                if (this.hasMixin('Walker')) {
                    this.tryWalk(this.getMap(), moveDeltas.x, moveDeltas.y);
                }

            }
        },
    },
    getMoveDeltas: function () {
        return Game.util.positionsAdjacentTo({x:0,y:0}).random();
    },

};

//Manages children cells of cell conglomerates
Game.EntityMixin.CellController = {
    META: {
        mixinName: 'CellController',
        mixinGroup: 'Cell',
        listeners: {
            //pass cell change event to all children cells
            'cellChange': function(evtData) {
                if (evtData.keyPress === 'q') {
                    this.curMoveStrategy = Game.CellMoveStrategies["ClusterAround"];
                }
                else if (evtData.keyPress === 'e') {
                    this.curMoveStrategy = Game.CellMoveStrategies["CircleAround"];
                }
                else if (evtData.keyPress === 'r') {
                    this.curMoveStrategy = Game.CellMoveStrategies["ClusterMove"];
                }
                else if (evtData.keyPress === 't') {
                    this.curMoveStrategy = Game.CellMoveStrategies["NoMove"];
                }
                else if (evtData.keyPress === 'z') {
                    this.curMoveStrategy = Game.CellMoveStrategies["AssassinSwarm"];
                }

                evtData = {};
                evtData.moveStrategy = this.curMoveStrategy;

                this.childrenCells.forEach(function (child) {
                    child.raiseEntityEvent('cellChange', evtData);
                });

            },
        },
        init: function(template){
            this.childrenCells = new Set();
        },
    },
    childrenCells: null,
    curMoveStrategy: Game.CellMoveStrategies["CircleAround"],

    //WARNING NOTE EXTRA REFERENCE, POSSIBLE MEMORY LEAK WITHOUT EXPLICIT REMOVAL
    addChildrenCell: function(cellEntity){
        this.childrenCells.add(cellEntity);
    },

    removeChildrenCell: function(cellEntity){
        this.childrenCells.delete(cellEntity);
    }
};

Game.EntityMixin.CellInfect = {
    META: {
        mixinName: 'CellInfect',
        mixinGroup: 'Cell',
        listeners: {
            'bumpEntity': function(evtData){

                //infect can mean changing behavior and/or appearance of other cell, other cell can also have resistances, cellInformation will probably expose all relevant information about cell, method set to allow for this
                //evtData.receipient.raiseEntityEvent('infect',);
                if (this.canInfect){
                    var recipient = evtData.recipient;
                    if (recipient.setAppearance && !recipient.isSameCellType(this) && recipient.getIsInfectable()) {
                        //always copy same apperance regardless of infection package
                        recipient.setAppearance(this.getFg(), this.getChar());

                        //this allows cells to infect another cell but not neccessarily make a copy of itself
                        if (this.infectionPackage) {
                            if(this.infectionPackage.moveStrategy){
                                recipient.setMoveStrategy(this.infectionPackage.moveStrategy);
                            }
                            if(this.infectionPackage.infectionPackage){
                                recipient.setInfectionPackage(this.infectionPackage.infectionPackage);
                            }
                            if(this.infectionPackage.chr){
                                recipient.setChar(this.infectionPackage.chr);
                            }
                        }
                        else {
                            var exparent = recipient.getParentCell();

                            recipient.setInfectionPackage(null);
                            recipient.setMoveStrategy(this.getMoveStrategy());
                            recipient.setParentCell(this.getParentCell());
                            recipient.setTargetEntity(this.getTargetEntity());

                            if (exparent) {
                                exparent.raiseEntityEvent('childInfected', {
                                    infector: this,
                                    infectee: recipient
                                });
                            }
                        }
                    }
                }
            }
        }
    },

    infectionPackage : null,

    setInfectionPackage : function(infectionPackage){
        this.infectionPackage = infectionPackage;
    },
    getInfectionPackage : function(){
        return this.infectionPackage;
    }
};

//Individual cell memory and identification
// !!! Should be attached to all cells !!!
Game.EntityMixin.CellStateInformation = {
    META: {
        mixinName: 'CellStateInformation',
        mixinGroup: 'Cell',
        listeners: {
            'cellChange': function(evtData){
                this.setTargetEntity(this.getParentCell());
                this.setMoveStrategy(evtData.moveStrategy);
                //this.moveStrategy = evtData.curMoveStrategy;
            }
        },
        init: function(template){
            Game.Actors.add(this);
            //this.targetEntity = Game.UIMode.gamePlay.getAvatar();
        },
    },

    //    moveStrategy: "WanderAround",
    moveStrategy: Game.CellMoveStrategies["WanderAround"],
    parentCell: null,
    canInfect: true,
    isInfectable : true,
    targetEntity : null,

    getTargetEntity : function(){ return this.targetEntity; },
    setTargetEntity: function(targetEntity){ this.targetEntity = targetEntity; },

    getParentCell: function(){
        return this.parentCell;
    },

    setMoveStrategy: function(moveStrategy){
        if(typeof moveStrategy === 'string'){
            this.moveStrategy = Game.CellMoveStrategies[moveStrategy];
        }
        else{
            this.moveStrategy = moveStrategy;
        }
    },

    getMoveStrategy: function(){
        return this.moveStrategy;
    },

    setParentCell: function(parentCell){
        if(this.parentCell != null){
            this.parentCell.removeChildrenCell(this);
        }

        this.parentCell = parentCell;

        if(parentCell){
            parentCell.addChildrenCell(this);
        }
    },

    setAppearance: function(fg, chr){
        this.setChar(chr);
        this.setFg(fg);
    },

    isSameCellType: function(otherCell){
        //return otherCell.getParentCell() == this.getParentCell();
        return otherCell.getFg() == this.getFg();
    },

    setCanInfect: function(canInfect){
        this.canInfect = canInfect;
    },

    getIsInfectable: function(){
        return this.isInfectable;
    },

    setIsInfectable: function(isInfectable){
        this.isInfectable = isInfectable;
    },

    doTurn: function(){
        this.raiseEntityEvent('takeTurn', null);
    }

};

Game.EntityMixin.EnemyAvatar = {
    META: {
        mixinName: 'EnemyAvatar',
        mixinGroup: 'Avatar',
        listeners: {
            'childInfected': function (evtData) {
                if (this.childrenCells.size <= 0) {
                    Game.switchUiMode(Game.UIMode.gameWin);
                }
            }
        }
    },
};


Game.EntityMixin.Avatar = {
    META: {
        mixinName: 'Avatar',
        mixinGroup: 'Avatar',
        listeners: {
            'childInfected': function (evtData) {
                if (this.childrenCells.size <= 0) {
                    Game.switchUiMode(Game.UIMode.gameLose);
                }
            }
        }
    },
};

Game.EntityMixin.Growable = {
    META: {
        mixinName: 'Growable',
        mixinGroup: 'Growable',
        listeners: {
            'takeTurn': function(evtData){
                if(this.curTime % this.growTime === 0){
                    this.grow();
                }
                this.curTime ++;

                if(this.curTime > 300){
                    this.destroy();
                }
            }
        },
    },
    growTime: 200,
    curTime: 1,
    growDir: {x:0,y:1},
    grow: function(x,y){
        this.spread( this.getX(), this.getY(), {x: Game.util.randomInt(-1,1), y: Game.util.randomInt(-1,1)} );
    },
    spread: function(x,y, growDir){

        var growToPos = {x:x + growDir.x, y:y + growDir.y};

        if(!this.getMap().withinMapBounds(growToPos)){
            return;
            //growToPos.x = -growToPos.x;
            //growToPos.y = -growToPos.y;
        }
        if(!this.getMap().getEntity(growToPos)){
            var newEntity = Game.EntityGenerator.create('growable');
            newEntity.initializeValues( this.getFg(), this.getChar(), this.getMoveStrategy(),
                    this.getIsInfectable(), growDir );
            this.getMap().addEntity(newEntity, growToPos);
        }

        if(Math.random() > .6){
            this.spread(x, y,
                    {x: Game.util.randomInt(-1,1),
                        y: Game.util.randomInt(-1,1)} );
        }
    },
    initializeValues: function( fg, chr, moveStrategy, isInfectable, growDir ){
        this.setAppearance(fg, chr);
        this.setMoveStrategy(moveStrategy);
        this.setIsInfectable(isInfectable);
        this.setGrowDir(growDir);
    },
    getGrowDir: function(){
        return this.growDir;
    },
    setGrowDir: function( growDir ){
        this.growDir = growDir;
    }
};


//cells move in concert as one mass normally
//energy system to move in concert
