import * as AWS from "aws-sdk";

const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

export const handler = async (event: any = {}): Promise<any> => {
  const body = JSON.parse(event.body);
  const itemId = body.itemId;
  if (!itemId) {
    return {
      statusCode: 400,
      body: `Error: You are missing the itemId parameter`,
    };
  }

  const itemName = body.itemName;
  if (!itemName) {
    return {
      statusCode: 400,
      body: `Error: You are missing the itemName parameter`,
    };
  }

  const params = {
    TableName: TABLE_NAME,
    Item: {
      [PRIMARY_KEY]: itemId,
      itemName: itemName,
    },
  };

  try {
    await db.put(params).promise();
    return { statusCode: 200, body: "your item was saved" };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
