require('dotenv').config();

var AWS = require('aws-sdk');
var uuid = require('uuid');
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var sns = new AWS.SNS({apiVersion: '2010-03-31'});
var documentClient = new AWS.DynamoDB.DocumentClient({ region: 'ap-southeast-1' });
const jwt = require("jsonwebtoken");
const { userVerifier } = require("./authentication");
const { hashPassword, matchPassword } = require("./password");
const { JWT_SECRET } = process.env;

exports.register = async (event) => {
    try {
        var obj = JSON.parse(event.body);

        var EMAIL = obj.email;
        var NAME = obj.name;
        var token = event.headers.token;

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

        if(exist1 == false) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: 'User not found',
                    succes: false,
                })
            }
        }
        
        var params = {
            TableName: 'Users',
            Key: {
                id: userID.id,
            },
            UpdateExpression: "set #name=:n, #email=:e",
            ExpressionAttributeNames: {
                '#name': 'name',
                '#email': 'email',
            },
            ExpressionAttributeValues:{
                ":n": NAME,
                ":e": EMAIL,
            },
            ReturnValues:"UPDATED_NEW"
        };

        var data;
        var msg;

        try {
            data = await documentClient.update(params).promise();
            msg = 'User info updated successfully';

            var response = {
                'statusCode': 200,
                'body': JSON.stringify({
                    success: true,
                    message: msg
                })
            };
        } catch(err) {
            msg = err;
            var response = {
                'statusCode': 500,
                'body': JSON.stringify({
                    success: false,
                    message: msg,
                })
            };
        }

    } catch(err) {
        console.log(err);
        return err;
    }

    return response;

}

exports.addupdate = async (event) => {
    try {

        var obj = JSON.parse(event.body);
        var ADD = obj.address;
        var LONG = obj.longitude;
        var LAT = obj.latitude;
        var token = event.headers.token;

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

        if(exist1 == false) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: 'User not found',
                    succes: false,
                })
            }
        }

        var params = {
            TableName: 'Users',
            Key: {
                id: userID.id,
            },
            UpdateExpression: "set #address=:a, #long=:lo, #lat=:la",
            ExpressionAttributeNames: {
                '#address': 'address',
                '#long': 'longitude',
                '#lat': 'latitude'
            },
            ExpressionAttributeValues:{
                ":a": ADD,
                ":lo": LONG,
                ":la": LAT
            },
            ReturnValues:"UPDATED_NEW"
        };

        var data;
        var msg;

        try {
            data = await documentClient.update(params).promise();
            msg = 'User info updated successfully';

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: msg
                })
            };
        } catch(err) {
            msg = err;
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    message: msg,
                })
            };
        }

    }catch(err) {
        console.log(err);
        return err;
    }
}

// exports.loginemail = async (event) => {
//     try {
//         var obj = JSON.parse(event.body);

//         var EMAIL = obj.email;
        
//         var params = {
//             TableName: 'Users',
//             FilterExpression: '#email = :this_email',
//             ExpressionAttributeValues: {':this_email': EMAIL},
//             ExpressionAttributeNames: {'#email': 'email'}
//         };

//         var data;

        
//         data = await documentClient.scan(params).promise();
        
//         if(!data.Items[0]) {
//             var response = {
//                 'statusCode': 404,
//                 'body': JSON.stringify({
//                     success: false,
//                     message: "User not found",
//                 })
//             };
//         } else {
//             console.log("Item read successfully:", data);

//             var user = {
//                 email: EMAIL,
//             }

//             var token = jwt.sign(user, JWT_SECRET, { expiresIn: new Date().setDate(new Date().getDate() + 30) });

//             var response = {
//                 'statusCode': 200,
//                 'body': JSON.stringify({
//                     success: true,
//                     token: token,
//                     message: "User found",
//                 })
//             };
            
//         }
//     } catch(err) {
//         console.log(err);
//         return err;
//     }

//     return response;

// }


// exports.loginpass = async (event) => {
//     try {
//         var obj = JSON.parse(event.body);
//         var head = event.headers;
//         var PASS = obj.password;
//         var token = head.token;

//         if(token == null) {
//             return {
//                 statusCode: 401,
//                 body: JSON.stringify({
//                     success: false,
//                     message: "No token passed"
//                 })
//             };
//         }

//         var userID;

//         try {
//             userID = jwt.verify(token, JWT_SECRET);
//         } catch(err) {
//             return {
//                 statusCode: 403,
//                 body: JSON.stringify({
//                     success: false,
//                     message: "Invalid Token",
//                 })
//             };
//         }

//         var params = {
//             TableName: 'Users',
//             FilterExpression: '#email = :this_email',
//             ExpressionAttributeValues: {':this_email': userID.email},
//             ExpressionAttributeNames: {'#email': 'email'}
//         };

//         var data;

//         data = await documentClient.scan(params).promise();
        
//         const hashedPassword = data.Items[0].password;
//         const matchedPassword = await matchPassword(PASS, hashedPassword);

//         var user = {
//             id: data.Items[0].id,
//         }

//         var token = jwt.sign(user, JWT_SECRET, { expiresIn: new Date().setDate(new Date().getDate() + 30) });

