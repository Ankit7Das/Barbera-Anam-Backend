require('dotenv').config();

var AWS = require('aws-sdk');
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var sns = new AWS.SNS({apiVersion: '2010-03-31'});
var documentClient = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const { userVerifier } = require("./authentication");

exports.handler = async (event) => {
    try {

        var obj = JSON.parse(event.body);
        var barberId = event.pathParameters.barberId;
        var tokenArray = event.headers.Authorization.split(" ");
        var token = tokenArray[1];

        if(token == null) {
            return {
                statusCode: 401,
                headers: {
                    "Access-Control-Allow-Headers" : "Content-Type",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
                body: JSON.stringify({
                    success: false,
                    message: "No token passed"
                })
            };
        }

        var userID;

        try {
            userID = jwt.verify(token, JWT_SECRET);
        } catch(err) {
            return {
                statusCode: 403,
                headers: {
                    "Access-Control-Allow-Headers" : "Content-Type",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
                body: JSON.stringify({
                    success: false,
                    message: "Invalid Token",
                })
            };
        }

        var exist1 = await userVerifier(userID.id);

        if(exist1.success == false) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Headers" : "Content-Type",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
                body: JSON.stringify({
                    success: false,
                    message: 'User not found',
                })
            }
        }

        if(exist1.user.role != 'admin') {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Headers" : "Content-Type",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
                body: JSON.stringify({
                    success: false,
                    message: 'Not an admin',
                })
            }
        }

        var today = new Date();
        today.setHours(today.getHours() + 5);
        today.setMinutes(today.getMinutes() + 30);
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        var day = dd + '-' + mm + '-' + yyyy;
        var params;
        var data;
        var logs = [];

        console.log("user verification");

        for(var i = 0; i < 30; i++) {
            params = {
                TableName: 'BarbersLog',
                ProjectionExpression: '#date, #barberId, #distance',
                Key: {
                    date: day,
                    barberId: barberId
                },
                ExpressionAttributeNames: {
                    '#date': 'date',
                    '#barberId':'barberId',
                    '#distance':'distance'
                }
            }

            data = await documentClient.get(params).promise();

            if(!data.Item) {
                break;
            }

            logs.push(data.Item);
            

            today.setDate(today.getDate() - 1);
            dd = String(today.getDate()).padStart(2, '0');
            mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            yyyy = today.getFullYear();
            day = dd + '-' + mm + '-' + yyyy;
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            body: JSON.stringify({
                success: true,
                message: 'Barber Logs found',
                logs: logs.reverse(),
            })
        }
        
    } catch(err) {
        console.log(err);
        return err;
    }
}