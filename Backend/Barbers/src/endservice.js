require('dotenv').config();

var AWS = require('aws-sdk');
var uuid = require('uuid');
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var documentClient = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const { userVerifier } = require("./authentication");

exports.handler = async (event) => {
    try {

        var tokenArray = event.headers.Authorization.split(" ");
        var token = tokenArray[1];
        var obj = JSON.parse(event.body);
        var OTP = obj.otp;
        var userId = obj.userId;
        var serviceId = obj.serviceId;

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

        if(exist1.user.role != 'barber') {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: 'Not a barber',
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

        var params = {
            TableName: 'Bookings',
            Key: {
                userId: userId,
                serviceId: serviceId[0]
            }
        }

        var data = await documentClient.get(params).promise();

        if(data.Item) {
            if( OTP === data.Item.end_serv_otp ) {

                var flag = true;

                for(var i=0; i<serviceId.length; i++) {
                    params = {
                        TableName: 'Bookings',
                        Key: {
                            userId: userId,
                            serviceId: serviceId[i]
                        }
                    }

                    data = await documentClient.get(params).promise();

                    if(!data.Item || data.Item.date !== day || data.Item.service_status !== 'ongoing') {
                        flag = false;
                        break;
                    }
                }

                if(!flag) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            success: false,
                            message: 'Wrong service ids entered'
                        })
                    };
                }

                for(var i=0; i<serviceId.length; i++) {

                    params = {
                        TableName: 'Bookings',
                        Key: {
                            userId: userId,
                            serviceId: serviceId[i]
                        },
                        UpdateExpression: "set #payment_status=:p, #service_status=:s, #end_serv_otp=:e",
                        ExpressionAttributeNames: {
                            '#payment_status': 'payment_status',
                            '#service_status': 'service_status', 
                            '#end_serv_otp': 'end_serv_otp'
                        },
                        ExpressionAttributeValues:{
                            ":p": 'paid',
                            ":s": 'done',
                            ":e": null
                        },
                        ReturnValues:"UPDATED_NEW"
                    }

                    data = await documentClient.update(params).promise();
                }

                params = {
                    TableName: 'Users',
                    Key: {
                        id: exist1.user.id,
                    },
                    UpdateExpression: "set #mode=:m",
                    ExpressionAttributeNames: {
                        '#mode': 'mode', 
                    },
                    ExpressionAttributeValues:{
                        ":m": 'end',
                    },
                    ReturnValues:"UPDATED_NEW"
                }

                data = await documentClient.update(params).promise();

                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        success: true,
                        message: 'OTP matched'
                    })
                }
            } else {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message: 'OTP mismatch'
                    })
                };
            }
        }else {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: 'No such booking exists'
                })
            };
        }

    } catch(err) {
        console.log(err);
        return err;
    }
}