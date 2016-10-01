var crypto = require("crypto"), // 散列值加密
	User = require("../models/user.js"),
	Post = require("../models/post.js"),
	Comment = require("../models/comment.js"),
	multer = require('multer');

module.exports = function(app) {
	app.get('/', function (req, res) {
		var page = parseInt(req.query.p) || 1;
		Post.getTen(null, page, function(err, posts, total){
			if(err) {
				posts = [];
			}
			res.render('index', {
				title: '主页',
				page: page,
				isFirstPage: (page-1) == 0,
				isLastPage: ((page - 1) * 10 + posts.length) == total,
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res){
		res.render('reg', {
			title: '注册',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res){

	// 就是 POST 请求信息解析过后的对象，例如我们要访问 POST 来的表单内的 name="password" 域的值，只需访问 req.body['password'] 或 req.body.password 即可。
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];
		//如果两次密码不一致
		if(password_re !== password) {
			req.flash('error', '两次密码输入不一致');
			// 重定向功能，实现了页面的跳转
			return res.redirect('/reg');//返回注册页
		}

		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: name,
			password: password,
			email: req.body.email
		});
		//检查用户名是否已经存在
		User.get(newUser.name, function(err, user){
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			if(user) {
				req.flash('error', '用户名已存在');
				//这里太粗暴了，可以改下
				return res.redirect('/reg');//返回注册页
			}
			//如果用户不存在
			newUser.save(function(err, user){
				if(err) {
					req.flash('error', err);
					return res.redirect('/reg');
				}
				req.session.user = newUser;//将用户信息存到session
				req.flash('success', '注册成功');
				res.redirect('/');//注册成功后返回主页
			});
		});
	});


	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res){
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		//检查用户是否存在
		User.get(req.body.name, function(err, user){
			if(!User) {
				req.flash('err', '用户不存在');
				return res.redirect('/login');//用户不存在就跳到登录页
			}
			if(user.password !== password) {
				req.flash('err', '密码错误');
				return res.redirect('/login');//跳转到登录页
			}
			//用户名密码都匹配后，将用户信息存入session
			req.session.user = user;
			req.flash('success', '登录成功');
			res.redirect('/');//登录成功后跳转到主页
		});
	});
	app.get('/login', checkNotLogin);//检查下是否登录
	app.get('/login', function(req, res){
		res.render('login', {
			title: "登录",
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.get('/post', checkLogin);
	app.get('/post', function(req, res){
		res.render('post', {
			title: "发表",
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post("/post", function(req, res){
		var currentUser = req.session.user,
			tags = [req.body.tag1, req.body.tag2, req.body.tag3],
			post = new Post(currentUser.name, req.body.title, tags, req.body.post);
		post.save(function(err) {
			if(err) {
				req.flash("error", err);
				return res.redirect('/');
			}
			req.flash('success', '发布成功');
			res.redirect('/');
		});
	});

	app.get('/logout', function(req, res){
		req.session.user = null;//丢掉session的用户内容
		req.flash('success', '登出成功');
		res.redirect('/');//登出后到主页
	});



	var storage = multer.diskStorage({
		//设置上传后文件路径，uploads文件夹会自动创建。
		destination: function(req, file, cb) {
			cb(null, './public/images');
		},
		filename: function(req, file, cb) {
			cb(null, file.originalname);
		}
	});
	var upload = multer({
		storage: storage
	});


	app.get('/upload',checkLogin);
	app.get('/upload', function(req, res){
		res.render('upload', {
			title: '文件上传',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/upload',checkLogin);

	app.post('/upload', upload.array('field1',5),function(req, res){
		req.flash('success', '文件上传成功！');
		res.redirect('/upload');
	});


	app.get('/u/:name', function(req, res){
		var page = parseInt(req.query.p, 10) || 1;
		//检查用户是否存在
		User.get(req.params.name, function(err, user){
			if(!user) {
				req.flash('error', '用户名不存在');
				return res.redirect('/');
			}
			//查询并返回到用户第page页的10篇文章
			Post.getTen(user.name, page, function(err, posts, total){
				if(err) {
					req.flash("error",err);
					return res.redirect('/');
				}
				res.render('user', {
					title: user.name,
					posts: posts,
					page: page,
					isFirstPage: (page-1) == 0,
					isLastPage: ((page-1) * 10 + posts.length)== total,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});
	app.get('/u/:name/:day/:title', function (req, res) {
		Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('article', {
				title: req.params.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('/edit/:name/:day/:title', function(req ,res){
		var currentUser = req.session.user;
		Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post){
			if(err) {
				req.flash('error', err);
				return res.redirect('back');
			}

			res.render('edit',{
				title: "编辑",
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});


	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function(req, res){
		var currentUser = req.session.user;
		Post.update(currentUser.name, req.params.day, req.params.title, req.body.post,function(err){
			var url = encodeURI('/u/'+ req.params.name + '/' + req.params.day + '/' + req.params.title);
			if(err) {
				req.flash('error', err);
				return res.redirect(url);
			}
			req.flash('success', '修改成功');
			res.redirect(url);//返回文章页
		});
	});

	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function(req, res){
		var currentUser = req.session.user;
		Post.remove(currentUser.name, req.params.day, req.params.title, function(err) {
			if(err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '删除成功');
			res.redirect('/');
		});
	});


	//留言部分
	app.post("/u/:name/:day/:title", function(req, res){
		var date = new Date(),
			time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +date.getDate() + " " + date.getHours() + ":" + (date.getMinutes()< 10 ? "0" + date.getMinutes() : date.getMinutes());
		var comment = {
			name: req.body.name,
			email: req.body.email,
			website: req.body.website,
			time: time,
			content: req.body.content
		};
		var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
		newComment.save(function(err) {
			if(err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '留言成功');
			res.redirect('back');
		});
	});


	//存档
	app.get('/archive', function(req, res){
		Post.getArchive(function(err, posts){
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('archive', {
				title: '存档',
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
app.get('/tags', function (req, res) {
  Post.getTags(function (err, posts) {
    if (err) {
      req.flash('error', err); 
      return res.redirect('/');
    }
    res.render('tags', {
      title: '标签',
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
app.get('/tags/:tag', function (req, res) {
  Post.getTag(req.params.tag, function (err, posts) {
    if (err) {
      req.flash('error',err); 
      return res.redirect('/');
    }
    res.render('tag', {
      title: 'TAG:' + req.params.tag,
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
	function checkLogin(req, res, next) {
		if(!req.session.user) {
			req.flash('error', '未登录！');
			res.redirect('/login');
		}
		next();
	}

	function checkNotLogin(req, res, next) {
		if(req.session.user) {
			req.flash('error', "已登录");
			res.redirect('back');
		}
		next();
	}

	
};