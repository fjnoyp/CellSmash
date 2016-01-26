Game.DATASTORE.MAP = {};
Game.Map = (function () {
    "use strict";

    function Map(tileset) {
        this.id = Map.lastId++;
        Game.DATASTORE.MAP[this.id] = this;

        this.tiles = Game.MapTileSets[tileset].getMapTiles();
        this.width = this.tiles.length;
        this.height = this.tiles[0].length;
        this.entitiesByLocation = {};
        this.locationsByEntity = {};
        this.oldLocationsByEntity = {};
    }
    Map.lastId = 0;

    Map.prototype.getId = function () {
        return this.id;
    };
    Map.prototype.getWidth = function () {
        return this.width;
    };
    Map.prototype.getHeight = function () {
        return this.height;
    };

    Map.prototype.getTile = function (x,y) {
        return (this.tiles[x] || [])[y] || Game.Tile.wallTile;
    };

    Map.prototype.addEntity = function (ent, pos) {
        this.entitiesByLocation[pos.x] = this.entitiesByLocation[pos.x] || {};
        this.entitiesByLocation[pos.x][pos.y] = ent.getId();

        var id = ent.getId();
        this.locationsByEntity[id] = this.oldLocationsByEntity[id] = pos;
        ent.setMap(this);
        ent.setPos(pos);
    };

    Map.prototype.updateEntityLocation = function (ent) {
        var id = ent.getId();

        var old = this.oldLocationsByEntity[id] = this.locationsByEntity[id];
        delete this.entitiesByLocation[old.x][old.y];

        var pos = this.locationsByEntity[id] = ent.getPos();
        this.entitiesByLocation[pos.x] = this.entitiesByLocation[pos.x] || {};
        this.entitiesByLocation[pos.x][pos.y] = ent.getId();
    };

    Map.prototype.getEntity = function (x,y) {
        if (!y) {
            y = x.y;
            x = x.x;
        }
        return Game.DATASTORE.ENTITY[(this.entitiesByLocation[x] || [])[y]];
    };

    Map.prototype.removeEntity = function (ent) {
        var id = ent.getId(), pos = ent.getPos();
        delete this.entitiesByLocation[pos.x][pos.y];
        delete this.locationsByEntity[id];
        delete this.oldLocationsByEntity[id];
    };

    Map.prototype.chooseTile = function (f, tries) {
        tries = tries || 200;

        var x, y;
        do {
            x = ROT.RNG.getUniformInt(0, this.getWidth()-1);
            y = ROT.RNG.getUniformInt(0, this.getHeight()-1);
            if (!f || f(this.getTile(x,y), x, y)) break;
        } while (--tries);
        return {x: x, y: y};
    };
    Map.prototype.getRandomWalkableLocation = function (tries) {
        var map = this;
        return this.chooseTile(function (t, x,y) {
            return t.isWalkable() && !map.getEntity(x,y);
        });
    };

    return Map;
})();

Game.Map.prototype.renderOn = function (display,camX,camY) {
    var dispW = display._options.width;
    var dispH = display._options.height;
    var xStart = camX-Math.round(dispW/2);
    var yStart = camY-Math.round(dispH/2);

    for (var x = 0; x < dispW; x++) {
        for (var y = 0; y < dispH; y++) {
            var pos = {x: x+xStart, y: y+yStart};
            var tile = this.getTile(pos.x, pos.y);
            tile.draw(display, x,y);

            var ent = this.getEntity(pos);
            if (ent) {
                var old = this.oldLocationsByEntity[ent.getId()];
                ent.draw(display,
                        x * Game.step + (old.x-xStart) * (1-Game.step),
                        y * Game.step + (old.y-yStart) * (1-Game.step));

                if (Game.step === 1) {
                    this.oldLocationsByEntity[ent.getId()] = pos;
                }
            }
        }
    }
};

Game.Map.prototype.createEntity = function(pos, creationFormat) {
    var newEntity = Game.EntityGenerator.create(creationFormat.entityType);

    if(creationFormat.fg && creationFormat.chr){
        newEntity.setAppearance(creationFormat.fg, creationFormat.chr);
    }

    if(creationFormat.moveStrategy){
        newEntity.setMoveStrategy(creationFormat.moveStrategy);
    }

    if(creationFormat.parentCell){
        newEntity.setParentCell(creationFormat.parentCell);
    }

    if(creationFormat.targetEntity){
        newEntity.setTargetEntity( creationFormat.targetEntity );
    }

    if(creationFormat.hasOwnProperty('setIsInfectable')){
        newEntity.setIsInfectable( creationFormat.setIsInfectable );
    }

    if(creationFormat.infectionPackage){
        newEntity.setInfectionPackage(creationFormat.infectionPackage);
    }
    this.addEntity(newEntity, pos);
    return newEntity;
};

Game.Map.prototype.createEntityRandomPos = function(num, creationFormat){
    for(i = 0; i<num; i++){
        this.createEntity( this.getRandomWalkableLocation(), creationFormat );
    }
};

Game.Map.prototype.createEntitiesAroundRandomPos = function (times, num, rad, fmt) {
    while (times-- > 0) {
        var pos = this.getRandomWalkableLocation();
        this.createEntityAroundPos(pos, num, rad, fmt);
    }
};

Game.Map.prototype.createEntityAroundPos = function(pos, num, radius, creationFormat){
    for(i = 0; i<num; i++){
        var newPos = {};
        newPos.x = Math.round( pos.x + (Math.random() - Math.random()) * radius );
        newPos.y = Math.round( pos.y + (Math.random() - Math.random()) * radius );
        this.createEntity( newPos, creationFormat);
    }
};

//Game.Map.prototype.createCell = function(fg, chr, num, pos,
