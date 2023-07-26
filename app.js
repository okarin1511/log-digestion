import inquirer from "inquirer";
import fs from "fs";
import * as readline from "readline";
// map of status codes to their corresponding messages
const statusCodes = {
    "200": "OK",
    "201": "Created",
    "202": "Accepted",
    "204": "No Content",
    "206": "Partial Content",
    "207": "Multi-Status",
    "208": "Already Reported",
    "226": "IM Used",
    "300": "Multiple Choices",
    "301": "Moved Permanently",
    "302": "Found",
    "303": "See Other",
    "304": "Not Modified",
    "307": "Temporary Redirect",
    "308": "Permanent Redirect",
    "400": "Bad Request",
    "401": "Unauthorized",
    "402": "Payment Required",
    "403": "Forbidden",
    "404": "Not Found",
    "405": "Method Not Allowed",
    "406": "Not Acceptable",
    "408": "Request Timeout",
    "409": "Conflict",
    "410": "Gone",
    "411": "Length Required",
    "412": "Precondition Failed",
    "413": "Payload Too Large",
    "414": "URI Too Long",
    "415": "Unsupported Media Type",
    "416": "Range Not Satisfiable",
    "417": "Expectation Failed",
    "418": "I'm a teapot",
    "421": "Misdirected Request",
    "422": "Unprocessable Entity",
    "423": "Locked",
    "424": "Failed Dependency",
    "425": "Too Early",
    "426": "Upgrade Required",
    "428": "Precondition Required",
    "429": "Too Many Requests",
    "431": "Request Header Fields Too Large",
    "451": "Unavailable For Legal Reasons",
    "500": "Internal Server Error",
    "501": "Not Implemented",
    "502": "Bad Gateway",
    "503": "Service Unavailable",
    "504": "Gateway Timeout",
    "505": "HTTP Version Not Supported",
    "506": "Variant Also Negotiates",
    "507": "Insufficient Storage",
    "508": "Loop Detected",
    "510": "Not Extended",
    "511": "Network Authentication Required",
    "- -": "Server did not respond"
};
// function to digest the log file
function countEndpointHits(logFilePath) {
    const stream = fs.createReadStream(logFilePath);
    // create a readline interface to read the file line by line
    const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
    });
    let timeSeriesData = {};
    let endpointMapper = {};
    let statusCodeMapper = {};
    rl.on("line", (line) => {
        let flag = false;
        if (line.includes('GET') || line.includes('POST') || line.includes('PUT') || line.includes('PATCH') || line.includes('DELETE')) {
            flag = true;
        }
        // if endpoint is hit, extract the endpoint and status code and time from the line
        if (flag) {
            let matches = line.match(/"([^"]+)"/g);
            if (matches && matches.length >= 2) {
                const endpointText = matches[0];
                let lineWithoutFirstQuotedText = line.substring(line.indexOf(endpointText) + endpointText.length + 1);
                let statusCode = lineWithoutFirstQuotedText.substring(0, 3);
                const firstQuotedText = endpointText.slice(1, -1);
                let endpoint = firstQuotedText.split(' ')[1];
                endpointMapper[endpoint] = endpointMapper[endpoint] ? endpointMapper[endpoint] + 1 : 1;
                statusCodeMapper[statusCode] = statusCodeMapper[statusCode] ? statusCodeMapper[statusCode] + 1 : 1;
            }
            else {
                console.log('Not enough quoted text found in the log line.');
            }
            let time = line.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/g);
            if (time != null) {
                let timeString = time.toString();
                timeSeriesData[timeString] = timeSeriesData[timeString] ? timeSeriesData[timeString] + 1 : 1;
            }
        }
    });
    rl.on('close', async () => {
        const answer = await inquirer.prompt([
            {
                type: "list",
                name: "name",
                message: "Which data do you want to see?",
                choices: [
                    "Time Series Data",
                    "Endpoint Mapper",
                    "Status Code Mapper"
                ]
            }
        ]);
        if (answer.name === "Time Series Data") {
            console.table(timeSeriesData);
        }
        else if (answer.name === "Endpoint Mapper") {
            console.table(endpointMapper);
        }
        else if (answer.name === "Status Code Mapper") {
            // Adding statusCode messages to the table
            const tableData = Object.entries(statusCodeMapper).map(([statusCode, count]) => ({
                message: statusCodes[statusCode],
                StatusCode: statusCode,
                Count: count,
            }));
            console.table(tableData);
        }
    });
    stream.on('error', (err) => {
        // reject(err);
        console.log(err);
    });
}
async function askQuestion(logFiles) {
    const answer = await inquirer.prompt([
        {
            type: "list",
            name: "name",
            message: "Which file do you want to evaluate?",
            choices: logFiles
        }
    ]);
    console.log(`Hello ${answer.name}`);
    countEndpointHits(`./logs/${answer.name}`);
}
const logFiles = [];
fs.readdir("./logs", (err, files) => {
    if (err) {
        console.log(err);
    }
    else {
        // push files into logFiles array if they are .log files
        files.forEach(file => {
            if (file.endsWith(".log")) {
                logFiles.push(file);
            }
        });
        askQuestion(logFiles);
    }
});
