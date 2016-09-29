var crypto = require("crypto"), // 散列值加密
User = require("../models/user.js"),
Post = require("../models/post.js");
module.exports = function(app) {

	app.get('/', function (req, res) {
		Post.get(null, function(err, posts){
			if(err) {
				posts = [];
			}
			res.render('index', {
				title: '主页',
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
			post = new Post(currentUser.name, req.body.title, req.body.post);
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