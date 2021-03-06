require('dotenv').config();

var AWS = require('aws-sdk');
var uuid = require('uuid');
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var sns = new AWS.SNS({apiVersion: '2010-03-31'});
var documentClient = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const { userVerifier, serviceVerifier } = require("./authentication");
const { getDistance } = require('./helper');

exports.handler = async (event) => {
    try {

        var tokenArray = event.headers.Authorization.split(" ");
        var token = tokenArray[1];
        var obj = JSON.parse(event.body);
        // var LONG = obj.longitude;
        // var LAT = obj.latitude;
        
        if(token == null) {
            return {
                statusCode: 401,
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
                body: JSON.stringify({
                    success: false,
                    message: 'User not found',
                })
            }
        }

        if(exist1.user.role != 'user') {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    success: false,
                    message: 'Not a user',
                })
            }
        }

        var params = {
            TableName: 'Bookings',
            KeyConditionExpression: '#user = :u',
            ExpressionAttributeValues: {
                ':u': userID.id,
            },
            ExpressionAttributeNames: {
                '#user': 'userId',
            }
        }

        try {
            var data = await documentClient.query(params).promise();
            var data1;
            var info;

            console.log(data);
            var day1;
            var today1;

            for(var i=0;i<data.Items.length;i++) {

                info = data.Items[i].serviceId.split(',');

                console.log(info);
                console.log(data.Items[i].date);

                params = {
                    TableName: 'Services',
                    Key:{
                        id: info[0]
                    }
                }

                data1 = await documentClient.get(params).promise();

                data.Items[i].service = data1.Item;

                params = {
                    TableName: 'Users',
                    Key:{
                        id: data.Items[i].barberId
                    }
                }
                
                data1 = await documentClient.get(params).promise();

                delete data.Items[i].barberId;

                if(!data1.Item.name) {
                    data1.Item.name = '';
                }
                
                data1.Item.distance = await getDistance(exist1.user.latitude, exist1.user.longitude, data1.Item.latitude, data1.Item.longitude);
                data.Items[i].barber = data1.Item;

                day1 = data.Items[i].date.split('-');
                today1 = new Date(Number(day1[2]),Number(day1[1]),Number(day1[0]),Number(data.Items[i].slot));
                data.Items[i].booktime = today1.getTime();

            }

            var today = new Date();
            today.setHours(today.getHours() + 5);
            today.setMinutes(today.getMinutes() + 30);

            // var done = data.Items.filter((item) => {
            //     return item.service_status === 'done';
            // });

            var not_done = data.Items.filter((item) => {
                return item.service_status !== 'done';
            })

            // done.sort((a,b) => {
            //     if(a.booktime < b.booktime) {
            //         return 1;
            //     } else if(a.booktime > b.booktime) {
            //         return -1;
            //     } else {
            //         return 0;
            //     }
            // })

            not_done.sort((a,b) => {
                if(a.booktime < b.booktime) {
                    return -1;
                } else if(a.booktime > b.booktime) {
                    return 1;
                } else {
                    return 0;
                }
            })

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'Booking found',
                    not_done: not_done
                })
            }

        } catch(err) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    success: false,
                    message: 'Booking not found'
                })
            }
        }
        
    } catch(err) {
        console.log(err);
        return err;
    }
}