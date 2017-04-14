var Tailf = require('tail-f');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var os = require('os');
var _ = require('lodash');
var fs = require('fs');

/**
 * analyze hearthstone log entries and emmit events
 * with relevant parsed information
 * @constructor
 */
function HeathstoneLogParser(hsPath) {
    _.bindAll(this, 'getLogPath', 'core', 'zoneChangeTest');

    this.logFile = this.getLogPath(hsPath);
    this.players = [];
    this.isPlayerSet = false;

    var tail = new Tailf(this.logFile);
    tail.on('change', this.core);
}

HeathstoneLogParser.prototype = Object.create(EventEmitter.prototype);

/**
 * return the right location of hearthstone log based on OS
 * also overwrite log.config
 */
HeathstoneLogParser.prototype.getLogPath = function (hsPath) {
    var configFile = '';
    var logFile = '';

    if (_.isEqual(os.type(), 'Windows_NT')) {
        configFile = path.resolve(process.env.LOCALAPPDATA, 'Blizzard', 'Hearthstone', 'log.config');
	logFile = !hsPath ? findLogFileWin() :  (hsPath + '\\Hearthstone_Data\\output_log.txt');
    } else {
        configFile = path.resolve(process.env.HOME, 'Library', 'Preferences', 'Blizzard', 'Hearthstone', 'log.config');
        logFile = path.resolve(process.env.HOME, 'Library', 'Logs', 'Unity', 'Player.log');
    }
    fs.createReadStream(path.resolve(__dirname, 'log.config')).pipe(fs.createWriteStream(configFile));
    return logFile;
};


/**
 * process the new lines of log file
 * @param {Array. <String>} data
 */
HeathstoneLogParser.prototype.core = function (data) {
    _(data).forEach(analyzer.bind(this));

    function analyzer(line) {
        this.zoneChangeTest(line) || this.gameOverTest(line) || this.gameStartTest(line) || this.playersTest(line);
    }
};

/**
 * test if log entry is related to player information
 * @param {String} value - log entry
 */
HeathstoneLogParser.prototype.playersTest = function (value) {
    var playersTest = /TRANSITIONING card \[name=(.+) id=.+ zone=.+ zonePos=.+ cardId=.+ player=(\d)\] to (OPPOSING|FRIENDLY) PLAY \(Hero\)/;
    var group = playersTest.exec(value);
    if (group === null) return false;

    this.isPlayerSet = true;
    var data = {
        hero: group[1],
        class: this.className(group[1]),
        team: parseInt(group[2], 10),
        side: group[3]
    };
    this.mergePlayers(data, 'team');
};

/**
 * test if log entry is related to zone change event
 * @param {String} value - log entry
 */
HeathstoneLogParser.prototype.zoneChangeTest = function (value) {
    var zoneChange = /^\[Zone\] ZoneChangeList.ProcessChanges\(\) - id=\d+ local=.+ \[name=(.+) id=(\d+) zone=.+ zonePos=\d+ cardId=(.+) player=(\d)\] zone from ?(FRIENDLY|OPPOSING)? ?(.*)? -> ?(FRIENDLY|OPPOSING)? ?(.*)?$/;
    var group = zoneChange.exec(value);
    if (group === null) return false;

    var data = {
        name: group[1],
        id: parseInt(group[2], 10),
        cardId: group[3],
        player: parseInt(group[4], 10),
        fromTeam: group[5],
        fromZone: group[6],
        toTeam: group[7],
        toZone: group[8]
    };

    this.emit('action', data);
};

/**
 * test if log entry is related to game start event
 * @param {String} value - log entry
 * @returns {boolean}
 */
HeathstoneLogParser.prototype.gameStartTest = function (value) {
    var gameStart = /^\[Power\] GameState.DebugPrintPower\(\) - TAG_CHANGE Entity=(.+) tag=TEAM_ID value=(\d+)$/;
    var group = gameStart.exec(value);
    if (group === null) return false;

    var data = {
        name: group[1],
        team: parseInt(group[2], 10)
    };

    this.mergePlayers(data, 'team');

    if (this.players.length === 2) {
        this.emit('match-start', this.players);
    }
};

/**
 * test if log entry is related to game over event
 * @param {String} value - log entry
 */
HeathstoneLogParser.prototype.gameOverTest = function (value) {
    var gameOver = /\[Power\] GameState\.DebugPrintPower\(\) - TAG_CHANGE Entity=(.+) tag=PLAYSTATE value=(LOST|WON|TIED)$/;
    var group = gameOver.exec(value);
    if (group === null) return false;

    var data = {
        name: group[1],
        status: group[2]
    };

    this.mergePlayers(data, 'name');

    if (this.players.length === 2 && this.players[0].status && this.players[1].status) {
        this.emit('match-over', this.players);
        this.players = [];
        this.isPlayerSet = false;
    }
};

/**
 * merge players information **this is a dark abyss**
 * @param {Object} data - player information
 * @param (String} key - key to alter
 */
HeathstoneLogParser.prototype.mergePlayers = function (data, key) {
    if (key === 'team') {
        var player = _.find(this.players, {
            team: data.team
        });

        if (_.isEmpty(player)) {
            this.players.push(data);
            return;
        }
    } else if (!this.isPlayerSet) {
        //case tracker opened in the middle of a match
        this.players.push(data);
        return;
    }

    for (var i = this.players.length - 1; i >= 0; i--) {
        if (_.isEqual(this.players[i][key], data[key])) {
            _.merge(this.players[i], data);
        }
    }
};

/**
 * get class name based on hero name
 * @param {String} heroName
 * @returns {String} - hero name
 */
HeathstoneLogParser.prototype.className = function (heroName) {
    heroName = heroName.toLowerCase();
    var result = heroName;
    switch (heroName) {
        case 'malfurion stormrage':
            result = 'druid';
            break;
        case 'alleria windrunner':
        case 'rexxar':
            result = 'hunter';
            break;
        case 'jaina proudmoore':
        case 'medivh':
            result = 'mage';
            break;
        case 'uther lightbringer':
        case 'lady liadrin':
            result = 'paladin';
            break;
        case 'anduin wrynn':
            result = 'priest';
            break;
        case 'valeera sanguinar':
            result = 'rogue';
            break;
        case 'thrall':
            result = 'shaman';
            break;
        case 'gul\'dan':
            result = 'warlock';
            break;
        case 'garrosh hellscream':
        case 'magni bronzebeard':
            result = 'warrior';
            break;
    }
    return result;
};

function findLogFileWin() {
    var fileSystem = 'Program Files';
    fileSystem += _.isEqual(os.arch(), 'x64') ? ' (x86)' : '';
    return path.resolve('C:', fileSystem, 'Hearthstone', 'Hearthstone_Data', 'output_log.txt');
}

module.exports = HeathstoneLogParser;
