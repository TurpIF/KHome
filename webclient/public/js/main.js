"use strict";function FieldCtrl($scope,ModuleService,$rootScope,$timeout){$scope.state="",$scope.update=function(){$scope.state="waiting";var fade=function(){$timeout(function(){$scope.state=""},2e3)};ModuleService.updateField($scope.module,$scope.field,$scope.field.value).then(function(data){$scope.state=data.success?"success":"error",fade()},function(){$scope.state="error",fade()})};var loadValue=function(){return ModuleService.fieldStatus($scope.moduleName,$scope.field.name).then(function(data){$scope.field.value=data.value,$rootScope.$broadcast("fieldUpdate",$scope.field,data)})},pollValue=function(){var updateRate=$scope.field.update_rate||1,poll=$timeout(function doPoll(){loadValue().then(function(){poll=$timeout(doPoll,1e3*updateRate)})},1e3*updateRate);$scope.$on("$destroy",function(){$timeout.cancel(poll)})};pollValue()}function MainCtrl($scope,$location,ModuleService){$scope.modules=[],$scope.reloadModules=function(){ModuleService.installed().then(function(modules){$scope.modules=modules})},$scope.$watch("query",function(){var path=$location.path();$scope.query&&"/store"!=path&&"/modules"!=path&&$location.path("/modules")}),$scope.uninstall=function(module){console.log("uninstalling"),ModuleService.uninstall(module).then(function(){console.log("uninstall success"),module.installed=!1},function(){console.log("uninstall error")})}}function ModuleInjectorCtrl($scope,ModuleService,$routeParams,$compile,$http){$scope.moduleName=$routeParams.moduleName,$scope.module=null;var loadModule=function(){return $scope.loading=!0,ModuleService.moduleStatus($scope.moduleName).then(function(module){return $scope.loading=!1,$scope.unreachable=!1,$scope.module=module,$scope.$broadcast("module.statusUpdate",module),module},function(){$scope.loading=!1,$scope.unreachable=!0})};loadModule(),$http.get("/api/modules/"+$scope.moduleName+"/public/partial.html").then(function(result){$("#inject").html($compile(result.data)($scope))}),$http.get("/api/modules/"+$scope.moduleName+"/public/independant.html").then(function(result){$("#inject-independant").html($compile(result.data)($scope))})}function ModulesCtrl($scope,$location){$scope.reloadModules(),$scope.uninstall=function(module){console.log("uninstalling",module)},$scope.navigate=function(module){$location.path("/modules/"+module.name)}}function RatingCtrl($scope,ModuleService){$scope.$on("module.statusUpdate",function(_,module){ModuleService.getRate(module).then(function(rate){module.rating=rate.value})}),$scope.isRating=!1,$scope.rate=function(){$scope.ratingOk=!1,$scope.isRating=!0,ModuleService.setRate($scope.module,$scope.module.rating).then(function(){$scope.ratingOk=!0,$scope.isRating=!1},function(){$scope.isRating=!1})}}function SettingsCtrl($scope,$location){$scope.reloadModules(),$scope.navigate=function(module){$location.path("/settings/"+module.id)}}function StoreCtrl($scope,ModuleService,$modal,$timeout){$scope.availableModules=[],$scope.reloadAvailableModules=function(){$scope.loading=!0,ModuleService.available().then(function(modules){$scope.availableModules=modules,$scope.loading=!1,$scope.unreachable=!1},function(){$scope.loading=!1,$scope.unreachable=!0})},$scope.reloadAvailableModules(),$scope.modulesInstalling=[],$scope.removeInstallingModule=function(module){for(var i=0;i<$scope.modulesInstalling.length;i++)if($scope.modulesInstalling[i].name==module.name){$timeout(function(){$scope.modulesInstalling.splice(i,1)},1e3);break}},$scope.moduleAlreadyInstalling=function(module){for(var i=0;i<$scope.modulesInstalling.length;i++)if($scope.modulesInstalling[i].name==module.name)return},$scope.install=function(module){$scope.moduleAlreadyInstalling(module)||($scope.modulesInstalling.push(module),ModuleService.installFromCatalog(module).then(function(){$scope.removeInstallingModule(module),module.installed=!0},function(){$scope.removeInstallingModule(module)}))},$scope.uploading=!1,$scope.upload=function(file){$scope.uploading=!0,$scope.upload=ModuleService.installFromFile(file).progress(function(evt){$scope.uploadProgress=parseInt(100*evt.loaded/evt.total)}).success(function(){$scope.uploading=!1,$scope.reloadAvailableModules()}).error(function(){$scope.uploading=!1})},$scope.modalInstances={},$scope.openModal=function(module){var modalScope=$scope.$new(!0);modalScope.dismiss=function(){$scope.modalInstances[module.name].dismiss()},modalScope.install=function(){$scope.install(module),modalScope.dismiss()},modalScope.uninstall=function(){$scope.uninstall(module),modalScope.dismiss()},modalScope.module=module,$scope.modalInstances[module.name]=$modal.open({templateUrl:"modal.html",scope:modalScope}),$scope.$on("$destroy",function(){modalScope.dismiss()})}}function SupervisionCtrl($scope,ModuleService,$timeout,$rootScope){$scope.data=null,$scope.maxData=100;var field=$scope.field,addData=function(data){$scope.data||($scope.data={},$scope.data[field.public_name]=[]);var fieldData=$scope.data[field.public_name];fieldData.length&&fieldData[fieldData.length-1][0]==data.time||(fieldData.push([data.time,data.value]),$scope.maxData<fieldData.length&&fieldData.splice(0,fieldData.length-$scope.maxData))};ModuleService.fieldAllStatus($scope.moduleName,field.name).then(function(data){for(var i=0;i<data.length;i++)addData(data[data.length-i-1])}),$scope.$on("fieldUpdate",function(_,fieldEmit,data){field==fieldEmit&&addData(data)}),$rootScope.$on("$routeChangeSuccess",function(){$scope.data=null})}angular.module("GHome",["ngRoute","ui.bootstrap","ui.slider","angularFileUpload"]).config(function($routeProvider){$routeProvider.when("/home",{templateUrl:"/partials/home.html"}).when("/store",{templateUrl:"/partials/store.html",controller:"StoreCtrl"}).when("/settings",{templateUrl:"/partials/settings.html",controller:"SettingsCtrl"}).when("/settings/:moduleName",{templateUrl:"/partials/module_settings.html"}).when("/modules",{templateUrl:"/partials/modules.html",controller:"ModulesCtrl"}).when("/modules/:moduleName",{templateUrl:"/partials/module_inject.html",controller:"ModuleInjectorCtrl"}).otherwise({redirectTo:"/home"})}),angular.module("GHome").directive("graph",function(){return{restrict:"EA",link:function($scope,elem,attrs){var color_r=(200*Math.random()|0).toString(),color_g=(200*Math.random()|0).toString(),color_b=(200*Math.random()|0).toString(),allData=[],chart=null,opts={zoom:{interactive:!1,amount:1},pan:{interactive:!0,cursor:"move",frameRate:20},xaxis:{zoomRange:!1,panRange:!1,tickSize:1,tickFormatter:function(n){function twoDigits(value){return 10>value?"0"+value:value}var d=new Date(1e3*n),h=twoDigits(d.getHours()),m=twoDigits(d.getMinutes());return h+":"+m}},yaxis:{zoomRange:!1,panRange:!1,tickLength:0},grid:{borderWidth:0,aboveData:!0,markings:[{yaxis:{from:0,to:0},color:"#888"},{xaxis:{from:0,to:0},color:"#888"}]},series:{color:"rgb("+color_r+", "+color_g+", "+color_b+")",shadowSize:0,points:{show:!1},lines:{show:!0,fill:1,fillColor:"rgba("+color_r+", "+color_g+", "+color_b+", 0.25)"}}};$scope.$watch(attrs.graphModel,function(data){var plottedData=[];data instanceof Array?plottedData=data:angular.forEach(data,function(rawData,label){plottedData.push({label:label,data:rawData})}),chart?(chart.setData(plottedData),chart.setupGrid(),chart.draw()):(chart=$.plot(elem,plottedData,opts),elem.css("display","block")),allData.concat(plottedData)},!0),$scope.$watch(attrs.tickSize,function(tick){opts.xaxis.tickSize=tick,chart&&chart.shutdown(),chart=$.plot(elem,allData,opts)},!0)}}}),angular.module("GHome").directive("customInput",function(){return{restrict:"EA",link:function($scope,elem){$scope.$watch("field.state",function(){elem.children().fadeOut(500,function(){elem.children().find(".glyphicon-pencil").fadeIn(500),console.log(elem.children().find(".glyphicon-pencil"))})})}}}),angular.module("GHome").filter("graphable",function(){return function(fields){if(void 0!==fields){for(var re=Array(),i=0;i<fields.length;i++){var field=fields[i];field.readable&&field.graphable&&re.push(field)}return re}}}),angular.module("GHome").filter("truncate",function(){return function(text,length,end){return void 0!==text?(isNaN(length)&&(length=10),void 0===end&&(end="..."),text.length<=length||text.length-end.length<=length?text:String(text).substring(0,length-end.length)+end):void 0}}),angular.module("GHome").filter("moduleVisible",function(){return function(modules){if(void 0!==modules){for(var re=Array(),i=0;i<modules.length;i++){var module=modules[i];module.has_view!==!0&&void 0!==module.has_view||""==module.public_name||void 0===module.public_name||(console.log(module.public_name),re.push(module))}return re}}}),angular.module("GHome").filter("fieldVisible",function(){return function(fields){if(void 0!==fields){for(var re=Array(),i=0;i<fields.length;i++){var field=fields[i];!field.writable&&!field.readable||void 0===field.type||"string"!=field.type&&"numeric"!=field.type&&"boolean"!=field.type||re.push(field)}return re}}}),angular.module("GHome").factory("ModuleService",function($q,$http,$timeout,$upload){var service={},modulesUrl="/api/modules",storeUrl="/api/available_modules",httpPostJSON=function(url,data){var deferred=$q.defer(),formattedData="";for(var key in data)formattedData+=key+"="+data[key]+"&";return formattedData=formattedData.substring(0,formattedData.length-1),$http({url:url,method:"POST",data:formattedData,headers:{"Content-Type":"application/x-www-form-urlencoded"}}).success(function(data){deferred.resolve(data)}).error(function(){deferred.reject()}),deferred.promise},httpGetJSON=function(url){var deferred=$q.defer();return $http.get(url).success(function(data){deferred.resolve(data)}).error(function(){deferred.reject()}),deferred.promise};service.module=function(name){return httpGetJSON(modulesUrl+"/"+name)},service.moduleStatus=function(name){return httpGetJSON(modulesUrl+"/"+name+"/get-status")},service.fieldStatus=function(module_name,field_name){return httpGetJSON(modulesUrl+"/"+module_name+"/fields/"+field_name+"/get-status")},service.fieldAllStatus=function(module_name,field_name){return httpGetJSON(modulesUrl+"/"+module_name+"/fields/"+field_name+"/get-all-statuses")},service.updateField=function(module,field,value){return httpPostJSON(modulesUrl+"/update_field",{name:module.name,field:field.name,value:value})};var getModules=function(url,cachedModules,forceReload){var deferred=$q.defer();return forceReload?deferred.resolve(cachedModules):$http.get(url).success(function(data){cachedModules=data,deferred.resolve(data)}).error(function(){deferred.reject()}),deferred.promise};return service.availableModules=[],service.available=function(forceReload){return getModules(storeUrl,this.availableModules,forceReload)},service.setRate=function(module,oldValue){var value=parseInt(oldValue);return(!value||1>value||value>5)&&console.error("Invalid value",oldValue),httpPostJSON(storeUrl+"/rate",{name:module.name,value:value})},service.getRate=function(module){return httpGetJSON(storeUrl+"/"+module.name+"/rate")},service.installedModules=[],service.installed=function(forceReload){return getModules(modulesUrl,this.installedModules,forceReload)},service.installFromFile=function(file){return $upload.upload({url:modulesUrl+"/install",method:"POST",file:file})},service.installFromCatalog=function(module){return httpPostJSON(modulesUrl+"/install",{name:module.name})},service.uninstall=function(module){return httpPostJSON(modulesUrl+"/uninstall",{name:module.name})},service});