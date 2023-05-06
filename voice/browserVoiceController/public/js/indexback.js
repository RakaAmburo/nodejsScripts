'use strict';
var app = angular.module('app', []);

app.config(['$httpProvider', function($httpProvider){
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
}
]);

artyom.initialize({
    continuous:true,
    lang:"es-ES",
    debug:false
});

var response = "";
var iqualRespCount = 0;
var keepRecogOn = false;

var settings = {
    continuous:true, // Don't stop never because i have https connection

    onResult:function(text){
        // text = the recognized text
        //console.log(text);
       if(text == response){
           iqualRespCount++;
           
       }
       response = text;
       if(iqualRespCount > 2){
          console.log(text);
          iqualRespCount = 0;
          response = "";
          artyom.clearGarbageCollection();
          UserDictation.stop();
          
       }   
  
    },
    onStart:function(){
        console.log("Dictation started by the user");
    },
    onEnd:function(){
        console.log("Dictation stopped by the user");
        if (keepRecogOn){
          UserDictation.start(); 
          }
    }
};


var UserDictation = artyom.newDictation(settings);

function startRecognition(){
  keepRecogOn = true;
  UserDictation.start();
}

function stopRecognition(){
  keepRecogOn = false;
  UserDictation.stop();
}



var main = function InstListCtrl($scope, $http, $templateCache){
    var serverUrl = 'http://localhost:8096';
    var getUrl = serverUrl + '/api/getInstructions';
    var recOnUrl = serverUrl + '/api/voiceRecord/on';
    var recOffUrl = serverUrl + '/api/voiceRecord/off';
    var insertUrl = serverUrl + '/api/saveInstruction';
    var updateUrl = serverUrl + '/api/updateInstruction';
    var removeUrl = serverUrl + '/api/deleteInstruction';
    var insertMethod = 'POST';
    var updateMethod = 'PUT';
    var removeMethod = 'DELETE';
    $scope.showEdit = false;
    $scope.showLabel= true;

    
    $scope.save = function(){
        var formData = {
            "inst" : this.instruction,
            "desc" : this.description,
            "sim" : this.simil
        };
        this.instruction = '';
        this.description = '';
        this.simil = '';
        
        var data = 'data=' + JSON.stringify(formData);
        httpMethod(insertMethod, insertUrl, data, $templateCache);
        
        $scope.list();
        return false;
    };
    
    $scope.update = function(){
        
        var userData = {
            "inst": this.inst.inst,
            "desc": this.inst.desc,
            "sim": this.inst.sim,
            "id": this.inst.id
        };
        var data = 'data=' + JSON.stringify(userData);
        httpMethod(updateMethod, updateUrl, data, $templateCache);
        $scope.list();
        return false;
    };
    
    $scope.remove = function(){
        var userData = {
            "inst": this.inst.inst,
            "desc": this.inst.desc,
            "sim": this.inst.sim,
            "id": this.inst.id
        };
        var data = 'data=' + JSON.stringify(userData);

        httpMethod(removeMethod, removeUrl, data, $templateCache);
        $scope.list();
        return false;
    };
    
    $scope.list = function(){
        var url = getUrl;
        $http.get(url).success(function(data){
            $scope.instructions = data;
        });
    };

    function httpMethod(method, url, data, templateCache){
        $http({
            method: method,
            url: url,
            data: data,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
            cache: templateCache
        }).
            success(function(response){
                $scope.list();
            }).
            error(function(response){
            });
    }

    $scope.selectUser = function(){
        if(this.showEdit === false){
            this.showEdit = true;
            this.showLabel = false;
        }
    };
    
    
    $scope.record = function(state){
        var urlOn = recOnUrl;
        var urlOff = recOffUrl;
        var recIcon = angular.element( document.querySelector( '#recIcon' ) );
        
        if (state === "on"){
            recIcon.css( "color", "red" );
            var audio = new Audio('/static/sounds/beep1.mp3');
            audio.play();
            $http.get(urlOn).success(function(data){
               console.log("Status: " + data.status);
            });
        }else {
            recIcon.css( "color", "black" );
            var audio = new Audio('/static/sounds/beep2.mp3');
            audio.play();
            $http.get(urlOff).success(function(data){
               console.log("Status: " + data.status);
            });
        }
        
        
    };
    

    $scope.list();
}

app.controller('InstListCtrl', main);
