Game.util = {

  randomString: function (len) {
    var charSource = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
    var res='';
    for (var i=0; i<len; i++) {
        res += charSource.random();
    }
    return res;
  },

  init2DArray: function (x,y,initVal) {
    var a = [];
    for (var xdim=0; xdim < x; xdim++) {
      a.push([]);
      for (var ydim=0; ydim < y; ydim++) {
        a[xdim].push(initVal);
      }
    }
    return a;
  },

  randomInt: function (min,max) {
    var range = max - min;
    var offset = Math.floor(ROT.RNG.getUniform()*(range+1));
    return offset+min;
  },

  positionsAdjacentTo: function (pos) {
    var adjPos = [];
    for (var dx = -1; dx <= 1; dx++) {
      for (var dy = -1; dy <= 1; dy++) {
        if (dx !== 0 || dy !== 0) {
          adjPos.push({x:pos.x+dx,y:pos.y+dy});
        }
      }
    }
    return adjPos;
  },

    clamp: function(num, min, max){
        return Math.min(Math.max(num, min), max);
    },

    randomNegInt: function(){
        var rand = Math.random();
        if(rand > .5){ return -1; }
        else{ return 1; }
    },

    getMooreNeighborhood: function(pos, func){
        var ourX = pos.x;
        var ourY = pos.y;
        for(x = -1; x<2; x++){
            for(y = -1; y<2; y++){
                if(x != 0 || y != 0){
                    func.call(this,ourX+x,ourY+y);
                }
            }
        }
    },

    getMooreNeighborhoodPos: function(pos){
        pos = [];
        var ourX = pos.x;
        var ourY = pos.y;
        for(x = -1; x<2; x++){
            for(y = -1; y<2; y++){
                if(x != 0 || y != 0){
                    pos.push[ {x:ourX + x, y:ourY + y } ];
                }
            }
        }
    },

    callMethod: function(callee, argObject){
        if(argObject.args.length === 0){
            return callee[argObject.method].call( callee, argObject.args[0] );

        }
        else if(argObject.args.length === 1){
            return callee[argObject.method].call( callee, argObject.args[0],
                                             argObject.args[1] );
        }
        else if(argObject.args.length === 2){
            return callee[argObject.method].call( callee, argObject.args[0],
                                             argObject.args[1],
                                             argObject.args[2] );
        }
        else if(argObject.args.length === 3){
            return callee[argObject.method].call( callee, argObject.args[0],
                                             argObject.args[1],
                                             argObject.args[2],
                                             argObject.args[3]
                                           );
        }

    }

};
