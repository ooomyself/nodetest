const express = require('express'), //express 框架 
      wechat  = require('./wechat/wechat'), 
       config = require('./config');//引入配置文件
       
var app = express();//实例express框架

var wechatApp = new wechat(config); //实例wechat 模块

//用于处理所有进入 3000 端口 get 的连接请求
app.get('/',function(req,res){
    wechatApp.auth(req,res);
});

// 用于处理所有进入 3000 端口 post 的连接请求
// app.post('/',function(req,res){
//     wechatApp.handleMsg(req,res);
// });

// 用于请求获取 access_token
app.get('/getAccessToken',function(req,res){
    wechatApp.getAccessToken().then(function(data){
        res.send(data);
    });    
});

// 用于处理所有进入 3000 端口 post 的连接请求
app.post('/',function(req,res){
    console.log("req===")
    var buffer = [];
    //监听 data 事件 用于接收数据
    req.on('data',function(data){
        buffer.push(data);
    });
    //监听 end 事件 用于处理接收完成的数据
    req.on('end',function(){
    //输出接收完成的数据   
         console.log(Buffer.concat(buffer).toString('utf-8'));
    });
});

//监听3000端口
app.listen(3000);