#Example

##安装依赖

本示例依赖express

```shell
	npm install express
```

##启动

```shell
	node http.js
```

##打开示例页面

访问：http://localhost:3000/admin/test

首次访问页面跳转到/login

根据默认用户名和密码登录

登录成功后跳转回/admin/test

随后访问/admin路径下的页面，都会根据session记录正常访问