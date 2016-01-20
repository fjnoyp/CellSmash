

Game.CellMoveEnum = {
    CIRCLE_AROUND : 'circle around targetEntity position'
}

Game.CellMoveStrategies = {
    "CircleAround" : {
        getMoveDeltas: function(){
            var targetPos = this.targetEntity.getPos(); 
            var moveDeltas = {x:0, y:0}; 

            var difX = targetPos.x - this.getX(); 
            var difY = targetPos.y - this.getY();

            var sqrDist = Math.pow(difX,2) + Math.pow(difY,2); 
            
            if( sqrDist > 60 || sqrDist < 40){
                if(Math.abs(difX) > Math.abs(difY)){ moveDeltas.x = Game.util.clamp(difX, -1, 1); }
                else{ moveDeltas.y = Game.util.clamp(difY, -1, 1); }

                /*
                if(sqrDist > 120){
                    if( ! this.getMap().getTile( this.getX() + moveDeltas.x, this.getY() + moveDeltas.y).isWalkable() ){
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
                }
                */

                
                if(sqrDist < 40){
                    if(moveDeltas.x !== 0){
                        moveDeltas.x = moveDeltas.x * -1;
                    }
                    if(moveDeltas.y !== 0){
                        moveDeltas.y = moveDeltas.y * -1;
                    }
                }
            }
            else{

                moveDeltas = this.getMoveDeltas();
            }
            return moveDeltas; 
        }
    },

    "ClusterAround" : {
        getMoveDeltas: function(){
            var targetPos = this.targetEntity.getPos();
            var difX = targetPos.x - this.getX(); 
            var difY = targetPos.y - this.getY();

            if(difX == 0){difX = Math.round( 2*Math.random() - 1 );}
            if(difY == 0){difY = Math.round( 2*Math.random() - 1 );}

            var moveDeltas = {x: Game.util.clamp(difX, -1, 1),
                              y: Game.util.clamp(difY, -1, 1)}; 

            if( this.getMap().getEntity( this.getX() + moveDeltas.x, this.getY() + moveDeltas.y) ){

                
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
        getMoveDeltas: function(){
            return this.getMoveDeltas(); 
        }
    }, 

    "ClumpTogether" : {
        moves : [ {x:1,y:0}, {x:0,y:1}, {x:-1,y:0}, {x:0,y:-1} ], 
        getMoveDeltas: function(){
            if( !this.hasOwnProperty("count") ){
                this.count = 0; 
            }
            this.count ++; 
            this.count %= 4; 
            return Game.CellMoveStrategies["ClumpTogether"].moves[this.count]; 
        }
    },

    "ClusterMove" : {
        getMoveDeltas: function(){
            var neighborCount = 0;
            var ourX = this.getX();
            var ourY = this.getY(); 
            for(x = -1; x<2; x++){
                for(y = -1; y<2; y++){
                    if(x !== 0 && y !== 0){
                        var entity = this.getMap().getEntity(ourX+x, ourY+y);
                        if(entity && entity.hasOwnProperty("isSameCellType")){
                            if(entity.isSameCellType(this)){
                                neighborCount ++; 
                            }
                        }
                    }
                }
            }
            if(neighborCount > 1){
                return (Game.CellMoveStrategies["ClumpTogether"].getMoveDeltas).call(this); 
            }
            else{
                return (Game.CellMoveStrategies["CircleAround"].getMoveDeltas).call(this); 
            }
        }
    },

    "MoveInDir" : {
        getMoveDeltas: function(){
            return {x:2,y:2}; 
        }
    }
}


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

Game.EntityMixin.HitPoints = {
  META: {
    mixinName: 'HitPoints',
    mixinGroup: 'HitPoints',
    stateNamespace: '_HitPoints_attr',
    stateModel:  {
      maxHp: 1,
      curHp: 1
    },
    init: function (template) {
      this.attr._HitPoints_attr.maxHp = template.maxHp || 1;
      this.attr._HitPoints_attr.curHp = template.curHp || this.attr._HitPoints_attr.maxHp;
    },
    listeners: {
      'attacked': function(evtData) {
        // console.log('HitPoints attacked');

        this.takeHits(evtData.attackPower);
        this.raiseEntityEvent('damagedBy',{damager:evtData.attacker,damageAmount:evtData.attackPower});
        evtData.attacker.raiseEntityEvent('dealtDamage',{damagee:this,damageAmount:evtData.attackPower});
        if (this.getCurHp() <= 0) {
          this.raiseEntityEvent('killed',{entKilled: this, killedBy: evtData.attacker});
          evtData.attacker.raiseEntityEvent('madeKill',{entKilled: this, killedBy: evtData.attacker});
        }
      },
      'killed': function(evtData) {
        // console.log('HitPoints killed');
        this.destroy();
      }
    }
  },
  getMaxHp: function () {
    return this.attr._HitPoints_attr.maxHp;
  },
  setMaxHp: function (n) {
    this.attr._HitPoints_attr.maxHp = n;
  },
  getCurHp: function () {
    return this.attr._HitPoints_attr.curHp;
  },
  setCurHp: function (n) {
    this.attr._HitPoints_attr.curHp = n;
  },
  takeHits: function (amt) {
    this.attr._HitPoints_attr.curHp -= amt;
  },
  recoverHits: function (amt) {
    this.attr._HitPoints_attr.curHp = Math.min(this.attr._HitPoints_attr.curHp+amt,this.attr._HitPoints_attr.maxHp);
  }
};

//#############################################################################
// ENTITY ACTORS / AI

Game.EntityMixin.CellMove = {
  META: {
    mixinName: 'CellMove',
    mixinGroup: 'Cell',
      init: function (template) {
          Game.Actors.push(this);
          this.targetEntity = Game.UIMode.gamePlay.getAvatar(); 
      }, 
  },
  getMoveDeltas: function () {
    return Game.util.positionsAdjacentTo({x:0,y:0}).random();
  },
    doTurn: function () {
        
        //Move strategies , note MoveStrategy called from calling cell's scope
        moveDeltas = (this.moveStrategy.getMoveDeltas).call(this); 

        //DO WALK 
        if (this.hasMixin('Walker')) { 
            this.tryWalk(this.getMap(), moveDeltas.x, moveDeltas.y);
        }
        this.raiseEntityEvent('actionDone');
    }
};

//Manages children cells of cell conglomerates 
Game.EntityMixin.CellController = {
    META: {
        mixinName: 'CellController',
        mixinGroup: 'Cell',
        listeners: {
            //pass cell change event to all children cells 
            'cellChange': function(evtData) {
                if(evtData.keyPress === 'q'){
                    this.curMoveStrategy = Game.CellMoveStrategies["ClusterAround"];
                }
                else if(evtData.keyPress === 'e'){
                    this.curMoveStrategy = Game.CellMoveStrategies["CircleAround"];
                }
                else{
                    this.curMoveStrategy = Game.CellMoveStrategies["ClusterMove"]; 
                }

                evtData = {}; 
                evtData.moveStrategy = this.curMoveStrategy; 

                this.childrenCells.forEach(
                    function(value1, value2, set){
                        value1.raiseEntityEvent('cellChange',evtData);
                    }

                );

            },
        }
    },
    childrenCells: new Set(),
    curMoveStrategy: Game.CellMoveStrategies["CircleAround"],

    //WARNING NOTE EXTRA REFERENCE, POSSIBLE MEMORY LEAK WITHOUT EXPLICIT REMOVAL 
    addChildrenCell: function(cellEntity){
        this.childrenCells.add(cellEntity); 
    }, 

    removeChildrenCell: function(cellEntity){
        this.childrenCells.delete(cellEntity);
    }
};
/*
//More complex logic pending 
Game.EntityMixin.Killable = {
    META: {
        mixinName: 'Killable', 
        mixinGroup: 'Cell',
        listeners: {
            'destroy': function(evtData) {
                this.destroy();
                this.raiseEntityEvent('destroyed'); 
            }
        }
    }
};
*/

Game.EntityMixin.CellInfect = {
    META: {
        mixinName: 'CellInfect', 
        mixinGroup: 'Cell',
        listeners: {
            'bumpEntity': function(evtData){

                //infect can mean changing behavior and/or appearance of other cell, other cell can also have resistances, cellInformation will probably expose all relevant information about cell, method set to allow for this 
                //evtData.receipient.raiseEntityEvent('infect',);
                if(evtData.recipient.hasOwnProperty("setAppearance")){
                    evtData.recipient.setAppearance(this.getFg(), this.getChar());
                    evtData.recipient.setMoveStrategy(this.getMoveStrategy());
                    evtData.recipient.setParentCell(this.getParentCell());

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
                this.setMoveStrategy(evtData.moveStrategy); 
                //this.moveStrategy = evtData.curMoveStrategy; 
            }
        },
        init: function(template){
        }
    },

    moveStrategy: "WanderAround", 
    moveStrategy: Game.CellMoveStrategies["WanderAround"],
    parentCell: null,

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

        if(this.parentCell !== null){
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
        return otherCell.getParentCell() == this.getParentCell(); 
    }

    

};
