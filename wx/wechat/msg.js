'use strict' //设置为严格模式
exports.txtMsg = function(toUser,fromUser,content){
    var xmlContent =  "<xml><ToUserName><![CDATA["+ toUser +"]]></ToUserName>";
        xmlContent += "<FromUserName><![CDATA["+ fromUser +"]]></FromUserName>";
        xmlContent += "<CreateTime>"+ new Date().getTime() +"</CreateTime>";
        xmlContent += "<MsgType><![CDATA[text]]></MsgType>";
        xmlContent += "<Content><![CDATA["+ content +"]]></Content></xml>";
    return xmlContent;
}