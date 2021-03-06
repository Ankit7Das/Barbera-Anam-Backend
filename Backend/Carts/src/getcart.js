require('dotenv').config();

var AWS = require('aws-sdk');
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var sns = new AWS.SNS({apiVersion: '2010-03-31'});
var documentClient = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const { userVerifier, addedBefore, serviceVerifier } = require("./authentication");

exports.handler = async (event) => {
    try {

        var tokenArray = event.headers.Authorization.split(" ");
        var token = tokenArray[1];

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
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: 'Not a user',
                })
            }
        }

        var params = {
            TableName: 'Carts',
            KeyConditionExpression: '#user = :u',
            ExpressionAttributeValues: {
                ':u': userID.id,
            },
            ExpressionAttributeNames: {
                '#user': 'userId'
            }
        };

        try {
            var data = await documentClient.query(params).promise();

            var data1;
            var info;

            for(var i=0;i<data.Items.length;i++) {
                info = data.Items[i].serviceId.split(",");

                params = {
                    TableName: 'Services',
                    Key: {
                        id: info[0],
                    }
                }
            
                data1 = await documentClient.get(params).promise();
            
                if(data1.Item) {
                    data.Items[i].category = data1.Item.category;
                    data.Items[i].type = data1.Item.type;
                    data.Items[i].offerName = (info.length === 2 ? info[1] : "");
                } else {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            success: false,
                            message: 'Service Ids provided are wrong',
                        })
                    };
                }
            }

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'Cart Items found',
                    data: data.Items,
                    count: data.Count
                })
            };
        } catch(err) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: false,
                    message: 'No items in cart'
                })
            };
        }

    } catch(err) {
        console.log(err);
        return err;
    }
}