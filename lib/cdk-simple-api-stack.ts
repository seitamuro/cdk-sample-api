import * as cdk from "aws-cdk-lib";
import {
  IResource,
  LambdaIntegration,
  MockIntegration,
  PassthroughBehavior,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { AssetCode, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkSimpleApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoTable = new Table(this, "items", {
      partitionKey: { name: "itemId", type: AttributeType.STRING },
      tableName: "items",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const getItemLambda = new Function(this, "getOneItemFunction", {
      code: new AssetCode("lib/lambda"),
      handler: "get-item.handler",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: "itemId",
      },
    });
    dynamoTable.grantReadData(getItemLambda);

    const postItemLambda = new Function(this, "postItemFunction", {
      code: new AssetCode("lib/lambda"),
      handler: "post-item.handler",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: "itemId",
      },
    });
    dynamoTable.grantWriteData(postItemLambda);

    const api = new RestApi(this, "itemsApi", {
      restApiName: "Items Service",
    });
    const items = api.root.addResource("items");

    const singleItem = items.addResource("{id}");
    const getItemIntegration = new LambdaIntegration(getItemLambda);
    singleItem.addMethod("GET", getItemIntegration);
    addCorsOptions(singleItem);
    const postItemIntegration = new LambdaIntegration(postItemLambda);
    items.addMethod("POST", postItemIntegration);
  }
}

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod(
    "OPTIONS",
    new MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers":
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            "method.response.header.Access-Control-Allow-Origin": "'*'",
            "method.response.header.Access-Control-Allow-Methods":
              "'GET,OPTIONS,POST,PUT,DELETE'",
          },
        },
      ],
      passthroughBehavior: PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
    }),
    {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Credentials": true,
          },
        },
      ],
    }
  );
}
