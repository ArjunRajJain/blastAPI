var express    = require("express");
var morgan     = require("morgan");
var bodyParser = require("body-parser");
var jwt        = require("jsonwebtoken");
var mongoose   = require("mongoose");
var app        = express();
var url        = require('url');
var User       = require('./models/User');
var childProcess = require('child_process');
var bioBlast = require('biojs-io-blast');

// mongoose.connect('');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

process.on('uncaughtException', function(err) {
    console.log(err);
});

// app.set('port',process.env.PORT || 80);

app.listen(process.env.PORT || 80, function () {
    console.log( "Express server listening on port 8081");
});

app.get('/',ensureAuthorized,  function(req, res) {
    User.findOne({_id: req.token}, function(err, user) {
        if (err || user == null) {
            contentError('Cannot Access API');
        } else {
            queryData = url.parse(req.url, true).query;
            validate(queryData, res);
        }
    });
});

function ensureAuthorized(req, res, next) {
    var bearerToken;
    var bearerHeader = req.headers["authorization"];
    // console.log(bearerHeader);
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[0];
        req.token = bearerToken;
        next();
    } else {
        res.send(403);
    }
}

//the sequence is required, the name isn't

function validate(queryData, res) {
    if (queryData.seq) {
        if (!queryData.name) {
            queryData.name = "sequence";
        }
        if(!queryData.exec) {
            queryData.exec = "blastp";
        }
        if(!queryData.num_alignments) {
            queryData.num_alignments = 5;
        }
        if(!queryData.db) {
            queryData.db = "combined.faa";
        }
        var re = /^[A-Za-z]+$/;
        if (typeof queryData.seq == 'string' && queryData.seq.match(re)) {
            blastSeq('>' + queryData.name + '\\n' + queryData.seq + '\\n', res,queryData.exec,queryData.db,queryData.num_alignments);
        } else {
            contentError("Invalid sequence\n", res);
        }
    } else {
        contentError("No seq argument", res);
    }
}

function contentError(errorstr, res) {
    res.writeHead(400, {
        'Content-Type': 'text/plain'
    });
    res.end(errorstr);
}

//call blast and print default format straight to browser


function blastSeq(queryPath, res,exec,db,num_alignments) {

    var blastCmd = "/bin/bash -c '" + "./blast/" + exec + " -query" + " <(echo -e \"" + queryPath + "\")";
    blastCmd += " -db ./blastdb/" + db
    blastCmd += " -num_alignments " + num_alignments;
    blastCmd += " -outfmt 5";
    blastCmd += "'"

    //http://nodejs.org/api/child_process.html
    blast = childProcess.exec(blastCmd,{maxBuffer:20000000}, function(error, stdout, stderr) {
        if (error) {
            console.log(error);
            contentError(error.stack, res);
        } else {
            // res.writeHead(200, {
            //     'Content-Type': 'application/json'
            // });
            output = bioBlast.parse(stdout);
            console.log(output);
            res.json(output);
        }
    });
}
