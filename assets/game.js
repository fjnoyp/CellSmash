window.onload = function() {
    //console.log("starting WSRL - window loaded");
    // Check if rot.js can work on this browser
    if (!ROT.isSupported()) {
        alert("The rot.js library isn't supported by your browser.");
    } else {
        // Initialize the game
        Game.init();

        ["main", "avatar"].forEach(function (key) {
          var div = document.createElement("div");
          div.id = "wsrl-display-" + key;
          div.classList.add("wsrl-display");
          div.appendChild(Game.getDisplay(key).getContainer());
          document.body.appendChild(div);
        });

        Game.switchUiMode(Game.UIMode.gameStart);
    }
};

var Game = {
  _PERSISTANCE_NAMESPACE: 'wsrlgame',

  _DISPLAY_SPACING: 1.1,
  _display: {
    main: { width: 75, height: 50 },
    avatar: { width: 30, height: 50 }
  },

  _game: null,
  _curUiMode: null,
  _randomSeed: 0,
  TRANSIENT_RNG: null,

  DATASTORE: {},

  Scheduler: null,
    TimeEngine: null,
    Actors: null, //list of all actors
        RANDOM_SEED_KEY: 'gameRandomSeed',

  init: function() {
    this._game = this;

    this.TRANSIENT_RNG = ROT.RNG.clone();
    Game.setRandomSeed(5 + Math.floor(this.TRANSIENT_RNG.getUniform()*100000));

    //this.initializeTimingEngine();

    for (var display_key in this._display) {
      if (this._display.hasOwnProperty(display_key)) {
          this._display[display_key] = new ROT.Display(this._display[display_key]);
      }
    }
    this.renderDisplayAll();

    var game = this;
    var bindEventToScreen = function(event) {
        window.addEventListener(event, function(e) {
            // When an event is received, send it to the
            // screen if there is one
            if (game._curUiMode !== null) {
                // Send the event type and data to the screen
                game._curUiMode.handleInput(event, e);
            }
        });
    };
    // Bind keyboard input events
    bindEventToScreen('keypress');
    bindEventToScreen('keydown');
//        bindEventToScreen('keyup');
  },

    initializeTimingEngine: function () {
        // NOTE: single, central timing system for now - might have to refactor this later to deal with mutliple map stuff
        Game.Scheduler = new ROT.Scheduler.Simple();
        Game.TimeEngine = new ROT.Engine(Game.Scheduler);

        Game.Actors = new Set();
        //Game.Scheduler.SetDuration(1000);

        Game.step = 0;

        var timeBlock = {
            act: function(){
                //animate all actors every n time
                if(Game.step >= 1){
                    Game.Actors.forEach(
                        function(value1, value2, set){
                            value1.doTurn();
                        }
                    );
                    Game.step = .25;
                }
                else{
                    Game.step += .25;
                }
                Game.refresh();

                return {
                    then: function (unlock) {
                        setTimeout(unlock, 25);
                    }
                };
            }
        }
        console.log("intilaizeing timing engine");
        Game.Scheduler.add(timeBlock,true);

        Game.TimeEngine.start();

    },

  getRandomSeed: function () {
    return this._randomSeed;
  },
  setRandomSeed: function (s) {
    this._randomSeed = s;
    this.DATASTORE[this.RANDOM_SEED_KEY] = this._randomSeed;
    ROT.RNG.setSeed(this._randomSeed);
  },

  getDisplay: function (displayId) {
    if (this._display.hasOwnProperty(displayId)) {
      return this._display[displayId];
    }
    return null;
  },

  refresh: function () {
      this.renderDisplayAll();
  },
  renderDisplayAll: function() {
    this.renderDisplayAvatar();
    this.renderDisplayMain();
    this.renderDisplayMessage();
  },
  renderDisplayAvatar: function() {
    this._display.avatar.clear();
    if (this._curUiMode === null) {
      return;
    }
    if (this._curUiMode.hasOwnProperty('renderAvatarInfo')) {
      this._curUiMode.renderAvatarInfo(this._display.avatar);
    }
  },
  renderDisplayMain: function() {
    this._display.main.clear();
    if (this._curUiMode === null) {
      return;
    }
      if (this._curUiMode.hasOwnProperty('render')) {
        this._curUiMode.render(this._display.main);
    }
  },
  renderDisplayMessage: function() {
    //Game.Message.render(this._display.message);
  },

  eventHandler: function (eventType, evt) {
    // When an event is received have the current ui handle it
    if (this._curUiMode !== null) {
        this._curUiMode.handleInput(eventType, evt);
    }
  },

  switchUiMode: function (newUiMode) {
    if (this._curUiMode !== null) {
      this._curUiMode.exit();
    }
    this._curUiMode = newUiMode;
    if (this._curUiMode !== null) {
      this._curUiMode.enter();
    }
    this.renderDisplayAll();
  }

  // toJSON: function() {
  //   var json = {};
  //   json._randomSeed = this._randomSeed;
  //   json[Game.UIMode.gamePlay.JSON_KEY] = Game.UIMode.gamePlay.toJSON();
  //   return json;
  // }
};
