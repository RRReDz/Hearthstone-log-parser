# hearthstone-log-parser
Extract information from hearthstone log file, parsing log entries in good shape objects.
It's easy to use, enjoy!

## Instalation
    npm install hearthstone-log-parser
## Usage
###Defining and initializing

    var HsLogParser = require('hearthstone-log-parser');
    var hsParser = new HsLogParser();

### Extracting actions
When some card goes to some zone to another this event will be triggered.

    hsParser.on('action', function(data) {
    	console.log(data);
    });
    
data example:

	{ name: 'Mind Control Tech',
	 id: 16,
	 cardId: 'EX1_085',
	 player: 1,
	 fromTeam: 'FRIENDLY',
	 fromZone: 'DECK',
	 toTeam: 'FRIENDLY',
	 toZone: 'HAND' }

### Game start
Event is triggered at the moment that the match start. Return players information.

    hsParser.on('match-start', function(data) {
    	console.log(data);
    });

data example:

	[{
	  hero: "Uther Lightbringer",
	  class: "paladin",
	  name: "Agent47",
	  side: "OPPOSING",
	  team: 1
	}, {
	  hero: "Garrosh Hellscream",
	  class: "warrior",
	  name: "Player457",
	  side: "FRIENDLY",
	  team: 2
	}]

### Game over
Event is triggered when game is over, you can get detailed players information and who won.

    hsParser.on('match-over', function(data) {
    	console.log(data);
    });

data example:

	[{
	  hero: "Uther Lightbringer",
  	  class: "paladin",
	  name: "Agent47",
	  side: "OPPOSING",
	  status: "LOST",
	  team: 1
	}, {
	  hero: "Garrosh Hellscream",
	  class: "warrior",
	  name: "Player457",
	  side: "FRIENDLY",
	  status: "WON",
	  team: 2
	}]



### Notes
- It's legal, use it without concerns.
- In the project github repository you will find an naive example.
- You can look an real app implementation in: https://github.com/FelipeBB/hearthstone-radar


This project is under **MIT** license.
