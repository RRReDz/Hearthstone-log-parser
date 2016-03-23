var TailObservable = require('tail-observable');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var os = require('os');
var _ = require('lodash');

function HeathstoneLogParser() {
	this.logFile = this.getLogPath();
	this.players = [];

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
		self.zoneChangeTest(line) || self.gameOverTest(line) || self.gameStartTest(line) || self.playersTest(line);
	}
};

HeathstoneLogParser.prototype.playersTest = function(value) {
	var playersTest = /TRANSITIONING card \[name=(.+) id=.+ zone=.+ zonePos=.+ cardId=.+ player=(\d)\] to (OPPOSING|FRIENDLY) PLAY \(Hero\)/;
	var group = playersTest.exec(value);
	if (group === null) return false;

	var data = {
		hero: group[1],
		class: this.className(group[1]),
		team: parseInt(group[2], 10),
		side: group[3]
	};
	this.mergePlayers(data, 'team');
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

	this.emit('action', data);
};

HeathstoneLogParser.prototype.gameStartTest = function(value) {
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

HeathstoneLogParser.prototype.gameOverTest = function(value) {
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
	}
};

HeathstoneLogParser.prototype.mergePlayers = function(data, key) {
	if (key === 'team') {
		var player = _.find(this.players, {
			team: data.team
		});

		if (_.isEmpty(player)) {
			this.players.push(data);
			return;
		}
	} else
	if (key === 'name' && this.players.length === 0) {
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

HeathstoneLogParser.prototype.className = function(heroName) {
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

module.exports = HeathstoneLogParser;