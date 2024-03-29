﻿define(['plugins/router', 'knockout', 'jquery', 'knockout.validation', 'utils', 'logininfo', 'plugins/dialog', 'jquery-ui'],
    function (router, ko, $, kv, utils, loginInfo, dialog, jqueryui) {

        var vmCribCode = function () {
            var self = this;

            self.cribName = ko.observable('').extend({
                maxLength: { params: 50, message: "垛位名称最大长度为50个字符" },
                required: { params: true, message: "请输入垛位名称!" }
            });
            self.selCribName = ko.observable(true);

            self.cribCode = ko.observable('').extend({
                maxLength: { params: 50, message: "垛位编码最大长度为50个字符" },
                pattern: { params: /^[0-9a-zA-Z]*$/g, message: "垛位编码格式不正确!" }
            });
            self.selCribCode = ko.observable(true);

            self.AddCrib = function (data, event) {
                var currentObj = $(event.target);
                currentObj.blur();
                self.errors = ko.validation.group(self);
                if (self.errors().length <= 0) {
                    var sendData = {
                        cribName: self.cribName(),
                        cribCode: self.cribCode(),
                        id: 0,
                        type: 3
                    }
                    $.ajax({
                        type: "POST",
                        url: "/Store/AddCrib",
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
                    self.errors.showAllMessages();
                }
            };
        }

        vmCribCode.prototype.binding = function () {
            $("#divMessageBox").draggable({ opacity: 0.35, handle: "#divMessageBoxHeader" });
        }

        vmCribCode.prototype.close = function () {
            dialog.close(this);
        }
        vmCribCode.show = function () {
            return dialog.show(new vmCribCode());
        };

        return vmCribCode;
    });