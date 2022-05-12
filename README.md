# Barbera-Anam-Backend

This is the backend for the app Barbera Home Services on google play deployed on AWS using services DynamoDB and Lambda using NodeJs.

## Getting in the Backend directory

Get inside the Backend directory for building and deploying to the AWS account:

### `cd Backend`

## AWS Sam CLI Installation

AWS Sam CLI is need for packaging and depploying the lambda functions to the AWS account. 
Install it using [AWS Sam CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

Then configure your AWS account into the CLI

### `aws configure`

and enter username, password and region

## Inside Backend directory

Each particular service APIs are grouped under the correspondingly named directories in .js files. The .yaml files list the services used. 
To package and deploy the API of a particular directory, run the code

### `sam build -t [.yaml file in the directory]`
### `sam package --output-template-file packaged.yaml --s3-bucket [Bucket Name]` 
### `sam deploy --template-file packaged.yaml --region [region] --capabilities CAPABILITY_IAM --stack-name [stack name]`

