'use strict' //设置为严格模式
const crypto = require("crypto"), // 引入加密模块
    https = require("https"), // 引入https模块
    util = require("util"), // 引入uitl工具包 用于处理占位符
    fs = require("fs"), // 文件操作fs模块
    urltil = require('url'),//引入 url 模块
    menus = require("./menus"),
    accessTokenJson = require("./accessToken"), //引入本地存储的 access_token
    parseString = require('xml2js').parseString,//引入xml2js包
    msg = require('./msg');//引入消息处理模块
    // CryptoGraphy = require('./cryptoGraphy'); //微信消息加解密模块
   

// 构建Wechat对象 即 js 中函数就是对象
var WeChat = function(config){
    // 设置对象属性config
    this.config = config;
    // 设置Wechat 对象属相 token
    this.token = config.token;
    this.appID = config.appID; 
    this.appScrect = config.appScrect;
    this.apiDomain = config.apiDomain;
    this.apiURL = config.apiURL;

    // 用于处理https Get 请求
    this.requestGet = function(url){
        return new Promise(function(resolve, reject){
            https.get(url, function(res){
                var buffer = [], result = "";
                // 监听data 事件
                res.on("data", function(data){
                    buffer.push(data);
                });
                // 监听 数据传输完成事件
                res.on("end", function(){
                    result = Buffer.concat(buffer).toString("utf-8");
                   // 将最后结果返回
                    resolve(result);
                });
            }).on("error", function(err){
                reject(err);
                console.log(err)
            });
        });
    }
    /**
     * 用于处理 https Post请求方法
     * @param {String} url  请求地址
     * @param {JSON} data 提交的数据
     */
    this.requestPost = function(url,data){
        return new Promise(function(resolve,reject){
            //解析 url 地址
            var urlData = urltil.parse(url);
            //设置 https.request  options 传入的参数对象
            var options={
                //目标主机地址
                hostname: urlData.hostname, 
                //目标地址 
                path: urlData.path,
                //请求方法
                method: 'POST',
                //头部协议
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(data,'utf-8')
                }
            };
            var req = https.request(options,function(res){
                var buffer = [],result = '';
                //用于监听 data 事件 接收数据
                res.on('data',function(data){
                    buffer.push(data);
                });
                 //用于监听 end 事件 完成数据的接收
                res.on('end',function(){
                    result = Buffer.concat(buffer).toString('utf-8');
                    console.log("Post 请求")
                    console.log(result);
                    resolve(result);
                })
            })
            //监听错误事件
            .on('error',function(err){
                console.log(err);
                reject(err);
            });
            //传入数据
            req.write(data);
            req.end();
        });
    }
}
/* 微信接入验证 */
WeChat.prototype.auth = function(req, res){

    // var that = this;
    // this.getAccessToken().then(function(data){
    //     //格式化请求连接
    //     var url = util.format(that.apiURL.createMenu,that.apiDomain,data);
    //     //使用 Post 请求创建微信菜单
    //     that.requestPost(url,JSON.stringify(menus)).then(function(data){
    //         //讲结果打印
    //         console.log(data);
    //     });
    // });
    console.log("auth:============")
     //1.获取微信服务器Get请求的参数 
     var signature = req.query.signature, //微信加密签名
     timestamp  = req.query.timestamp, // 时间戳
     nonce =  req.query.nonce, // 随机数
     echostr = req.query.echostr; //随机字符串
     //2.将token,timestramp,nonce 三个参数进行字典排序、
     var array = [this.config.token, timestamp, nonce];
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
}

/* 获取微信access_token */
WeChat.prototype.getAccessToken = function(){
    var that = this;
    return new Promise(function(resolve, reject){
        var currentTime = new Date().getTime();
        var url = util.format(that.apiURL.accessTokenApi, that.apiDomain, that.appID, that.appScrect);
        // 判断 本地储存的 access_token是否有效
        if (accessTokenJson.access_token === "" || accessTokenJson.expires_time < currentTime){
            that.requestGet(url).then(function(data){
                var result = JSON.parse(data);
                if (data.indexOf("errcode")<0){
                    accessTokenJson.access_token = result.access_token;
                    accessTokenJson.expires_time = new Date().getTime() + (parseInt(result.expires_in) - 200)*1000;
                    fs.writeFile("./wechat/accessToken.json", JSON.stringify(accessTokenJson));
                    resolve(accessTokenJson.access_token);
                }else{
                    // 将错误返回
                    resolve(result);
                }
            })
        }else{
            // 将本地储存的 access_token返回
            resolve(accessTokenJson.access_token);
        }
    });
}

/**
 * 微信消息1
 */
/*
WeChat.prototype.handleMsg = function(req,res){
    var buffer = [];
    //监听 data 事件 用于接收数据
    req.on('data',function(data){
        buffer.push(data);
    });
    //监听 end 事件 用于处理接收完成的数据
    req.on('end',function(){
        var msgXml = Buffer.concat(buffer).toString('utf-8');
        //解析xml 将xml 转化为json
        parseString(msgXml,{explicitArray : false},function(err,result){
            if(!err){
                //打印解析结果
                console.log(result);
            }else{
                 //打印错误信息
                console.log(err);
            }
        })
    });
}*/
// 微信消息2
WeChat.prototype.handleMsg = function(req,res){
    var buffer = [];
    //监听 data 事件 用于接收数据
    req.on('data',function(data){
        buffer.push(data);
    });
    //监听 end 事件 用于处理接收完成的数据
    req.on('end',function(){
        var msgXml = Buffer.concat(buffer).toString('utf-8');
        //解析xml 将xml 转化为json
        parseString(msgXml,{explicitArray : false},function(err,result){
            if(!err){
                console.log(result);
               result = result.xml;
               var toUser = result.ToUserName; // 接收方 公众号id
               var fromUserName = result.FromUserName; // 发送方微信 粉丝
               if (result.Event){
                   console.log("Event ====");
                switch(result.Event.toLowerCase()){
                    case "subscribe":
                    // 回复消息
                    var msgXml = msg.txtMsg(fromUserName, toUser, "谢谢关注！");
                    console.log(msgXml);
                    res.send(msgXml);
                    break;
                    case "click":
                        if(result.EventKey === "today_recommend"){
                            var msgXml = msg.txtMsg(fromUserName, toUser, "今日推荐！");
                            res.send(msgXml);
                        }
                    break;
                }
               }else if(result.MsgType.toLowerCase() === "text"){
                var msgXml = msg.txtMsg(fromUserName, toUser, "您发送的消息是："+result.Content);
                console.log(msgXml);
                res.send(msgXml);
               }
              

            }else{
                 //打印错误信息
                console.log(err);
            }
        })
    });
}

