#Example

1、安装依赖

本示例依赖express

```bash
npm install express
```

2、启动

```bash
node http.js
```

3、打开示例页面

- 访问：http://localhost:3000/admin/test

- 首次访问页面跳转到/login

- 使用默认用户名和密码登录

- 登录成功后跳转回/admin/test

- 随后访问/admin路径下的页面，都会根据session记录正常访问