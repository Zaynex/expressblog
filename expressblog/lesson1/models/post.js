var mongodb = require("./db"),
	markdown = require("markdown").markdown;

function Post(name, title, post){
	this.name = name;
	this.title = title;
	this.post = post;
}
module.exports = Post;

//存储文章
Post.prototype.save = function(callback){
	var date = new Date();
	//保存各种形式的时间，方便扩展
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + '-' + (date.getMonth() + 1),
		day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
		minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};
	//要存入数据库的文档
	var post = {
		name: this.name,
		time: time,
		title: this.title,
		post: this.post
	};
	//打开数据库
	mongodb.open(function(err, db){
		if(err) {
			return callback(err);
		}

		db.collection('posts', function(err, collection){
			if(err) {
				mongodb.close();
				return callback(err);
			}
			//将文档插入到集合中
			collection.insert(post, {
				safe: true
			}, function(err) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null);//返回err为null
			});
		});
	});
};


Post.get = function(name, callback){
	mongodb.open(function(err, db){
		if(err) {
			return callback(err);
		}

		db.collection('posts', function(err, collection){
			if(err) {
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if(name) {
				query.name = name;
			}
			//根据query查找文章对象
			collection.find(query).sort({
				time: -1
			}).toArray(function(err, docs){
				mongodb.close();
				if(err) {
					return callback(err);
				}
				docs.forEach(function(doc){
					doc.post = markdown.toHTML(doc.post);
				});
				callback(null, docs);
			});
		});
	});
};