'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const uuid = require('uuid/v4');
const request = require('request');
const axios = require('axios');
const express = require('express');

const postsTable = process.env.POSTS_TABLE;
// Create a response
function response(statusCode, message) {
	return {
		statusCode: statusCode,
		body: JSON.stringify(message),
	};
}
function sortByDate(a, b) {
	if (a.createdAt > b.createdAt) {
		return -1;
	} else return 1;
}
/****************** npm install -g serverless;
 ********************serverless deploy ***************************/

module.exports.createPost = (event, context, callback) => {
	//Code to upload file to s3 bucket
	(async () => {
		try {
			// fetch data from a url endpoint
			var s3 = new AWS.S3();
			const response = await axios.get('https://dog.ceo/api/breeds/image/random');

			const breed = response.data.message.split('/');

			const uploadFileToS3 = (url, bucket, key) => {
				return axios.get(url, {responseType: 'arraybuffer', responseEncoding: 'binary'}).then((response) => {
					const params = {
						ContentType: response.headers['content-type'],
						ContentLength: response.data.length.toString(), // or response.header["content-length"] if available for the type of file downloaded
						Bucket: bucket,
						Body: response.data,
						Key: key,
					};
					return s3.putObject(params).promise();
				});
			};

			uploadFileToS3(`${response.data.message}`, 'backendpics', `${breed[4]}.jpg`)
				.then(() => console.log('File saved!'))
				.catch((error) => callback(error));

			// return response;
		} catch (error) {
			callback('error', error);
			// appropriately handle the error
		}
	})();
};
//
//
// Create a post
//
//
// module.exports.createPost = (event, context, callback) => {
// 	//Code to upload file to s3 bucket
// 	(async () => {
// 		try {
// 			// fetch data from a url endpoint
// 			var s3 = new AWS.S3();
// 			const response = await axios.get('https://dog.ceo/api/breeds/image/random');

// 			const breed = response.data.message.split('/');

// 			const uploadFileToS3 = (url, bucket, key) => {
// 				return axios.get(url, {responseType: 'arraybuffer', responseEncoding: 'binary'}).then((response) => {
// 					const params = {
// 						ContentType: response.headers['content-type'],
// 						ContentLength: response.data.length.toString(), // or response.header["content-length"] if available for the type of file downloaded
// 						Bucket: bucket,
// 						Body: response.data,
// 						Key: key,
// 					};
// 					return s3.putObject(params).promise();
// 				});
// 			};

// 			uploadFileToS3(`${response.data.message}`, 'backendpics', `${breed[4]}.jpg`)
// 				.then(() => console.log('File saved!'))
// 				.catch((error) => console.log(error));

// 			// return response;
// 		} catch (error) {
// 			console.log('error', error);
// 			// appropriately handle the error
// 		}
// 	})();
// };
//
//
// Get all posts
//
//
module.exports.getAllPosts = (event, context, callback) => {
	return db
		.scan({
			TableName: postsTable,
		})
		.promise()
		.then((res) => {
			callback(null, response(200, res.Items.sort(sortByDate)));
		})
		.catch((err) => callback(null, response(err.statusCode, err)));
};
//
//
// Get number of posts
//
//
// module.exports.getPosts = (event, context, callback) => {
// 	const numberOfPosts = event.pathParameters.number;
// 	const params = {
// 		TableName: postsTable,
// 		Limit: numberOfPosts,
// 	};
// 	return db
// 		.scan(params)
// 		.promise()
// 		.then((res) => {
// 			callback(null, response(200, res.Items.sort(sortByDate)));
// 		})
// 		.catch((err) => callback(null, response(err.statusCode, err)));
// };
//
//
// Get a single post
//
//

module.exports.getPost = (event, context, callback) => {
	const id = event.pathParameters.id;

	const params = {
		Key: {
			id: id,
		},
		TableName: postsTable,
	};

	return db
		.get(params)
		.promise()
		.then((res) => {
			if (res.Item) callback(null, response(200, res.Item));
			else callback(null, response(404, {error: 'Post not found'}));
		})
		.catch((err) => callback(null, response(err.statusCode, err)));
};

// Get a Name
module.exports.getPostByName = (event, context, callback) => {
	const name = event.pathParameters.name;

	const params = {
		Key: {
			name: name,
		},
		TableName: postsTable,
	};

	return db
		.get(params)
		.promise()
		.then((res) => {
			if (res.Item) callback(null, response(200, res.Item));
			else callback(null, response(404, {error: 'Post not found'}));
		})
		.catch((err) => callback(null, response(err.statusCode, err)));
};
// // Update a post
// module.exports.updatePost = (event, context, callback) => {
// 	const id = event.pathParameters.id;
// 	const reqBody = JSON.parse(event.body);
// 	const { body, message } = reqBody;

// 	const params = {
// 		Key: {
// 			id: id,
// 		},
// 		TableName: postsTable,
// 		ConditionExpression: 'attribute_exists(id)',
// 		UpdateExpression: 'SET message = :message, body = :body',
// 		ExpressionAttributeValues: {
// 			':message': message,
// 			':body': body,
// 		},
// 		ReturnValues: 'ALL_NEW',
// 	};
// 	console.log('Updating');

// 	return db
// 		.update(params)
// 		.promise()
// 		.then((res) => {
// 			console.log(res);
// 			callback(null, response(200, res.Attributes));
// 		})
// 		.catch((err) => callback(null, response(err.statusCode, err)));
// };
//
//
// Delete a post
//
//
module.exports.deletePost = (event, context, callback) => {
	const id = event.pathParameters.id;
	const params = {
		Key: {
			id: id,
		},
		TableName: postsTable,
	};
	return db
		.delete(params)
		.promise()
		.then(() => callback(null, response(200, {message: 'Post deleted successfully'})))
		.catch((err) => callback(null, response(err.statusCode, err)));
};
