var TailObservable = require('tail-observable');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var os = require('os');
var _ = require('lodash');

function HeathstoneLogParser() {
	this.logFile = this.getLogPath();
	this.players = [];
	this.matchResult = [];

	_.bindAll(this, 'getLogPath', 'core', 'zoneChangeTest');

	var tailObservable = new TailObservable(this.logFile);
	tailObservable.on('change', this.core);
}

HeathstoneLogParser.prototype = Object.create(EventEmitter.prototype);

HeathstoneLogParser.prototype.getLogPath = function() {
	if (_.isEqual(os.type(), 'Windows_NT')) {
		var fileSystem = 'Program Files';
		if (_.isEqual(os.arch(), 'x64')) {
			fileSystem += ' (x86)';
		}
		return path.join('C:', fileSystem, 'Hearthstone', 'Hearthstone_Data', 'output_log.txt');
	} else {
		return path.join(process.env.HOME, 'Library', 'Logs', 'Unity', 'Player.log');
	}
};

HeathstoneLogParser.prototype.core = function(data) {
	var self = this;
	_(data).forEach(analizer);

	function analizer(line) {
		self.zoneChangeTest(line) || self.gameOverTest(line) || self.gameStartTest(line);
	}
};

HeathstoneLogParser.prototype.zoneChangeTest = function(value) {
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

	console.log(data);
	this.emit('action', data);
};

HeathstoneLogParser.prototype.gameStartTest = function(value) {
	var gameStart = /^\[Power\] GameState.DebugPrintPower\(\) - TAG_CHANGE Entity=(.+) tag=TEAM_ID value=(\d+)$/;
	var group = gameStart.exec(value);
	if (group === null) return false;

	var data = {
		name: group[1],
		team_id: group[2]
	};
	this.players.push(data);

	if (this.players.length == 2) {
		console.log(this.players);
		this.emit('match-start', this.players);
	}
};

HeathstoneLogParser.prototype.gameOverTest = function(value) {
	var gameOver = /\[Power\] GameState\.DebugPrintPower\(\) - TAG_CHANGE Entity=(.+) tag=PLAYSTATE value=(LOST|WON|TIED)$/;
	var group = gameOver.exec(value);
	if (group === null) return false;

	var data = {
		name: group[1],
		status: group[2]
	};

	this.matchResult.push(data);

	if (this.matchResult.length == 2) {
		console.log(this.matchResult);
		this.emit('match-over', this.matchResult);
	}
};

module.exports = HeathstoneLogParser;