/*
WeChat.prototype.handleMsg = function(req,res){
    var buffer = [],that = this;

    //实例微信消息加解密
    var cryptoGraphy = new CryptoGraphy(that.config,req);

    //监听 data 事件 用于接收数据
    req.on('data',function(data){
        buffer.push(data);
    });
    //监听 end 事件 用于处理接收完成的数据
    req.on('end',function(){
        var msgXml = Buffer.concat(buffer).toString('utf-8');
        //解析xml
        parseString(msgXml,{explicitArray : false},function(err,result){
            if(!err){
                result = result.xml;
                //判断消息加解密方式
                if(req.query.encrypt_type == 'aes'){
                    //对加密数据解密
                    result = cryptoGraphy.decryptMsg(result.Encrypt);
                }
                var toUser = result.ToUserName; //接收方微信
                var fromUser = result.FromUserName;//发送仿微信
                var reportMsg = ""; //声明回复消息的变量   

                //判断消息类型
                if(result.MsgType.toLowerCase() === "event"){
                    //判断事件类型
                    switch(result.Event.toLowerCase()){
                        case 'subscribe':
                            //回复消息
                            var content = "欢迎关注 hvkcoder 公众号，一起斗图吧。回复以下数字：\n";
                                content += "1.你是谁\n";
                                content += "2.关于Node.js\n";
                                content += "回复 “文章”  可以得到图文推送哦~\n";
                            reportMsg = msg.txtMsg(fromUser,toUser,content);
                        break;
                        case 'click':
                             var contentArr = [
                                {Title:"Node.js 微信自定义菜单",Description:"使用Node.js实现自定义微信菜单",PicUrl:"http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast",Url:"http://blog.csdn.net/hvkcoder/article/details/72868520"},
                                {Title:"Node.js access_token的获取、存储及更新",Description:"Node.js access_token的获取、存储及更新",PicUrl:"http://img.blog.csdn.net/20170528151333883?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast",Url:"http://blog.csdn.net/hvkcoder/article/details/72783631"},
                                {Title:"Node.js 接入微信公众平台开发",Description:"Node.js 接入微信公众平台开发",PicUrl:"http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast",Url:"http://blog.csdn.net/hvkcoder/article/details/72765279"}
                            ];
                            //回复图文消息
                            reportMsg = msg.graphicMsg(fromUser,toUser,contentArr);
                        break;
                    }
                }else{
                     //判断消息类型为 文本消息
                    if(result.MsgType.toLowerCase() === "text"){
                        //根据消息内容返回消息信息
                        switch(result.Content){
                            case '1':
                                reportMsg = msg.txtMsg(fromUser,toUser,'Hello ！我的英文名字叫 H-VK');
                            break;
                            case '2':
                                reportMsg = msg.txtMsg(fromUser,toUser,'Node.js是一个开放源代码、跨平台的JavaScript语言运行环境，采用Google开发的V8运行代码,使用事件驱动、非阻塞和异步输入输出模型等技术来提高性能，可优化应用程序的传输量和规模。这些技术通常用于数据密集的事实应用程序');
                            break;
                            case '文章':
                                var contentArr = [
                                    {Title:"Node.js 微信自定义菜单",Description:"使用Node.js实现自定义微信菜单",PicUrl:"http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast",Url:"http://blog.csdn.net/hvkcoder/article/details/72868520"},
                                    {Title:"Node.js access_token的获取、存储及更新",Description:"Node.js access_token的获取、存储及更新",PicUrl:"http://img.blog.csdn.net/20170528151333883?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast",Url:"http://blog.csdn.net/hvkcoder/article/details/72783631"},
                                    {Title:"Node.js 接入微信公众平台开发",Description:"Node.js 接入微信公众平台开发",PicUrl:"http://img.blog.csdn.net/20170605162832842?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvaHZrQ29kZXI=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast",Url:"http://blog.csdn.net/hvkcoder/article/details/72765279"}
                                ];
                                //回复图文消息
                                reportMsg = msg.graphicMsg(fromUser,toUser,contentArr);
                            break;
                            default:
                                reportMsg = msg.txtMsg(fromUser,toUser,'没有这个选项哦');
                            break;
                        }
                    }
                }
                //判断消息加解密方式，如果未加密则使用明文，对明文消息进行加密
                reportMsg = req.query.encrypt_type == 'aes' ? cryptoGraphy.encryptMsg(reportMsg) : reportMsg ;
                //返回给微信服务器
                res.send(reportMsg);

            }else{
                //打印错误
                console.log(err);
            }
        });
    });
}*/

// 暴露可供外部访问的接口
module.exports = WeChat