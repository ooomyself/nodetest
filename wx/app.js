console.log("开始");
 // "appID":"wx02a5ee1ccce14483",
 // "appScrect":"ad8da64fe6d42a52c0dd2871a3849db6",
/* 
第一步中的操作 第二部需要修改
const express = require('express'),
    crypto = require("crypto"),
    config = require('./config');
    var app = express();
    app.get('/', function(req, res){
        //1.获取微信服务器Get请求的参数 
        var signature = req.query.signature, //微信加密签名
        timestamp  = req.query.timestamp, // 时间戳
        nonce =  req.query.nonce, // 随机数
        echostr = req.query.echostr; //随机字符串
        //2.将token,timestramp,nonce 三个参数进行字典排序、
        var array = [config.token, timestamp, nonce];
        array.sort();

        //3.将三个参数字符串拼接成一个字符串进行sha1加密
        var tempStr =  array.join("");
        const hashCode = crypto.createHash("sha1"); // 创建加密类型
        var resultCode =  hashCode.update(tempStr, "utf8").digest("hex"); // 对传入的字符串进行加密
        //4.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
        if(resultCode ===  signature){
            console.log("微信");
            res.send(echostr);
        }else{
            res.send("mismatch")
        }
    })*/
const express = require("express"),
        wechat = require("./wechat/wechat"),
        config = require("./config");
var app = express();
var wechatApp = new wechat(config); //实例wechat模块
app.get("/", function(req, res){
    wechatApp.auth(req, res);
}); 
app.get("/getAccessToken", function(req, res){
    wechatApp.getAccessToken().then(function(data){
        res.send(data);
    });
});
// //用于处理所有进入 3000 端口 post 的连接请求
// app.post('/',function(req,res){
//     console.log("post=====")
//     var buffer = [];
//     //监听 data 事件 用于接收数据
//     req.on('data',function(data){
//         buffer.push(data);
//     });
//     //监听 end 事件 用于处理接收完成的数据
//     req.on('end',function(){
//     //输出接收完成的数据   
//          console.log(Buffer.concat(buffer).toString('utf-8'));
//     });
// });   
//用于处理所有进入 3000 端口 post 的连接请求
app.post('/',function(req,res){
     console.log("====Post");
    wechatApp.handleMsg(req,res);
});
app.listen(3000);