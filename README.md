# hearthstone-log-parser
Extract informations from hearthstone log file

## Instalation
    npm i hearthstone-log-parser
## Usage

    var HsLogParser = require('hearthstone-log-parser');
    var hsParser = new HsLogParser();

### extracting actions
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

    hsParser.on('match-start', function(data) {
    	console.log(data);
    });

data example:

	[ { name: 'Agent475', team_id: '2' },
	  { name: 'Player 1', team_id: '1' } ]

### Game over

    hsParser.on('match-over', function(data) {
    	console.log(data);
    });

data example:

	[ { name: 'Agent47', status: 'LOST' },
	  { name: 'Player 1', status: 'WON' } ]
	 
## The MIT License
> Copyright (c) 2015 Felipe Baravieira

> Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

> The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.