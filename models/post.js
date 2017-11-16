var mongodb = require("./db"),
	markdown = require("markdown").markdown;

function Post(name, title, tags, post){
	this.name = name;
	this.title = title;
	this.tags = tags;
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
		post: this.post,
		tags: this.tags,
		comments: []
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


Post.getTen = function(name, page, callback){
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

			//使用 count 返回特定查询的文档数 total
			collection.count(query, function(err, total){
				collection.find(query, {
					skip: (page - 1) * 10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function(err, docs){
					mongodb.close();
					if(err) {
						return callback(err);
					}
					//解析markdown为html
					docs.forEach(function(doc){
						doc.post = markdown.toHTML(doc.post);
					});
					callback(null, docs, total);
				});
			});
		});
	});
};

Post.getOne = function(name, day, title, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、发表日期及文章名进行查询
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function (err, doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        //解析 markdown 为 html
        //doc.post = markdown.toHTML(doc.post);
        if(doc){
			doc.post = markdown.toHTML(doc.post);
			if(doc.comments){
				doc.comments.forEach(function(comment){
					comment.content = markdown.toHTML(comment.content);
				});
			}
        }
        callback(null, doc);//返回查询的一篇文章
      });
    });
  });
};

Post.edit = function(name, day, title, callback) {
	mongodb.open(function(err, db){
		if(err) {
			return callback(err);
		}
		//读取posts集合
		db.collection('posts', function(err, collection){
			if(err) {
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function(err, doc){
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, doc);
			});
		});
	});
};

Post.update = function(name, day, title, post, callback){
	mongodb.open(function(err, db){
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err) {
				mongodb.close();
				return callback(err);
			}

			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$set: {post: post}
			}, function(err) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

Post.remove = function(name, day, title, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、日期和标题查找并删除一篇文章
      collection.remove({
        "name": name,
        "time.day": day,
        "title": title
      }, {
        w: 1
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

Post.getArchive = function(callback){
	mongodb.open(function(err, db){
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err) {
				mongodb.close();
				return callback(err);
			}

			collection.find({}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function(err, docs){
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//返回含有特定标签的所有文章
Post.getTags = function(callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //distinct 用来找出给定键的所有不同值
      collection.distinct("tags", function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

//返回特定标签页
Post.getTag = function(tag, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //查询所有 tags 数组内包含 tag 的文档
      //并返回只含有 name、time、title 组成的数组
      collection.find({
        "tags": tag
      }, {
        "name": 1,
        "time": 1,
        "title": 1
      }).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};