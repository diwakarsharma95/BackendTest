'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const uuid = require('uuid/v4');
const request = require('request');

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
//
//
// Create a post
//
//

module.exports.createPost = (event, context, callback) => {
	const reqBody = JSON.parse(event.body);

	let url = 'https://dog.ceo/api/breeds/image/random';

	let options = { json: true };
	request(url, options, (error, res, body) => {
		if (error) {
			return console.log(error);
		}
		const breed = body.message.split('/');

		// breeds = []

		if (!error && res.statusCode == 200) {
			const post = {
				id: uuid(),
				name: breed[4],
				createdAt: new Date().toISOString(),
				message: body.message,
				status: body.status,
			};

			return db
				.put({
					TableName: postsTable,
					Item: post,
				})
				.promise()
				.then(() => {
					callback(null, response(201, post));
				})
				.catch((err) => response(null, response(err.statusCode, err)));
		}
	});
};
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
			else callback(null, response(404, { error: 'Post not found' }));
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
			else callback(null, response(404, { error: 'Post not found' }));
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
		.then(() => callback(null, response(200, { message: 'Post deleted successfully' })))
		.catch((err) => callback(null, response(err.statusCode, err)));
};