//         if(matchedPassword) {
//             return {
//                 statusCode: 200,
//                 body: JSON.stringify({
//                     success: true,
//                     token: token,
//                     message: "Login Success",
//                 })
//             };
//         } else {
//             return {
//                 statusCode: 401,
//                 body: JSON.stringify({
//                     success: false,
//                     err: "Incorrect password",
//                 })
//             };
//         }

//     } catch(err) {
//         console.log(err);
//         return err;
//     }

// }


exports.loginphone = async(event) => {
    try {
        var obj = JSON.parse(event.body);

        var PHONE = obj.phone;

        var params = {
            TableName: 'Users',
            FilterExpression: '#phone = :this_phone',
            ExpressionAttributeValues: {':this_phone': PHONE},
            ExpressionAttributeNames: {'#phone': 'phone'}
        };
        
        var data = await documentClient.scan(params).promise();
        var random = Math.floor(100000 + Math.random() * 900000);
        // var random1 = Math.round((Math.pow(36, 6 + 1) - Math.random() * Math.pow(36, 6))).toString(36).slice(1);

        if(!data.Items[0]) {
            var ID = uuid.v1();

            params = {
                TableName: 'Users',
                Item: {
                    id: ID,
                    phone: PHONE,
                    otp: random,
                }
            }

            try {
                data = await documentClient.put(params).promise();
            } catch(err) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        success: false,
                        message: err,
                    })
                };
            }

        } else {

            params = {
                TableName: 'Users',
                Key: {
                    id: data.Items[0].id,
                },
                UpdateExpression: "set #otp=:o ",
                ExpressionAttributeNames: {
                    '#otp': 'otp',
                },
                ExpressionAttributeValues:{
                    ":o": random,
                },
                ReturnValues:"UPDATED_NEW"
            };
    
            try {
                data = await documentClient.update(params).promise();
            } catch(err) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        success: false,
                        message: err,
                    })
                };
            }
            
        }
    
        var user = {
            phone: PHONE,
        }

        var token = jwt.sign(user, JWT_SECRET, { expiresIn: new Date().setDate(new Date().getDate() + 30) });

        var msg = `${random} is your verification code for Barbera: Salon Service at your Home.`;

        random = null; 

        params = {
            Message: msg,
            PhoneNumber: '+91' + PHONE,
        };
    
        var sms = await sns.publish(params).promise();
    
        if(sms.MessageId) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    messageId: sms.MessageId,
                    token: token,
                })
            };
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    messageSuccess: false,
                })
            };
        }
    } catch(err) {
        console.log(err);
        return err;
    }

}

exports.loginotp = async (event) => {
    try {

        var obj = JSON.parse(event.body);

        var OTP = obj.otp;
        var ROLE = obj.role;
        var ADD = obj.address;
        var LONG = obj.longitude;
        var LAT = obj.latitude;
        var token = event.headers.token;
        // var REF = obj.refer; 
        

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

        var params = {
            TableName: 'Users',
            FilterExpression: '#phone = :this_phone',
            ExpressionAttributeValues: {':this_phone': userID.phone},
            ExpressionAttributeNames: {'#phone': 'phone'}
        };
        
        var data = await documentClient.scan(params).promise();

        if(!data.Items[0]) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    succes: false,
                    message: 'Invalid token entered'
                })
            };
        } else {

            var otp = data.Items[0].otp;
            var id = data.Items[0].id;

            params = {
                TableName: 'Users',
                Key: {
                    id: id,
                },
                UpdateExpression: "set #otp=:o, #role=:r, #address=:a, #long=:lo, #lat=:la",
                ExpressionAttributeNames: {
                    '#otp': 'otp',
                    '#role': 'role',
                    '#address': 'address',
                    '#long': 'longitude',
                    '#lat': 'latitude'
                },
                ExpressionAttributeValues:{
                    ":o": null,
                    ":r": ROLE,
                    ":a": ADD,
                    ":lo": LONG,
                    ":la": LAT
                },
                ReturnValues:"UPDATED_NEW"
            };
    
            try {
                data = await documentClient.update(params).promise();
            } catch(err) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        success: false,
                        message: err,
                    })
                };
            }

            if(`${otp}` == OTP){

                // params = {
                //     TableName: 'Users',
                //     FilterExpression: '#refer = :this_refer',
                //     ExpressionAttributeValues: {':this_refer': REF},
                //     ExpressionAttributeNames: {'#refer': 'refer'}
                // };
                
                // data = await documentClient.scan(params).promise();

                // if(!data.Items[0]) {
                //     return {
                //         statusCode: 400,
                //         body: JSON.stringify({
                //             succes: false,
                //             message: 'Wrong referral code entered'
                //         })
                //     };
                // } else{

                //     params = {
                //         TableName: 'Coupons',
                //         Item: {
                //             userId: id,
                //             couponId: uuid.v1(),
                //         }
                //     }

                // }

                var user = {
                    id: id,
                }
    
                token = jwt.sign(user, JWT_SECRET, { expiresIn: new Date().setDate(new Date().getDate() + 30) });
    
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        success: true,
                        message: 'Login/Signup Success',
                        token: token,
                    })
                };

            } else {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        succes: false,
                        message: 'Wrong OTP'
                    })
                };
            }

        }

    } catch(err) {
        console.log(err);
        return err;
    }
    
}