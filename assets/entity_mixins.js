

Game.CellMoveEnum = {
    CIRCLE_AROUND : 'circle around targetEntity position'
}

Game.CellMoveStrategies = {
    _circleAround: function (pos,targetPos) {
        var x = pos.x, y = pos.y;
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

    _moveToward: function (ourPos, targetPos, minDist, maxDist) {
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

    "AssassinSwarm": function () {
        var us = this.getPos();
        var friends = [], enemies = [];

        for (var dx = -3; dx <= 3; dx++) {
            for (var dy = -3; dy <= 3; dy++) {
                var en = this.getMap().getEntity(us.x+dx, us.y+dy);
                if (en && en.isInfectable) {
                    (en.isSameCellType(this) ? friends : enemies).push(en);
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
            return Game.CellMoveStrategies.RandomSweep.call(this);
        }

        var it = this.targetEntity.getPos();
        var dx = it.x-us.x, dy = it.y-us.y;
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
            return {x:dx, y:dy};
        }
        else {
            var dist = dx*dx+dy*dy;
            if (8 < dist && dist < 40) {
                return Game.CellMoveStrategies._circleAround(us, it);
            }
            else {
                return Game.CellMoveStrategies._moveToward(us, it, 4, 8);
            }
        }
    },

    "RandomSweep": function () {
        if (!this.targetPos) {
            this.targetPos = this.getMap().getRandomWalkableLocation();
        }

        var deltas;
        if (Math.random() < 0.8) {
            deltas = Game.CellMoveStrategies._moveToward(
                    this.getPos(),
                    this.targetPos,
                    0, 0);
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
    },

    "OpportunisticMurder" : function () {
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
    },

    "CircleSafely" : function () {
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
    },

    "CircleAround" : function () {
        return Game.CellMoveStrategies._circleAround(
                this.getPos(),
                this.getTargetEntity().getPos());
    },

    "ClusterAround" : function () {
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
    },

    "WanderAround" : function () {
        return this.getMoveDeltas();
    },

    "ClumpTogether" : function () {
        this.count = ((this.count || 0) + 1) % 4;
        var angle = this.count * Math.PI/2;
        return {
            x: Math.round(Math.sin(angle)),
            y: Math.round(Math.cos(angle))
        };
    },

    "ClusterMove" : function () {
        var neighborCount = 0;
        var ourX = this.getX();
        var ourY = this.getY();
        for(x = -1; x<2; x++){
            for(y = -1; y<2; y++){
                if( x != 0 || y != 0){
                    var entity = this.getMap().getEntity(ourX+x, ourY+y);
                    if(entity && entity.hasOwnProperty("isSameCellType")){
                        if(entity.isSameCellType(this)){
                            neighborCount ++;
                        }
                    }
                }
            }
        }
        if (neighborCount > 1){
            return Game.CellMoveStrategies["ClumpTogether"].call(this);
        }
        else {
            return Game.CellMoveStrategies["CircleAround"].call(this);
        }
    },

    NoMove: function () {
        return {x:0, y:0};
    },
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
                moveDeltas = this.moveStrategy.call(this);

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
                if(this.canInfect){
                    if(evtData.recipient.setAppearance && !evtData.recipient.isSameCellType(this) ){
                        if(evtData.recipient.getIsInfectable() == true){
                            evtData.recipient.setAppearance(this.getFg(), this.getChar());
                            evtData.recipient.setMoveStrategy(this.getMoveStrategy());
                            evtData.recipient.setParentCell(this.getParentCell());

                            evtData.recipient.setTargetEntity(this.getTargetEntity());
                        }
                    }
                }

            }
        }
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

    moveStrategy: "WanderAround",
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
