﻿define(['plugins/router', 'plugins/dialog', 'knockout', 'jquery', 'bootstrap-datepicker', 'jquery.uploadify', 'knockout.validation', 'utils', 'logininfo', 'knockout.mapping', 'jquery.querystring', 'jqPaginator'],
 function (router, dialog, ko,$, bdp, uploadify, kv, utils, loginInfo, km, qs, jq) {
     var vmUser = function (id) {
         var self = this;

         self.vmUserModels = {
             userModelsArray: ko.observableArray(),
             selectedOption: ko.observable()
         }

         //初始化活动动态模块数据
         self.vmUserModels.userModelsArray(getUserModules());
         self.selRoleName = ko.observable(false);
         var i = 0;
         self.vmUserModels.selectedOption.subscribe(function () {
             if (i == 0) { i = i + 1; return; }
             if (self.vmUserModels.selectedOption()) {
                 self.selRoleName(false);
             }
             else {
                 self.selRoleName(true);
             }
         });

         self.userName = ko.observable('').extend({
             maxLength: { params: 50, message: "名称最大长度为50个字符" },
             required: {
                 params: true,
                 message: "请输入用户名称!"
             }
         });
         self.userCode = ko.observable('').extend({
             maxLength: { params: 50, message: "编号最大长度为50个字符" },
             required: {
                 params: true, 
                 message: "请输入用户编号!"
             }
         });
         self.loginName = ko.observable('').extend({
             maxLength: { params: 50, message: "登录名最大长度为50个字符" },
             required: {
                 params: true,
                 message: "请输入登录名!"
             }
         });
//         self.loginPass = ko.observable('').extend({
//             maxLength: { params: 50, message: "名称最大长度为50个字符" },
//             required: {
//                 params: true,
//                 message: "请输入登录密码!"
//             }
//         });
         self.telephone = ko.observable().extend({
             maxLength: { params: 30, message: "联系电话最大长度为30个字符!" },
             required: { params: true, message: "请输入联系电话!" },
             pattern: { params: /(^[0-9]{3,4}\-[0-9]{7,8}\-[0-9]{3,4}$)|(^[0-9]{3,4}\-[0-9]{7,8}$)|(^[0-9]{7,8}\-[0-9]{3,4}$)|(^[0-9]{7,11}$)/, message: "电话格式不正确!" }
         });

         self.address = ko.observable('').extend({
             maxLength: { params: 200, message: "地址最大长度为200个字符" },
             required: {
                 params: true,
                 message: "请输入地址!"
             }
         });
         self.selTitle = ko.observable(false);
         self.reset = function () {
             self.vmUserModels.selectedOption(null);
             self.userName('');
             self.userCode('');
             self.loginName('');
//             self.loginPass('');
             self.telephone('');
             self.address('');
         }
         self.init = function () {
             var sendData = {
                 id: id
             }
             $.ajax({
                 type: "POST",
                 url: "/Admin_Enterprise_User/GetModel",
                 contentType: "application/json;charset=utf-8", //必须有
                 dataType: "json", //表示返回值类型，不必须
                 data: JSON.stringify(sendData),
                 async: false,
                 success: function (jsonResult) {
                     
                     self.vmUserModels.selectedOption(jsonResult.ObjModel.Enterprise_Role_ID);
                     self.userName(jsonResult.ObjModel.UserName);
                     self.userCode(jsonResult.ObjModel.UserCode);
                     self.loginName(jsonResult.ObjModel.LoginName);
//                     self.loginPass(jsonResult.ObjModel.LoginPassWord);
                     self.telephone(jsonResult.ObjModel.UserPhone);
                     self.address(jsonResult.ObjModel.UserAddress);
                 }
             });
         }

         var flag = false;
         self.VerifyLoginName = function () {
             var sendData = {
                 loginName: self.loginName(),
                 id:id
             };
             $.ajax({
                 type: "POST",
                 url: "/Admin_Enterprise_User/VerifyLoginName",
                 contentType: "application/json;charset=utf-8", //必须有
                 dataType: "json", //表示返回值类型，不必须
                 data: JSON.stringify(sendData),
                 async: false,
                 success: function (jsonResult) {
                     if (loginInfo.isLoginTimeout(jsonResult.code, jsonResult.Msg, 1)) {
                         flag = false;
                     };
                     if (jsonResult.code == '0') {
                         dialog.showMessage(jsonResult.Msg, '系统提示', [{ title: '确定', callback: function () {

                         }
                         }]);
                         flag = false;
                     } else if (jsonResult.code == '1') {
                         flag = true;
                     }
                 }
             })
         }

         self.Save = function (data, event) {
             var currentObj = $(event.target);
             currentObj.blur();
             self.errors = ko.validation.group(self);
             if (self.errors().length <= 0 && self.selRoleName) {
                 self.VerifyLoginName();
                 if (!flag) {
                     return;
                 }
                 var sendData = {
                     id: id,
                     userRole: self.vmUserModels.selectedOption(),
                     userName: self.userName(),
                     userCode: self.userCode(),
                     loginName: self.loginName(),
//                     loginPass: self.loginPass(),
                     telephone: self.telephone(),
                     address: self.address()
                 }
                 $.ajax({
                     type: "POST",
                     url: "/Admin_Enterprise_User/Update",
                     contentType: "application/json;charset=utf-8", //必须有
                     dataType: "json", //表示返回值类型，不必须
                     data: JSON.stringify(sendData),
                     async: false,
                     success: function (jsonResult) {
                         if (loginInfo.isLoginTimeout(jsonResult.code, jsonResult.Msg, 1)) {
                             return;
                         };
                         dialog.showMessage(jsonResult.Msg, '系统提示', [{ title: '确定', callback: function () {
                             if (jsonResult.code != 0) {
                                 self.close();
                             }
                         }
                         }]);
                     }
                 })
             } else {
                 if (!self.vmUserModels.selectedOption()) {
                     self.selRoleName(true);
                 } else {
                     self.selRoleName(false);
                 }
                 self.errors.showAllMessages();
             }
         }
     }

     //获取活动动态模块
     var getUserModules = function () {
         var sendData = {
     }
     var data;
     $.ajax({
         type: "POST",
         url: "/Admin_Enterprise_Role/GetRoleList",
         contentType: "application/json;charset=utf-8", //必须有
         dataType: "json", //表示返回值类型，不必须
         data: JSON.stringify(sendData),
         async: false,
         success: function (jsonResult) {
             data = jsonResult.ObjList;
         }
     });
     return data;
 }

 vmUser.prototype.binding = function () {
     $("#divMessageBox").draggable({ opacity: 0.35, handle: "#divMessageBoxHeader" });
 }
 vmUser.prototype.close = function () {
     dialog.close(this);
 }
 vmUser.show = function (id) {
     var vmObj = new vmUser(id);
     vmObj.init();
     return dialog.show(vmObj);
 };
 return vmUser;
});