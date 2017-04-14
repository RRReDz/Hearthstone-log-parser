var HsParser = require('../hearthstone-log-parser');


//hsParser = new HsParser('D:\\Battle.net\\Hearthstone');
hsParser = new HsParser();


hsParser.on('action', function (data) {
    console.log(data);
});

hsParser.on('match-start', function (data) {
    console.log(data);
});

hsParser.on('match-over', function (data) {
    console.log(data);
    process.exit();
});


