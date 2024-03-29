﻿define(['plugins/router', 'knockout', 'jquery', 'knockout.validation', 'utils', 'logininfo', 'plugins/dialog', 'jquery-ui', 'baidumap'],
    function (router, ko, $, kv, utils, loginInfo, dialog, jqueryui, baidumap) {
        var isValidateArea = true;
        var isValidateCity = true;
        var map;
        var dealerLocation;
        var getProvinces = function () {
            var data;
            $.ajax({
                type: "POST",
                url: "/Public/GetSheng",
                contentType: "application/json;charset=utf-8", //必须有
                dataType: "json", //表示返回值类型，不必须
                async: false,
                success: function (jsonResult) {
                    data = jsonResult;
                }
            });
            return data;
        }

        var vmDealer = function () {
            var self = this;
            self.dealerName = ko.observable('').extend({
                maxLength: { params: 50, message: "经销商名称最大长度为50个字符" },
                required: { params: true, message: "请输入经销商名称!" }
            });
            self.selDealerName = ko.observable(true);

            self.selDealerssq = ko.observable(false);

            self.dealerAddress = ko.observable('').extend({
                maxLength: { params: 200, message: "名称最大长度为200个字符" },
                required: { params: true, message: "请输入经销商地址!" }
            });
            self.selDealerAddress = ko.observable(false);

            self.dealerPerson = ko.observable('');
            self.dealerPhone = ko.observable('');



            self.AddDealer = function (data, event) {
                var currentObj = $(event.target);
                currentObj.blur();
                self.errors = ko.validation.group(self);
                if (self.errors().length <= 0) {
                    if (!self.province()) {
                        self.selDealerssq(true);
                    }
                    else if (isValidateCity && !self.city()) {
                        self.selDealerssq(true);
                    }
                    else if (isValidateArea && !self.area()) {
                        self.selDealerssq(true);
                    }
                    else {
                        var city = 0;
                        var area = 0;
                        if (self.city()) {
                            city = self.city().Address_ID;
                        }
                        if (self.area()) {
                            area = self.area().Address_ID;
                        }
                        var sendData = {
                            dealerName: self.dealerName(),
                            dealerAddress: self.dealerAddress(),
                            dealerPerson: self.dealerPerson(),
                            dealerLocation: dealerLocation,
                            dealerPhone: self.dealerPhone(),
                            dealerSheng: self.province().Address_ID,
                            dealerShi: city,
                            dealerQu: area
                        }
                        $.ajax({
                            type: "POST",
                            url: "/Admin_Dealer/Add",
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
                    }
                } else {
                    if (!self.province()) {
                        self.selDealerssq(true);
                    }
                    else if (isValidateCity && !self.city()) {
                        self.selDealerssq(true);
                    }
                    else if (isValidateArea && !self.area()) {
                        self.selDealerssq(true);
                    }
                    else {
                        self.selDealerssq(false);
                    }
                    self.errors.showAllMessages();
                }
            };

            self.province = ko.observable();
            self.city = ko.observable();
            self.area = ko.observable();
            self.provinces = [];
            self.citys = ko.observableArray();
            self.areas = ko.observableArray();
            self.province.subscribe(function () {
                var defaultItem = { AddressName: '暂无相应市', Address_ID: '-1' };
                self.city(undefined);
                if (!self.province()) {
                    //self.areas(undefined);
                    self.citys(defaultItem);
                    return;
                }
                var selectedCode = self.province().Address_ID;
                self.dealerAddress(self.province().AddressName);
                var sendData = {
                    pid: selectedCode,
                    level: 2
                };
                $.ajax({
                    type: "POST",
                    url: "/Public/GetAddressSub",
                    contentType: "application/json;charset=utf-8", //必须有
                    dataType: "json", //表示返回值类型，不必须
                    async: false,
                    data: JSON.stringify(sendData),
                    success: function (jsonResult) {
                        self.citys(jsonResult);
                        if (jsonResult[0] == undefined) {
                            isValidateCity = false;
                            isValidateArea = false;
                            self.selDealerssq(false);
                        }
                        else {
                            isValidateCity = true;
                            isValidateArea = true;
                            self.selDealerssq(true);
                        }
                    }
                });
            });
            self.city.subscribe(function () {
                var defaultItem = { AddressName: '暂无相应区/县', Address_ID: '-1' };
                self.area(undefined);
                if (!self.city()) {
                    self.areas(defaultItem);
                    return;
                }
                var selectedCode = self.city().Address_ID;

                self.dealerAddress(self.province().AddressName + self.city().AddressName);

                var sendData = {
                    pid: selectedCode,
                    level: 3
                };
                $.ajax({
                    type: "POST",
                    url: "/Public/GetAddressSub",
                    contentType: "application/json;charset=utf-8", //必须有
                    dataType: "json", //表示返回值类型，不必须
                    async: false,
                    data: JSON.stringify(sendData),
                    success: function (jsonResult) {
                        self.areas(jsonResult);
                        if (jsonResult[0] == undefined) {
                            isValidateArea = false;
                            self.selDealerssq(false);
                        }
                        else {
                            isValidateArea = true;
                            self.selDealerssq(true);
                        }
                    }
                });
            });
            self.area.subscribe(function () {
                if (!self.area() || self.city() == undefined) {
                    self.selDealerssq(true);
                    return;
                }
                self.selDealerssq(false);
                self.dealerAddress(self.province().AddressName + self.city().AddressName + self.area().AddressName);
            });
            self.dealerAddress.subscribe(function () {
                codeAddress(self.dealerAddress());
            });
            self.provinces = getProvinces();
        }


        vmDealer.prototype.binding = function () {
            $("#divMessageBox").draggable({ opacity: 0.35, handle: "#divMessageBoxHeader" });

            setTimeout(function () {
                //self.initMap();
                map = new BMap.Map("map-canvas");
                map.centerAndZoom(new BMap.Point(116.404, 39.915), 13);
                map.addControl(new BMap.NavigationControl());
                map.addControl(new BMap.MapTypeControl());
                map.enableScrollWheelZoom();    //启用滚轮放大缩小，默认禁用
                map.enableContinuousZoom();    //启用地图惯性拖拽，默认禁用
                map.addEventListener("click", function (e) {
                    addMarker(e.point.lng, e.point.lat)
                });
            }, 300);
        }
        function addMarker(lng, lat) {
            map.clearOverlays();
            var pt = new BMap.Point(lng, lat);
            var marker = new BMap.Marker(pt);
            marker.enableDragging();
            map.addOverlay(marker);
            marker.addEventListener("dragend", function (e) {
                dealerLocation = e.point.lng + "," + e.point.lat;
            });
            dealerLocation = lng + "," + lat;
            //alert(self.dealerLocation);
        }
        function codeAddress(address) {
            var options = {
                onSearchComplete: function (results) {
                    if (local.getStatus() == BMAP_STATUS_SUCCESS) {
                        var s = [];
                        if (results.getCurrentNumPois() > 0) {
                            var point = local.getResults().getPoi(0).point; 
                            map.centerAndZoom(point, 15);
                            addMarker(point.lng,point.lat);
                        }
                    }
                }
            };
            var local = new BMap.LocalSearch(map, options);
            local.search(address);
        }

        vmDealer.prototype.close = function () {
            dialog.close(this);
        }
        vmDealer.show = function () {
            return dialog.show(new vmDealer());
        };

        return vmDealer;
    });